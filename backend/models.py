from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# User Management Models
class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user" 
    VIEWER = "viewer"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    password_hash: str
    role: UserRole = UserRole.VIEWER
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    access_codes: List[str] = []
    vpn_config: Optional[Dict[str, Any]] = None

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.VIEWER

class UserLogin(BaseModel):
    username: str
    password: str

# IPTV Models
class ChannelCategory(str, Enum):
    SPORTS = "sports"
    NEWS = "news"
    MOVIES = "movies"
    SERIES = "series"
    KIDS = "kids"
    MUSIC = "music"
    DOCUMENTARY = "documentary"
    GENERAL = "general"

class IPTVChannel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    url: str
    logo_url: Optional[str] = None
    category: ChannelCategory
    country: Optional[str] = None
    language: Optional[str] = None
    is_active: bool = True
    quality: Optional[str] = "HD"
    encryption_key: Optional[str] = None
    created_by: str  # user_id
    created_at: datetime = Field(default_factory=datetime.utcnow)

class IPTVChannelCreate(BaseModel):
    name: str
    url: str
    logo_url: Optional[str] = None
    category: ChannelCategory
    country: Optional[str] = None
    language: Optional[str] = None
    quality: Optional[str] = "HD"

# Playlist Models
class Playlist(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    channels: List[str] = []  # channel_ids
    is_public: bool = False
    created_by: str  # user_id
    created_at: datetime = Field(default_factory=datetime.utcnow)
    access_code: Optional[str] = None
    expiry_date: Optional[datetime] = None

class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    channels: List[str] = []
    is_public: bool = False
    expiry_hours: Optional[int] = None

# Access Code Models
class AccessCode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    playlist_id: str
    created_by: str  # user_id
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    max_uses: Optional[int] = None
    current_uses: int = 0
    is_active: bool = True

class AccessCodeCreate(BaseModel):
    playlist_id: str
    expiry_hours: Optional[int] = 24
    max_uses: Optional[int] = None

# VPN/Proxy Models
class ProxyConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    proxy_type: str  # "http", "socks5", "vpn"
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    config_data: Optional[Dict[str, Any]] = None
    is_active: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProxyConfigCreate(BaseModel):
    name: str
    proxy_type: str
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    config_data: Optional[Dict[str, Any]] = None

# System Models
class SystemStats(BaseModel):
    total_users: int
    total_channels: int
    total_playlists: int
    active_streams: int
    total_access_codes: int
    server_status: Dict[str, Any]

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    role: UserRole