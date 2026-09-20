from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
from app.schemas.auth import UserResponse

class ApplicationStatusEnum(str, Enum):
    PENDING = "pending"
    REVIEWING = "reviewing"
    SHORTLISTED = "shortlisted"
    INTERVIEW = "interview"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: Optional[str] = Field(None, max_length=2000)
    resume_url: Optional[str] = None
    worker_name: Optional[str] = None
    worker_phone: Optional[str] = None
    worker_profession: Optional[str] = None
    worker_experience: Optional[float] = None
    worker_skills: Optional[List[str]] = None

class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatusEnum
    employer_notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    worker_id: int
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    status: ApplicationStatusEnum
    match_score: Optional[float] = None
    match_breakdown: Optional[Dict[str, Any]] = None
    employer_notes: Optional[str] = None
    created_at: datetime
    
    # Nested or enriched data
    worker: Optional[UserResponse] = None
    worker_name: Optional[str] = None
    worker_email: Optional[str] = None
    worker_phone: Optional[str] = None
    worker_profession: Optional[str] = None
    worker_skills: Optional[list] = None
    worker_experience: Optional[float] = None

    job_title: Optional[str] = None
    job_profession: Optional[str] = None
    job_location: Optional[str] = None
    job_salary_min: Optional[float] = None
    job_salary_max: Optional[float] = None
    company_name: Optional[str] = None
    employer_id: Optional[int] = None

    class Config:
        from_attributes = True