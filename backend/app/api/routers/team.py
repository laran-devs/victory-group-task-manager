from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.api import dependencies
from app.models.user import User as UserModel
from app.schemas.user import User, UserCreate
from app.core import security

router = APIRouter()

@router.get("/", response_model=List[User])
async def read_team(
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: UserModel = Depends(dependencies.get_current_user)
):
    result = await db.execute(select(UserModel))
    users = result.scalars().all()
    return users

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_team_member(
    user_in: UserCreate,
    db: AsyncSession = Depends(dependencies.get_db),
    current_superuser: UserModel = Depends(dependencies.get_current_active_superuser)
):
    # Check if user already exists
    result = await db.execute(select(UserModel).filter(UserModel.email == user_in.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с такой почтой уже существует"
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
