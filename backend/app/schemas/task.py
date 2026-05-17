from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.task import TaskStatus, TaskPriority

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TO_DO
    priority: TaskPriority = TaskPriority.MEDIUM
    project_id: Optional[UUID] = None
    assignee_id: Optional[UUID] = None
    vdl_event_id: Optional[UUID] = None
    deadline: Optional[datetime] = None

class TaskCreate(TaskBase):
    id: str # e.g. VT-101 (Client provides or we generate? Let's assume client/backend generates it. For now required in creation)

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    project_id: Optional[UUID] = None
    assignee_id: Optional[UUID] = None
    deadline: Optional[datetime] = None

class TaskInDBBase(TaskBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Task(TaskInDBBase):
    pass
