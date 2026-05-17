from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.vdl_event import VDLEventType

class VDLEventBase(BaseModel):
    type: VDLEventType
    message: str
    severity: Optional[str] = None

class VDLEventCreate(VDLEventBase):
    pass

class VDLEventInDBBase(VDLEventBase):
    id: UUID
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class VDLEvent(VDLEventInDBBase):
    pass
