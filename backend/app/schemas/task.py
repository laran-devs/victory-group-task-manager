from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.task import TaskStatus, TaskPriority

from app.schemas.user import User as UserSchema
from app.schemas.vdl_event import VDLEvent as VDLEventSchema

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TO_DO
    priority: TaskPriority = TaskPriority.MEDIUM
    project_id: str
    assignee_id: Optional[UUID] = None
    vdl_event_id: Optional[UUID] = None
    deadline: Optional[datetime] = None

class TaskCreate(TaskBase):
    id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee_id: Optional[UUID] = None
    deadline: Optional[datetime] = None

class TaskInDBBase(TaskBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Task(TaskInDBBase):
    assignee: Optional[UserSchema] = None
    vdl_event: Optional[VDLEventSchema] = None
