from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.api import dependencies
from app.models.task import Task as TaskModel
from app.schemas.task import Task, TaskCreate, TaskUpdate
from app.api.websockets import manager

router = APIRouter()

@router.get("/", response_model=List[Task])
async def read_tasks(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(dependencies.get_db)
):
    result = await db.execute(select(TaskModel).offset(skip).limit(limit))
    tasks = result.scalars().all()
    return tasks

@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(dependencies.get_db)
):
    db_task = TaskModel(**task_in.model_dump())
    db.add(db_task)
    try:
        await db.commit()
        await db.refresh(db_task)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    # Broadcast creation via WebSockets
    task_data = Task.model_validate(db_task).model_dump(mode="json")
    await manager.broadcast_to_project(
        str(db_task.project_id),
        {
            "event_type": "NEW_TASK",
            "payload": task_data
        }
    )
    return db_task

@router.get("/{task_id}", response_model=Task)
async def read_task(
    task_id: str,
    db: AsyncSession = Depends(dependencies.get_db)
):
    result = await db.execute(select(TaskModel).filter(TaskModel.id == task_id))
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.patch("/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(dependencies.get_db)
):
    result = await db.execute(select(TaskModel).filter(TaskModel.id == task_id))
    db_task = result.scalars().first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)
        
    await db.commit()
    await db.refresh(db_task)
    
    # Broadcast update via WebSockets
    task_data = Task.model_validate(db_task).model_dump(mode="json")
    await manager.broadcast_to_project(
        str(db_task.project_id),
        {
            "event_type": "TASK_UPDATED",
            "payload": task_data
        }
    )
    return db_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(dependencies.get_db)
):
    result = await db.execute(select(TaskModel).filter(TaskModel.id == task_id))
    db_task = result.scalars().first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project_id = str(db_task.project_id)
    await db.delete(db_task)
    await db.commit()
    
    # Broadcast deletion via WebSockets
    await manager.broadcast_to_project(
        project_id,
        {
            "event_type": "TASK_DELETED",
            "payload": {"task_id": task_id}
        }
    )
    return None
