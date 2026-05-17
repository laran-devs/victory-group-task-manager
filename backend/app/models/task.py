import uuid
import datetime
from sqlalchemy import Column, String, Enum as SQLEnum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
from sqlalchemy.orm import relationship
import enum

class TaskStatus(str, enum.Enum):
    TO_DO = "TO_DO"
    READY = "READY"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    CUSTOM_1 = "CUSTOM_1"
    CUSTOM_2 = "CUSTOM_2"
    CUSTOM_3 = "CUSTOM_3"
    CUSTOM_4 = "CUSTOM_4"
    CUSTOM_5 = "CUSTOM_5"

class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True) # e.g. VT-XXX
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.TO_DO, nullable=False)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    vdl_event_id = Column(UUID(as_uuid=True), ForeignKey("vdl_events.id"), nullable=True)
    
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    assignee = relationship("User", backref="tasks")
    vdl_event = relationship("VDLEvent", backref="tasks")
    project = relationship("Project", backref="tasks")
