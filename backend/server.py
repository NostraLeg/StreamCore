from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse, PlainTextResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timedelta
import base64
from urllib.parse import unquote

# Import our custom modules
from models import *
from auth import *
from iptv_generator import IPTVGenerator, StreamProxy

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize services
iptv_generator = IPTVGenerator(os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001'))
# =======================
# AUTHENTICATION ROUTES
# =======================

@api_router.post("/auth/register", response_model=Token)
async def register_user(user_data: UserCreate):
    """Register new user - Admin access required for non-viewer roles"""
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"username": user_data.username}, {"email": user_data.email}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role
    )
    
    # Insert to database
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role.value}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user_id": user.id,
        "role": user.role
    }

@api_router.post("/auth/login", response_model=Token)
async def login_user(form_data: UserLogin):
    """Login user and return JWT token"""
    # Find user
    user_doc = await db.users.find_one({"username": form_data.username})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    
    # Verify password
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account disabled")
    
    # Update last login
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role.value}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer", 
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user_id": user.id,
        "role": user.role
    }

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# =======================
# IPTV CHANNEL MANAGEMENT
# =======================

@api_router.post("/channels", response_model=IPTVChannel)
async def create_channel(
    channel_data: IPTVChannelCreate,
    current_user: User = Depends(require_role(UserRole.USER))
):
    """Create new IPTV channel"""
    # Validate stream URL
    validation = await iptv_generator.validate_stream_url(channel_data.url)
    if not validation.get("valid", False):
        raise HTTPException(status_code=400, detail=f"Invalid stream URL: {validation.get('error', 'URL not accessible')}")
    
    channel = IPTVChannel(**channel_data.dict(), created_by=current_user.id)
    await db.channels.insert_one(channel.dict())
    
    return channel

@api_router.get("/channels", response_model=List[IPTVChannel])
async def get_channels(
    category: Optional[ChannelCategory] = None,
    country: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get IPTV channels with optional filtering"""
    query = {"is_active": True}
    
    if category:
        query["category"] = category.value
    if country:
        query["country"] = country
    
    channels_docs = await db.channels.find(query).to_list(1000)
    return [IPTVChannel(**doc) for doc in channels_docs]

@api_router.delete("/channels/{channel_id}")
async def delete_channel(
    channel_id: str,
    current_user: User = Depends(admin_required)
):
    """Delete IPTV channel - Admin only"""
    result = await db.channels.delete_one({"id": channel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    return {"message": "Channel deleted successfully"}

@api_router.post("/channels/bulk", response_model=List[IPTVChannel])
async def create_bulk_channels(
    channels_data: List[Dict[str, Any]],
    current_user: User = Depends(require_role(UserRole.USER))
):
    """Create multiple channels from bulk data"""
    created_channels = await iptv_generator.create_bulk_channels(channels_data, current_user.id)
    
    # Insert to database
    for channel in created_channels:
        await db.channels.insert_one(channel.dict())
    
    return created_channels

# =======================
# PLAYLIST MANAGEMENT
# =======================

@api_router.post("/playlists", response_model=Playlist)
async def create_playlist(
    playlist_data: PlaylistCreate,
    current_user: User = Depends(require_role(UserRole.USER))
):
    """Create new playlist"""
    # Validate that all channels exist
    for channel_id in playlist_data.channels:
        channel = await db.channels.find_one({"id": channel_id, "is_active": True})
        if not channel:
            raise HTTPException(status_code=400, detail=f"Channel {channel_id} not found or inactive")
    
    # Create playlist
    playlist_dict = playlist_data.dict()
    expiry_date = None
    if playlist_data.expiry_hours:
        expiry_date = datetime.utcnow() + timedelta(hours=playlist_data.expiry_hours)
    
    playlist = Playlist(
        **{k: v for k, v in playlist_dict.items() if k != "expiry_hours"},
        created_by=current_user.id,
        expiry_date=expiry_date
    )
    
    await db.playlists.insert_one(playlist.dict())
    return playlist

@api_router.get("/playlists", response_model=List[Playlist])
async def get_playlists(current_user: User = Depends(get_current_user)):
    """Get user's playlists"""
    query = {"created_by": current_user.id} if current_user.role != UserRole.ADMIN else {}
    playlists_docs = await db.playlists.find(query).to_list(1000)
    return [Playlist(**doc) for doc in playlists_docs]

# =======================
# ACCESS CODE GENERATION
# =======================

@api_router.post("/access-codes", response_model=AccessCode)
async def generate_access_code(
    code_data: AccessCodeCreate,
    current_user: User = Depends(require_role(UserRole.USER))
):
    """Generate access code for playlist"""
    # Verify playlist exists and user has access
    playlist = await db.playlists.find_one({"id": code_data.playlist_id})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    playlist_obj = Playlist(**playlist)
    if playlist_obj.created_by != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied to this playlist")
    
    # Generate code
    code_string = iptv_generator.generate_access_code()
    expiry_date = datetime.utcnow() + timedelta(hours=code_data.expiry_hours or 24)
    
    access_code = AccessCode(
        code=code_string,
        playlist_id=code_data.playlist_id,
        created_by=current_user.id,
        expires_at=expiry_date,
        max_uses=code_data.max_uses
    )
    
    await db.access_codes.insert_one(access_code.dict())
    return access_code

@api_router.get("/access-codes", response_model=List[AccessCode])
async def get_access_codes(current_user: User = Depends(get_current_user)):
    """Get user's access codes"""
    query = {"created_by": current_user.id} if current_user.role != UserRole.ADMIN else {}
    codes_docs = await db.access_codes.find(query).to_list(1000)
    return [AccessCode(**doc) for doc in codes_docs]

# =======================
# PLAYLIST EXPORT & STREAMING
# =======================

@api_router.get("/playlist/{access_code}/m3u8")
async def get_m3u8_playlist(access_code: str):
    """Get M3U8 playlist using access code"""
    # Validate access code
    code_doc = await db.access_codes.find_one({"code": access_code, "is_active": True})
    if not code_doc:
        raise HTTPException(status_code=404, detail="Invalid access code")
    
    access_code_obj = AccessCode(**code_doc)
    
    # Check expiry
    if access_code_obj.expires_at and datetime.utcnow() > access_code_obj.expires_at:
        raise HTTPException(status_code=410, detail="Access code expired")
    
    # Check usage limit
    if access_code_obj.max_uses and access_code_obj.current_uses >= access_code_obj.max_uses:
        raise HTTPException(status_code=429, detail="Access code usage limit exceeded")
    
    # Get playlist and channels
    playlist_doc = await db.playlists.find_one({"id": access_code_obj.playlist_id})
    if not playlist_doc:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    playlist = Playlist(**playlist_doc)
    
    # Get channels
    channels_docs = await db.channels.find({"id": {"$in": playlist.channels}, "is_active": True}).to_list(1000)
    channels = [IPTVChannel(**doc) for doc in channels_docs]
    
    # Generate M3U8
    m3u8_content = await iptv_generator.generate_m3u8_playlist(
        playlist, channels, access_code_obj.created_by, secure=True
    )
    
    # Update usage count
    await db.access_codes.update_one(
        {"id": access_code_obj.id},
        {"$inc": {"current_uses": 1}}
    )
    
    return PlainTextResponse(content=m3u8_content, media_type="application/vnd.apple.mpegurl")

@api_router.get("/playlist/{access_code}/json")
async def get_json_playlist(access_code: str):
    """Get JSON playlist using access code"""
    # Same validation as M3U8
    code_doc = await db.access_codes.find_one({"code": access_code, "is_active": True})
    if not code_doc:
        raise HTTPException(status_code=404, detail="Invalid access code")
    
    access_code_obj = AccessCode(**code_doc)
    
    if access_code_obj.expires_at and datetime.utcnow() > access_code_obj.expires_at:
        raise HTTPException(status_code=410, detail="Access code expired")
    
    playlist_doc = await db.playlists.find_one({"id": access_code_obj.playlist_id})
    playlist = Playlist(**playlist_doc)
    
    channels_docs = await db.channels.find({"id": {"$in": playlist.channels}, "is_active": True}).to_list(1000)
    channels = [IPTVChannel(**doc) for doc in channels_docs]
    
    json_playlist = await iptv_generator.generate_json_playlist(
        playlist, channels, access_code_obj.created_by
    )
    
    await db.access_codes.update_one(
        {"id": access_code_obj.id},
        {"$inc": {"current_uses": 1}}
    )
    
    return json_playlist

# =======================
# STREAM PROXY ROUTES
# =======================

@api_router.get("/stream/proxy/{token}/{encoded_url}")
async def proxy_stream(token: str, encoded_url: str):
    """Proxy stream through our server for security"""
    try:
        # Decode URL
        decoded_url = unquote(encoded_url)
        
        # Proxy the stream
        stream_data = await stream_proxy.proxy_stream(token, decoded_url)
        
        return StreamingResponse(
            iter([stream_data]),
            media_type="video/mp2t",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-cache"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

# =======================
# ADMIN ROUTES
# =======================

@api_router.get("/admin/stats", response_model=SystemStats)
async def get_system_stats(current_user: User = Depends(admin_required)):
    """Get system statistics - Admin only"""
    total_users = await db.users.count_documents({})
    total_channels = await db.channels.count_documents({"is_active": True})
    total_playlists = await db.playlists.count_documents({})
    total_access_codes = await db.access_codes.count_documents({"is_active": True})
    
    return SystemStats(
        total_users=total_users,
        total_channels=total_channels,
        total_playlists=total_playlists,
        active_streams=0,  # TODO: Implement real-time stream counting
        total_access_codes=total_access_codes,
        server_status={"status": "running", "timestamp": datetime.utcnow().isoformat()}
    )

@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(current_user: User = Depends(admin_required)):
    """Get all users - Admin only"""
    users_docs = await db.users.find({}).to_list(1000)
    return [User(**doc) for doc in users_docs]

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    new_role: UserRole,
    current_user: User = Depends(admin_required)
):
    """Update user role - Admin only"""
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": new_role.value}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User role updated to {new_role.value}"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
stream_proxy = StreamProxy()

# Create the main app without a prefix
app = FastAPI(title="Secure IPTV Manager", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
