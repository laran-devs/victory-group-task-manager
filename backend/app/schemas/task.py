from pydantic import BaseModel, ConfigDict, field_validator, field_serializer
from pydantic.alias_generators import to_camel
from typing import Optional, Union
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
    project_id: Optional[str] = "global"
    assignee_id: Optional[Union[UUID, str]] = None
    vdl_event_id: Optional[Union[UUID, str]] = None
    deadline: Optional[datetime] = None

    @field_validator("priority", mode="before")
    @classmethod
    def validate_priority(cls, value):
        if not value:
            return TaskPriority.MEDIUM
        priority_map = {
            "Низкий": TaskPriority.LOW,
            "Средний": TaskPriority.MEDIUM,
            "Высокий": TaskPriority.HIGH,
            "Критический": TaskPriority.CRITICAL,
            "LOW": TaskPriority.LOW,
            "MEDIUM": TaskPriority.MEDIUM,
            "HIGH": TaskPriority.HIGH,
            "CRITICAL": TaskPriority.CRITICAL
        }
        if isinstance(value, str):
            return priority_map.get(value, TaskPriority.MEDIUM)
        return value

    @field_serializer("priority", when_used="json")
    def serialize_priority(self, priority: TaskPriority) -> str:
        reverse_map = {
            TaskPriority.LOW: "Низкий",
            TaskPriority.MEDIUM: "Средний",
            TaskPriority.HIGH: "Высокий",
            TaskPriority.CRITICAL: "Критический"
        }
        return reverse_map.get(priority, "Средний")

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class TaskCreate(TaskBase):
    id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee_id: Optional[Union[UUID, str]] = None
    deadline: Optional[datetime] = None

    @field_validator("priority", mode="before")
    @classmethod
    def validate_priority(cls, value):
        if not value:
            return None
        priority_map = {
            "Низкий": TaskPriority.LOW,
            "Средний": TaskPriority.MEDIUM,
            "Высокий": TaskPriority.HIGH,
            "Критический": TaskPriority.CRITICAL,
            "LOW": TaskPriority.LOW,
            "MEDIUM": TaskPriority.MEDIUM,
            "HIGH": TaskPriority.HIGH,
            "CRITICAL": TaskPriority.CRITICAL
        }
        if isinstance(value, str):
            return priority_map.get(value, TaskPriority.MEDIUM)
        return value

    @field_serializer("priority", when_used="json")
    def serialize_priority(self, priority: Optional[TaskPriority]) -> Optional[str]:
        if not priority:
            return None
        reverse_map = {
            TaskPriority.LOW: "Низкий",
            TaskPriority.MEDIUM: "Средний",
            TaskPriority.HIGH: "Высокий",
            TaskPriority.CRITICAL: "Критический"
        }
        return reverse_map.get(priority, "Средний")

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class TaskInDBBase(TaskBase):
    id: str
    created_at: datetime

class Task(TaskInDBBase):
    assignee: Optional[UserSchema] = None
    vdl_event: Optional[VDLEventSchema] = None
