import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import dependencies
from app.core import security
from app.core.config import settings
from app.models.user import User as UserModel
from app.schemas.user import User, UserCreate, Token, LoginRequest

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    login_in: LoginRequest,
    db: AsyncSession = Depends(dependencies.get_db)
):
    result = await db.execute(select(UserModel).filter(UserModel.email == login_in.email))
    user = result.scalars().first()
    if not user or not security.verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    
    access_token_expires = datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(dependencies.get_db)
):
    # Check if user already exists
    result = await db.execute(select(UserModel).filter(UserModel.email == user_in.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
        
    db_user = UserModel(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        position=user_in.position
    )
    db.add(db_user)
    try:
        await db.commit()
        await db.refresh(db_user)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_user

@router.get("/me", response_model=User)
async def read_current_user(
    current_user: UserModel = Depends(dependencies.get_current_user)
):
    return current_user
