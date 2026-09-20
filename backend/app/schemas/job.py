from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any
from enum import Enum

class JobStatusEnum(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    IN_PROGRESS = "in_progress"

class JobCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    profession: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = ""
    required_skills: Optional[List[str]] = []
    experience_years: Optional[float] = 0.0
    salary_min: float = Field(..., ge=0)
    salary_max: float = Field(..., ge=0)
    pay_rate: Optional[float] = None
    job_type: Optional[str] = "Full-time"
    location: str = Field(..., min_length=2, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    remote_or_onsite: Optional[str] = "On-site"
    availability_shift: Optional[str] = "Day Shift"
    deadline: Optional[str] = None
    is_resume_required: Optional[bool] = True

class JobUpdate(BaseModel):
    title: Optional[str] = None
    profession: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    experience_years: Optional[float] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    pay_rate: Optional[float] = None
    job_type: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    remote_or_onsite: Optional[str] = None
    availability_shift: Optional[str] = None
    deadline: Optional[str] = None
    is_resume_required: Optional[bool] = None
    status: Optional[JobStatusEnum] = None

class JobResponse(BaseModel):
    id: int
    title: str
    profession: str
    description: Optional[str] = ""
    required_skills: Optional[List[str]] = []
    experience_years: float
    salary_min: float
    salary_max: float
    pay_rate: Optional[float] = None
    job_type: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    remote_or_onsite: str
    availability_shift: str
    deadline: Optional[str] = None
    is_resume_required: Optional[bool] = True
    status: JobStatusEnum
    employer_id: int
    employer_name: Optional[str] = None
    employer_photo: Optional[str] = None
    created_at: Optional[datetime] = None
    
    # Worker-specific contextual fields
    match_score: Optional[float] = None
    match_breakdown: Optional[dict] = None
    is_saved: Optional[bool] = False
    has_applied: Optional[bool] = False

    class Config:
        from_attributes = True

class SavedJobResponse(BaseModel):
    id: int
    job_id: int
    created_at: datetime
    job: JobResponse

    class Config:
        from_attributes = True