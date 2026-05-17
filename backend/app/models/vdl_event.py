import uuid
import datetime
from sqlalchemy import Column, String, Enum as SQLEnum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
import enum

class VDLEventType(str, enum.Enum):
    ROI = "ROI"
    CPL = "CPL"

class VDLEvent(Base):
    __tablename__ = "vdl_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    type = Column(SQLEnum(VDLEventType), nullable=False)
    message = Column(String, nullable=False)
    severity = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
