from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List, Optional, Union
from uuid import UUID

from app.api import dependencies
from app.models.task import Task as TaskModel
from app.schemas.task import Task, TaskCreate, TaskUpdate
from app.api.websockets import manager

router = APIRouter()

async def resolve_assignee_uuid(assignee_id: Optional[Union[UUID, str]], db: AsyncSession) -> Optional[UUID]:
    if not assignee_id:
        return None
        
    from app.models.user import User as UserModel
    
    # Try parsing string to UUID
    target_uuid = None
    if isinstance(assignee_id, UUID):
        target_uuid = assignee_id
    else:
        try:
            target_uuid = UUID(assignee_id)
        except ValueError:
            pass
            
    if target_uuid:
        # Check if user actually exists in the database to prevent Foreign Key crashes
        result = await db.execute(select(UserModel.id).filter(UserModel.id == target_uuid))
        exists = result.scalar()
        if exists:
            return exists
            
    # Handle string IDs from frontend mocks ("1", "2", "3" or logins)
    if assignee_id in ("1", "ivan"):
        result = await db.execute(select(UserModel.id).filter(UserModel.email.like("ivan%")))
        val = result.scalar()
        if val:
            return val
    elif assignee_id in ("3", "petr"):
        result = await db.execute(select(UserModel.id).filter(UserModel.email.like("petr%")))
        val = result.scalar()
        if val:
            return val
            
    # Fallback to the first user in the system if possible, or return None
    result = await db.execute(select(UserModel.id).limit(1))
    return result.scalar()

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

    assignee_uuid = await resolve_assignee_uuid(task_in.assignee_id, db)

    db_task = TaskModel(
        id=task_id,
        assignee_id=assignee_uuid,
        **task_in.model_dump(exclude={"id", "assignee_id"})
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
    if "assignee_id" in update_data:
        update_data["assignee_id"] = await resolve_assignee_uuid(update_data["assignee_id"], db)

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
