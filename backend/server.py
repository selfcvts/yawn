from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============================================================
# MODELS
# ============================================================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    pass_hash: str
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    bio: str = ""
    streak: int = 0
    last_check_in: Optional[datetime] = None
    posts: int = 0
    rep: int = 0
    role: str = "user"  # user, mod, admin, owner
    profile_picture: Optional[str] = None  # base64 or URL
    profile_banner: Optional[str] = None
    profile_music: Optional[str] = None  # audio URL
    profile_color: Optional[str] = None
    custom_badge: Optional[str] = None
    is_banned: bool = False
    is_muted: bool = False
    muted_until: Optional[datetime] = None
    last_mega_rep: Optional[datetime] = None
    last_mega_dislike: Optional[datetime] = None

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    profile_banner: Optional[str] = None
    profile_music: Optional[str] = None
    profile_color: Optional[str] = None

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: str
    sort_order: int
    admin_only: bool = False  # For "News" category

class Thread(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category_id: str
    title: str
    author: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    pinned: bool = False
    locked: bool = False

class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    thread_id: str
    author: str
    body: str
    rich_content: Optional[dict] = None  # For storing gradient/font/color data
    is_op: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Vote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    username: str
    direction: int  # 1 for up, -1 for down, 10 for mega rep, -10 for mega dislike
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RepDonation(BaseModel):
    from_user: str
    to_user: str
    amount: int

class CustomEmoji(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    image_data: str  # base64
    uploaded_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProfilePost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_username: str  # whose profile this is posted on
    author: str  # who wrote the post
    body: str
    rich_content: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminAction(BaseModel):
    action: str  # ban, mute, give_rep, remove_rep, assign_badge
    target_user: str
    value: Optional[int] = None
    badge_text: Optional[str] = None
    duration_hours: Optional[int] = None

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

async def get_user(username: str) -> Optional[dict]:
    return await db.users.find_one({"username": username}, {"_id": 0})

async def is_admin_or_owner(username: str) -> bool:
    user = await get_user(username)
    return user and user.get("role") in ["admin", "owner"]

async def is_mod_or_above(username: str) -> bool:
    user = await get_user(username)
    return user and user.get("role") in ["mod", "admin", "owner"]

def is_same_day(dt1: Optional[datetime], dt2: datetime) -> bool:
    if not dt1:
        return False
    return (dt1.year == dt2.year and dt1.month == dt2.month and dt1.day == dt2.day)

# ============================================================
# INITIALIZATION - SEED CATEGORIES & OWNER ACCOUNT
# ============================================================

async def init_db():
    # Create categories
    categories_data = [
        {"id": "looksmaxxing", "name": "Looksmaxxing", "description": "General looksmaxxing discussion", "icon": "flame", "sort_order": 1, "admin_only": False},
        {"id": "news", "name": "News", "description": "Official announcements (Admin only)", "icon": "pin", "sort_order": 2, "admin_only": True},
        {"id": "best", "name": "Best of the Best Threads", "description": "Curated excellent content", "icon": "star", "sort_order": 3, "admin_only": False},
        {"id": "looksmaxxing_questions", "name": "Looksmaxxing Questions", "description": "Ask your looksmaxxing questions", "icon": "brain", "sort_order": 4, "admin_only": False},
        {"id": "rate_me", "name": "Rate Me", "description": "Get rated by the community", "icon": "user", "sort_order": 5, "admin_only": False},
        {"id": "off_topic", "name": "Off Topic", "description": "Everything else", "icon": "scroll", "sort_order": 6, "admin_only": False},
        {"id": "different_languages", "name": "Different Languages", "description": "Discussion in other languages", "icon": "globe", "sort_order": 7, "admin_only": False},
    ]
    
    for cat in categories_data:
        existing = await db.categories.find_one({"id": cat["id"]})
        if not existing:
            await db.categories.insert_one(cat)
    
    # Create or upgrade "triste" owner account
    triste = await db.users.find_one({"username": "triste"})
    if not triste:
        # Create new owner account
        owner_user = User(
            username="triste",
            pass_hash=hash_password("3333333333"),
            role="owner",
            custom_badge="👑 OWNER",
            rep=9999
        )
        await db.users.insert_one(owner_user.model_dump())
        logging.info("Created owner account: triste")
    else:
        # Upgrade existing account to owner
        await db.users.update_one(
            {"username": "triste"},
            {"$set": {"role": "owner", "custom_badge": "👑 OWNER"}}
        )
        logging.info("Upgraded triste to owner role")
    
    # Create indexes
    await db.users.create_index("username", unique=True)
    await db.threads.create_index([("category_id", 1), ("created_at", -1)])
    await db.posts.create_index([("thread_id", 1), ("created_at", 1)])
    await db.votes.create_index([("post_id", 1), ("username", 1)])
    await db.profile_posts.create_index([("profile_username", 1), ("created_at", -1)])

@app.on_event("startup")
async def startup_event():
    await init_db()
    logging.info("Database initialized")

# ============================================================
# AUTH ROUTES
# ============================================================

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    if len(user_data.username) < 3 or len(user_data.username) > 20:
        raise HTTPException(status_code=400, detail="Username must be 3-20 characters")
    
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    new_user = User(
        username=user_data.username,
        pass_hash=hash_password(user_data.password)
    )
    
    await db.users.insert_one(new_user.model_dump())
    
    user_response = new_user.model_dump()
    user_response.pop('pass_hash')
    return user_response

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["pass_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("is_banned"):
        raise HTTPException(status_code=403, detail="Account is banned")
    
    user.pop('pass_hash')
    return user

@api_router.get("/users/{username}")
async def get_user_profile(username: str):
    user = await db.users.find_one({"username": username}, {"_id": 0, "pass_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.patch("/users/{username}")
async def update_user_profile(username: str, updates: UserUpdate):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    
    if not update_data:
        return await get_user_profile(username)
    
    await db.users.update_one({"username": username}, {"$set": update_data})
    return await get_user_profile(username)

@api_router.post("/users/{username}/checkin")
async def check_in(username: str):
    user = await db.users.find_one({"username": username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    now = datetime.now(timezone.utc)
    last_check = user.get("last_check_in")
    
    if last_check and is_same_day(last_check, now):
        return {"message": "Already checked in today", "streak": user.get("streak", 0)}
    
    # Check if yesterday
    if last_check:
        yesterday = now - timedelta(days=1)
        if is_same_day(last_check, yesterday):
            new_streak = user.get("streak", 0) + 1
        else:
            new_streak = 1
    else:
        new_streak = 1
    
    await db.users.update_one(
        {"username": username},
        {"$set": {"streak": new_streak, "last_check_in": now}}
    )
    
    return {"message": "Checked in successfully", "streak": new_streak}

# ============================================================
# CATEGORY ROUTES
# ============================================================

@api_router.get("/categories")
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(100)
    return categories

@api_router.get("/categories/{category_id}/thread-count")
async def get_thread_count(category_id: str):
    count = await db.threads.count_documents({"category_id": category_id})
    return {"count": count}

# ============================================================
# THREAD ROUTES
# ============================================================

@api_router.get("/categories/{category_id}/threads")
async def get_threads(category_id: str):
    threads = await db.threads.find(
        {"category_id": category_id}, 
        {"_id": 0}
    ).sort([("pinned", -1), ("created_at", -1)]).to_list(1000)
    
    # Enrich with reply counts and scores
    for thread in threads:
        posts = await db.posts.find({"thread_id": thread["id"]}, {"_id": 0}).to_list(1000)
        thread["replyCount"] = sum(1 for p in posts if not p.get("is_op"))
        
        # Calculate total score
        post_ids = [p["id"] for p in posts]
        votes = await db.votes.find({"post_id": {"$in": post_ids}}, {"_id": 0}).to_list(10000)
        thread["score"] = sum(v.get("direction", 0) for v in votes)
    
    return threads

@api_router.post("/threads")
async def create_thread(
    category_id: str = Form(...),
    title: str = Form(...),
    author: str = Form(...),
    body: str = Form(...),
    rich_content: Optional[str] = Form(None)
):
    # Check if category is admin-only
    category = await db.categories.find_one({"id": category_id})
    if category and category.get("admin_only"):
        if not await is_admin_or_owner(author):
            raise HTTPException(status_code=403, detail="Only admins can post in this category")
    
    # Check if user is muted
    user = await db.users.find_one({"username": author})
    if user and user.get("is_muted"):
        if user.get("muted_until") and user["muted_until"] > datetime.now(timezone.utc):
            raise HTTPException(status_code=403, detail="You are muted")
    
    thread = Thread(
        category_id=category_id,
        title=title,
        author=author
    )
    
    await db.threads.insert_one(thread.model_dump())
    
    # Create OP post
    import json
    rich_data = json.loads(rich_content) if rich_content else None
    
    post = Post(
        thread_id=thread.id,
        author=author,
        body=body,
        rich_content=rich_data,
        is_op=True
    )
    
    await db.posts.insert_one(post.model_dump())
    
    # Increment user post count
    await db.users.update_one({"username": author}, {"$inc": {"posts": 1}})
    
    return thread.model_dump()

@api_router.get("/threads/{thread_id}")
async def get_thread(thread_id: str):
    thread = await db.threads.find_one({"id": thread_id}, {"_id": 0})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    return thread

# ============================================================
# POST ROUTES
# ============================================================

@api_router.get("/threads/{thread_id}/posts")
async def get_posts(thread_id: str):
    posts = await db.posts.find(
        {"thread_id": thread_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(10000)
    
    # Enrich with vote data
    for post in posts:
        votes = await db.votes.find({"post_id": post["id"]}, {"_id": 0}).to_list(10000)
        post["score"] = sum(v.get("direction", 0) for v in votes)
        post["upvoters"] = [v["username"] for v in votes if v.get("direction", 1) > 0]
        post["downvoters"] = [v["username"] for v in votes if v.get("direction", -1) < 0]
    
    return posts

@api_router.post("/posts")
async def create_reply(
    thread_id: str = Form(...),
    author: str = Form(...),
    body: str = Form(...),
    rich_content: Optional[str] = Form(None)
):
    # Check if user is muted
    user = await db.users.find_one({"username": author})
    if user and user.get("is_muted"):
        if user.get("muted_until") and user["muted_until"] > datetime.now(timezone.utc):
            raise HTTPException(status_code=403, detail="You are muted")
    
    import json
    rich_data = json.loads(rich_content) if rich_content else None
    
    post = Post(
        thread_id=thread_id,
        author=author,
        body=body,
        rich_content=rich_data,
        is_op=False
    )
    
    await db.posts.insert_one(post.model_dump())
    
    # Increment user post count
    await db.users.update_one({"username": author}, {"$inc": {"posts": 1}})
    
    return post.model_dump()

# ============================================================
# VOTING & REP ROUTES
# ============================================================

async def validate_mega_vote(user: dict, direction: int, now: datetime) -> None:
    """Validate and update mega vote limits."""
    is_admin = user.get("role") in ["admin", "owner"]
    
    if direction == 10:  # Mega rep
        if not is_admin:
            last_mega = user.get("last_mega_rep")
            if last_mega and is_same_day(last_mega, now):
                raise HTTPException(status_code=429, detail="Mega rep already used today")
        await db.users.update_one({"username": user["username"]}, {"$set": {"last_mega_rep": now}})
    
    elif direction == -10:  # Mega dislike
        if not is_admin:
            last_mega = user.get("last_mega_dislike")
            if last_mega and is_same_day(last_mega, now):
                raise HTTPException(status_code=429, detail="Mega dislike already used today")
        await db.users.update_one({"username": user["username"]}, {"$set": {"last_mega_dislike": now}})

async def process_vote_update(post_id: str, username: str, direction: int, existing: dict, now: datetime) -> dict:
    """Process vote update for existing vote."""
    if existing.get("direction") == direction:
        # Remove vote (toggle off)
        await db.votes.delete_one({"post_id": post_id, "username": username})
        return {"message": "Vote removed"}
    else:
        # Update vote
        await db.votes.update_one(
            {"post_id": post_id, "username": username},
            {"$set": {"direction": direction, "created_at": now}}
        )
        return {"message": "Vote updated"}

async def process_new_vote(post_id: str, username: str, direction: int) -> dict:
    """Process new vote creation."""
    vote = Vote(post_id=post_id, username=username, direction=direction)
    await db.votes.insert_one(vote.model_dump())
    
    # Update post author's rep
    post = await db.posts.find_one({"id": post_id})
    if post:
        await db.users.update_one(
            {"username": post["author"]},
            {"$inc": {"rep": direction}}
        )
    
    return {"message": "Vote cast"}

@api_router.post("/votes")
async def cast_vote(
    post_id: str = Form(...),
    username: str = Form(...),
    direction: int = Form(...)  # 1, -1, 10, -10
):
    # Validate direction
    if direction not in [1, -1, 10, -10]:
        raise HTTPException(status_code=400, detail="Invalid vote direction")
    
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check daily limits for mega votes
    now = datetime.now(timezone.utc)
    if abs(direction) == 10:
        await validate_mega_vote(user, direction, now)
    
    # Check if vote exists
    existing = await db.votes.find_one({"post_id": post_id, "username": username})
    
    if existing:
        return await process_vote_update(post_id, username, direction, existing, now)
    else:
        return await process_new_vote(post_id, username, direction)

@api_router.post("/rep/donate")
async def donate_rep(donation: RepDonation):
    from_user = await db.users.find_one({"username": donation.from_user})
    if not from_user:
        raise HTTPException(status_code=404, detail="Donor not found")
    
    if from_user.get("rep", 0) < donation.amount:
        raise HTTPException(status_code=400, detail="Insufficient rep")
    
    to_user = await db.users.find_one({"username": donation.to_user})
    if not to_user:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Transfer rep
    await db.users.update_one(
        {"username": donation.from_user},
        {"$inc": {"rep": -donation.amount}}
    )
    await db.users.update_one(
        {"username": donation.to_user},
        {"$inc": {"rep": donation.amount}}
    )
    
    return {"message": f"Donated {donation.amount} rep to {donation.to_user}"}

# ============================================================
# PROFILE POST ROUTES
# ============================================================

@api_router.get("/users/{username}/profile-posts")
async def get_profile_posts(username: str):
    """Get all posts on a user's profile"""
    posts = await db.profile_posts.find(
        {"profile_username": username},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return posts

@api_router.post("/users/{username}/profile-posts")
async def create_profile_post(
    username: str,
    author: str = Form(...),
    body: str = Form(...),
    rich_content: Optional[str] = Form(None)
):
    """Post a message on someone's profile"""
    # Check if profile user exists
    profile_user = await db.users.find_one({"username": username})
    if not profile_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if author is muted
    author_user = await db.users.find_one({"username": author})
    if author_user and author_user.get("is_muted"):
        if author_user.get("muted_until") and author_user["muted_until"] > datetime.now(timezone.utc):
            raise HTTPException(status_code=403, detail="You are muted")
    
    import json
    rich_data = json.loads(rich_content) if rich_content else None
    
    profile_post = ProfilePost(
        profile_username=username,
        author=author,
        body=body,
        rich_content=rich_data
    )
    
    await db.profile_posts.insert_one(profile_post.model_dump())
    
    return profile_post.model_dump()

@api_router.delete("/profile-posts/{post_id}")
async def delete_profile_post(post_id: str, username: str = Form(...)):
    """Delete a profile post (only author or profile owner can delete)"""
    post = await db.profile_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user is author, profile owner, or admin
    user = await db.users.find_one({"username": username})
    is_admin = user and user.get("role") in ["admin", "owner"]
    
    if username != post["author"] and username != post["profile_username"] and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    await db.profile_posts.delete_one({"id": post_id})
    return {"message": "Post deleted"}

# ============================================================
# CUSTOM EMOJI ROUTES
# ============================================================

@api_router.get("/emojis/custom")
async def get_custom_emojis():
    emojis = await db.custom_emojis.find({}, {"_id": 0}).to_list(1000)
    return emojis

@api_router.post("/emojis/custom")
async def upload_custom_emoji(
    name: str = Form(...),
    image_data: str = Form(...),
    uploaded_by: str = Form(...)
):
    emoji = CustomEmoji(
        name=name,
        image_data=image_data,
        uploaded_by=uploaded_by
    )
    
    await db.custom_emojis.insert_one(emoji.model_dump())
    return emoji.model_dump()

# ============================================================
# ADMIN ROUTES
# ============================================================

async def handle_ban_action(target_user: str) -> dict:
    """Handle user ban action."""
    await db.users.update_one(
        {"username": target_user},
        {"$set": {"is_banned": True}}
    )
    return {"message": f"Banned {target_user}"}

async def handle_unban_action(target_user: str) -> dict:
    """Handle user unban action."""
    await db.users.update_one(
        {"username": target_user},
        {"$set": {"is_banned": False}}
    )
    return {"message": f"Unbanned {target_user}"}

async def handle_mute_action(target_user: str, duration_hours: int) -> dict:
    """Handle user mute action."""
    muted_until = datetime.now(timezone.utc) + timedelta(hours=duration_hours or 24)
    await db.users.update_one(
        {"username": target_user},
        {"$set": {"is_muted": True, "muted_until": muted_until}}
    )
    return {"message": f"Muted {target_user} for {duration_hours or 24} hours"}

async def handle_unmute_action(target_user: str) -> dict:
    """Handle user unmute action."""
    await db.users.update_one(
        {"username": target_user},
        {"$set": {"is_muted": False, "muted_until": None}}
    )
    return {"message": f"Unmuted {target_user}"}

async def handle_give_rep_action(target_user: str, value: int) -> dict:
    """Handle give rep action."""
    await db.users.update_one(
        {"username": target_user},
        {"$inc": {"rep": value or 0}}
    )
    return {"message": f"Gave {value} rep to {target_user}"}

async def handle_remove_rep_action(target_user: str, value: int) -> dict:
    """Handle remove rep action."""
    await db.users.update_one(
        {"username": target_user},
        {"$inc": {"rep": -(value or 0)}}
    )
    return {"message": f"Removed {value} rep from {target_user}"}

async def handle_assign_badge_action(target_user: str, badge_text: str) -> dict:
    """Handle assign badge action."""
    await db.users.update_one(
        {"username": target_user},
        {"$set": {"custom_badge": badge_text}}
    )
    return {"message": f"Assigned badge to {target_user}"}

# Action handler mapping
ADMIN_ACTION_HANDLERS = {
    "ban": lambda data: handle_ban_action(data.target_user),
    "unban": lambda data: handle_unban_action(data.target_user),
    "mute": lambda data: handle_mute_action(data.target_user, data.duration_hours),
    "unmute": lambda data: handle_unmute_action(data.target_user),
    "give_rep": lambda data: handle_give_rep_action(data.target_user, data.value),
    "remove_rep": lambda data: handle_remove_rep_action(data.target_user, data.value),
    "assign_badge": lambda data: handle_assign_badge_action(data.target_user, data.badge_text),
}

@api_router.post("/admin/action")
async def admin_action(action_data: AdminAction, admin_username: str = Form(...)):
    if not await is_admin_or_owner(admin_username):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    target_user = await db.users.find_one({"username": action_data.target_user})
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
    
    handler = ADMIN_ACTION_HANDLERS.get(action_data.action)
    if not handler:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    return await handler(action_data)

@api_router.post("/threads/{thread_id}/move-to-best")
async def move_to_best(thread_id: str, mod_username: str = Form(...)):
    if not await is_mod_or_above(mod_username):
        raise HTTPException(status_code=403, detail="Moderator access required")
    
    await db.threads.update_one(
        {"id": thread_id},
        {"$set": {"category_id": "best"}}
    )
    
    return {"message": "Thread moved to Best of the Best"}

@api_router.post("/threads/{thread_id}/pin")
async def pin_thread(thread_id: str, admin_username: str = Form(...)):
    if not await is_admin_or_owner(admin_username):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    thread = await db.threads.find_one({"id": thread_id})
    new_pinned = not thread.get("pinned", False)
    
    await db.threads.update_one(
        {"id": thread_id},
        {"$set": {"pinned": new_pinned}}
    )
    
    return {"message": f"Thread {'pinned' if new_pinned else 'unpinned'}"}

# ============================================================
# INCLUDE ROUTER & MIDDLEWARE
# ============================================================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
