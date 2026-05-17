from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List, Optional

from app.api import dependencies
from app.models.task import Task as TaskModel
from app.schemas.task import Task, TaskCreate, TaskUpdate
from app.api.websockets import manager

router = APIRouter()

@router.get("/", response_model=List[Task])
async def read_tasks(
    project_id: str = "global",
    db: AsyncSession = Depends(dependencies.get_db)
):
    result = await db.execute(
        select(TaskModel)
        .filter(TaskModel.project_id == project_id)
        .options(joinedload(TaskModel.assignee), joinedload(TaskModel.vdl_event))
    )
    tasks = result.scalars().all()
    return tasks

@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(dependencies.get_db)
):
    # If task ID is not provided, automatically generate a unique one (e.g. VT-106)
    if not task_in.id:
        result = await db.execute(select(TaskModel.id).filter(TaskModel.id.like("VT-%")))
        ids = result.scalars().all()
        next_num = 101
        if ids:
            numbers = []
            for t_id in ids:
                try:
                    num = int(t_id.split("-")[1])
                    numbers.append(num)
                except (IndexError, ValueError):
                    pass
            if numbers:
                next_num = max(numbers) + 1
        task_id = f"VT-{next_num}"
    else:
        task_id = task_in.id

    db_task = TaskModel(
        id=task_id,
        **task_in.model_dump(exclude={"id"})
    )
    db.add(db_task)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    # Reload the created task with preloaded assignee and vdl_event relationships
    result = await db.execute(
        select(TaskModel)
        .filter(TaskModel.id == task_id)
        .options(joinedload(TaskModel.assignee), joinedload(TaskModel.vdl_event))
    )
    db_task_full = result.scalars().first()
    
    # Broadcast creation via WebSockets to all clients
    task_data = Task.model_validate(db_task_full).model_dump(mode="json")
    await manager.broadcast_global({
        "event_type": "NEW_TASK",
        "payload": task_data
    })
    return db_task_full

@router.get("/{task_id}", response_model=Task)
async def read_task(
    task_id: str,
    db: AsyncSession = Depends(dependencies.get_db)
):
    result = await db.execute(
        select(TaskModel)
        .filter(TaskModel.id == task_id)
        .options(joinedload(TaskModel.assignee), joinedload(TaskModel.vdl_event))
    )
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
    result = await db.execute(
        select(TaskModel)
        .filter(TaskModel.id == task_id)
        .options(joinedload(TaskModel.assignee), joinedload(TaskModel.vdl_event))
    )
    db_task = result.scalars().first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)
        
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
        
    # Reload to ensure relationships are properly updated and retrieved
    result = await db.execute(
        select(TaskModel)
        .filter(TaskModel.id == task_id)
        .options(joinedload(TaskModel.assignee), joinedload(TaskModel.vdl_event))
    )
    db_task_full = result.scalars().first()
    
    # Broadcast update via WebSockets to all clients
    task_data = Task.model_validate(db_task_full).model_dump(mode="json")
    await manager.broadcast_global({
        "event_type": "TASK_UPDATED",
        "payload": task_data
    })
    return db_task_full

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(dependencies.get_db)
):
    result = await db.execute(select(TaskModel).filter(TaskModel.id == task_id))
    db_task = result.scalars().first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.delete(db_task)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    # Broadcast deletion via WebSockets to all clients
    await manager.broadcast_global({
        "event_type": "TASK_DELETED",
        "payload": {"task_id": task_id}
    })
    return None
