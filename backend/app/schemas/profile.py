from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class SkillBase(BaseModel):
    name: str
    category: Optional[str] = None

class SkillCreate(SkillBase):
    pass

class SkillResponse(SkillBase):
    id: int
    class Config:
        from_attributes = True

class ProfessionBase(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None

class ProfessionResponse(ProfessionBase):
    id: int
    class Config:
        from_attributes = True

class WorkerSkillBase(BaseModel):
    skill_name: str
    proficiency_level: Optional[str] = "intermediate"
    years_of_experience: Optional[float] = 1.0

class WorkerSkillResponse(WorkerSkillBase):
    id: int
    class Config:
        from_attributes = True

class WorkerProfileBase(BaseModel):
    title: Optional[str] = None
    profession: Optional[str] = None
    experience_years: Optional[float] = 0.0
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    expected_salary_min: Optional[float] = None
    expected_salary_max: Optional[float] = None
    availability: Optional[str] = "full_time"
    is_available: Optional[bool] = True
    availability_note: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    profile_photo: Optional[str] = None
    resume_url: Optional[str] = None
    resume_text: Optional[str] = None
    certifications: Optional[List[Any]] = []
    skills_raw: Optional[List[str]] = []

class WorkerProfileCreate(WorkerProfileBase):
    pass

class WorkerProfileUpdate(WorkerProfileBase):
    pass

class WorkerAvailabilityUpdate(BaseModel):
    is_available: bool
    availability_note: Optional[str] = None
    availability: Optional[str] = None

class WorkerProfileResponse(WorkerProfileBase):
    id: int
    user_id: int
    worker_name: Optional[str] = None
    worker_email: Optional[str] = None
    profile_completed_percentage: int
    skills: List[WorkerSkillResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EmployerProfileBase(BaseModel):
    company_name: str
    profile_photo: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None

class EmployerProfileCreate(EmployerProfileBase):
    pass

class EmployerProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    profile_photo: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None

class EmployerProfileResponse(EmployerProfileBase):
    id: int
    user_id: int
    verified: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

