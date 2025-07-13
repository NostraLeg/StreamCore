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
