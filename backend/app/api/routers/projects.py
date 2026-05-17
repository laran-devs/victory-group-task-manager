from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.api import dependencies
from app.models.project import Project as ProjectModel
from app.models.user import User as UserModel
from app.schemas.project import Project, ProjectCreate

router = APIRouter()

@router.get("/", response_model=List[Project])
async def read_projects(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(dependencies.get_db)
):
    result = await db.execute(select(ProjectModel).offset(skip).limit(limit))
    projects = result.scalars().all()
    return projects

@router.post("/", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: UserModel = Depends(dependencies.get_current_user)
):
    db_project = ProjectModel(
        name=project_in.name,
        description=project_in.description,
        owner_id=current_user.id
    )
    db.add(db_project)
    try:
        await db.commit()
        await db.refresh(db_project)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_project
