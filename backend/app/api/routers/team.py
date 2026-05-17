from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.api import dependencies
from app.models.user import User as UserModel
from app.schemas.user import User

router = APIRouter()

@router.get("/", response_model=List[User])
async def read_team(
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: UserModel = Depends(dependencies.get_current_user)
):
    result = await db.execute(select(UserModel))
    users = result.scalars().all()
    return users
