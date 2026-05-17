from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectInDBBase(ProjectBase):
    id: UUID
    owner_id: UUID

    model_config = ConfigDict(from_attributes=True)

class Project(ProjectInDBBase):
    pass
