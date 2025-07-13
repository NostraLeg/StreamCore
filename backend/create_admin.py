#!/usr/bin/env python3
"""
Script to create default admin user for Secure IPTV
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
from models import User, UserRole
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_admin_user():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Check if admin already exists
    existing_admin = await db.users.find_one({"username": "admin"})
    if existing_admin:
        print("Admin user already exists!")
        return
    
    # Create admin user
    admin_user = User(
        username="admin",
        email="admin@secureiptv.com",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    
    await db.users.insert_one(admin_user.dict())
    print("✅ Admin user created successfully!")
    print("Username: admin")
    print("Password: admin123")
    print("Role: admin")
    
    # Create demo users
    demo_users = [
        {
            "username": "user",
            "email": "user@secureiptv.com", 
            "password": "user123",
            "role": UserRole.USER
        },
        {
            "username": "viewer",
            "email": "viewer@secureiptv.com",
            "password": "viewer123", 
            "role": UserRole.VIEWER
        }
    ]
    
    for user_data in demo_users:
        existing_user = await db.users.find_one({"username": user_data["username"]})
        if not existing_user:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                password_hash=get_password_hash(user_data["password"]),
                role=user_data["role"],
                is_active=True
            )
            await db.users.insert_one(user.dict())
            print(f"✅ {user_data['role'].value} user '{user_data['username']}' created!")
    
    # Create demo channels
    demo_channels = [
        {
            "name": "Demo Sports Channel",
            "url": "https://demo-iptv.com/sports.m3u8",
            "category": "sports",
            "country": "France",
            "language": "French",
            "quality": "HD",
            "created_by": admin_user.id
        },
        {
            "name": "Demo News Channel", 
            "url": "https://demo-iptv.com/news.m3u8",
            "category": "news",
            "country": "France",
            "language": "French", 
            "quality": "HD",
            "created_by": admin_user.id
        },
        {
            "name": "Demo Movies Channel",
            "url": "https://demo-iptv.com/movies.m3u8", 
            "category": "movies",
            "country": "France",
            "language": "French",
            "quality": "FHD",
            "created_by": admin_user.id
        }
    ]
    
    from models import IPTVChannel, ChannelCategory
    for channel_data in demo_channels:
        existing_channel = await db.channels.find_one({"name": channel_data["name"]})
        if not existing_channel:
            channel = IPTVChannel(
                name=channel_data["name"],
                url=channel_data["url"],
                category=ChannelCategory(channel_data["category"]),
                country=channel_data["country"],
                language=channel_data["language"],
                quality=channel_data["quality"],
                created_by=channel_data["created_by"]
            )
            await db.channels.insert_one(channel.dict())
            print(f"✅ Demo channel '{channel_data['name']}' created!")
    
    client.close()
    print("\n🎬 Secure IPTV setup complete!")
    print("You can now login with the admin credentials.")

if __name__ == "__main__":
    asyncio.run(create_admin_user())