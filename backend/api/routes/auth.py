"""
Authentication endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from core.config import settings
from core.security import verify_password, get_password_hash, create_access_token, verify_token

router = APIRouter()
security = HTTPBearer()

# Simple user store (in production, use a database)
# Initialize admin user lazily to avoid hashing at import time
def init_admin_user():
    if "admin" not in users_db:
        users_db["admin"] = {
            "username": "admin",
            "email": "admin@example.com",
            "hashed_password": get_password_hash("admin123"),  # Default password
            "full_name": "Administrator"
        }

users_db = {}

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str = ""

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/register", response_model=Token)
async def register(user: UserRegister):
    """Register a new user"""
    if user.username in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    users_db[user.username] = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "full_name": user.full_name
    }
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    """Login and get access token"""
    init_admin_user()  # Ensure admin user exists
    db_user = users_db.get(user.username)
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    init_admin_user()  # Ensure admin user exists
    token = credentials.credentials
    payload = verify_token(token)
    username: str = payload.get("sub")
    if username not in users_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return users_db[username]

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "username": current_user["username"],
        "email": current_user["email"],
        "full_name": current_user.get("full_name", "")
    }

