import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.database.database import get_db
from app.models.user import User, UserRole
from app.models.profile import WorkerProfile, EmployerProfile, Profession, Skill, WorkerSkill, AvailabilityType
from app.models.job import Job, JobStatus
from app.schemas.profile import (
    WorkerProfileResponse, WorkerProfileUpdate, WorkerAvailabilityUpdate,
    EmployerProfileResponse, EmployerProfileUpdate,
    ProfessionResponse, SkillResponse
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/profiles", tags=["Profiles"])

def calculate_completion_percentage(profile: WorkerProfile) -> int:
    score = 20 # Base for having registered
    if profile.title: score += 15
    if profile.profession: score += 15
    if profile.skills_raw or profile.skills: score += 20
    if profile.experience_years and profile.experience_years > 0: score += 10
    if profile.location: score += 10
    if profile.expected_salary_min: score += 10
    return min(100, score)

def enrich_worker_profile(prof: WorkerProfile, db: Session) -> dict:
    user = db.query(User).filter(User.id == prof.user_id).first()
    skills_list = []
    if prof.skills:
        skills_list = [{"id": s.id, "skill_name": s.skill_name, "proficiency_level": s.proficiency_level, "years_of_experience": s.years_of_experience} for s in prof.skills]
    
    avail_val = prof.availability.value if hasattr(prof.availability, "value") else (prof.availability or "full_time")

    return {
        "id": prof.id,
        "user_id": prof.user_id,
        "title": prof.title,
        "profession": prof.profession,
        "experience_years": prof.experience_years or 0.0,
        "location": prof.location,
        "latitude": prof.latitude,
        "longitude": prof.longitude,
        "expected_salary_min": prof.expected_salary_min,
        "expected_salary_max": prof.expected_salary_max,
        "availability": avail_val,
        "is_available": getattr(prof, "is_available", True),
        "availability_note": prof.availability_note,
        "bio": prof.bio,
        "phone": prof.phone,
        "profile_photo": getattr(prof, "profile_photo", None),
        "resume_url": prof.resume_url,
        "resume_text": prof.resume_text,
        "certifications": prof.certifications or [],
        "skills_raw": prof.skills_raw or [s.skill_name for s in prof.skills],
        "skills": skills_list,
        "profile_completed_percentage": prof.profile_completed_percentage,
        "worker_name": user.full_name if user else "Field Worker",
        "worker_email": user.email if user else "",
        "created_at": prof.created_at,
        "updated_at": prof.updated_at
    }

@router.get("/worker/me", response_model=WorkerProfileResponse)
def get_my_worker_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not profile:
        profile = WorkerProfile(
            user_id=current_user.id,
            title=f"{current_user.full_name}",
            profile_completed_percentage=20
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return enrich_worker_profile(profile, db)

@router.get("/worker/{user_id}", response_model=WorkerProfileResponse)
def get_worker_profile_by_user_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Public/viewable profile of a worker accessed when clicking on a worker's name.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Worker user not found")

    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == user_id).first()
    if not profile:
        profile = WorkerProfile(
            user_id=user.id,
            title=user.full_name,
            profile_completed_percentage=20
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return enrich_worker_profile(profile, db)

@router.put("/worker/me", response_model=WorkerProfileResponse)
def update_my_worker_profile(
    profile_in: WorkerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not profile:
        profile = WorkerProfile(user_id=current_user.id)
        db.add(profile)

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if field == "availability" and val:
            try:
                setattr(profile, field, AvailabilityType(val))
            except Exception:
                setattr(profile, field, val)
        else:
            setattr(profile, field, val)

    profile.profile_completed_percentage = calculate_completion_percentage(profile)

    # Sync skills into WorkerSkill table if skills_raw is updated
    if profile_in.skills_raw is not None:
        db.query(WorkerSkill).filter(WorkerSkill.worker_profile_id == profile.id).delete()
        for s in profile_in.skills_raw:
            db.add(WorkerSkill(worker_profile_id=profile.id, skill_name=s.strip()))

    db.commit()
    db.refresh(profile)
    return enrich_worker_profile(profile, db)

@router.patch("/worker/availability", response_model=WorkerProfileResponse)
def update_worker_availability(
    avail_in: WorkerAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not profile:
        profile = WorkerProfile(user_id=current_user.id, is_available=avail_in.is_available)
        db.add(profile)
    
    profile.is_available = avail_in.is_available
    if avail_in.availability_note is not None:
        profile.availability_note = avail_in.availability_note
    if avail_in.availability:
        try:
            profile.availability = AvailabilityType(avail_in.availability)
        except Exception:
            pass

    db.commit()
    db.refresh(profile)
    return enrich_worker_profile(profile, db)

@router.get("/workers/available", response_model=List[WorkerProfileResponse])
def get_available_workers(
    profession: Optional[str] = None,
    location: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Employers can search and filter available workers by profession, location, or trade skills.
    """
    query = db.query(WorkerProfile).filter(WorkerProfile.is_available == True)
    if profession and profession.lower() != "all":
        query = query.filter(WorkerProfile.profession.ilike(f"%{profession.strip()}%"))
    if location:
        query = query.filter(WorkerProfile.location.ilike(f"%{location.strip()}%"))
    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                WorkerProfile.title.ilike(search_pattern),
                WorkerProfile.profession.ilike(search_pattern),
                WorkerProfile.bio.ilike(search_pattern)
            )
        )
    profiles = query.order_by(WorkerProfile.experience_years.desc()).all()
    return [enrich_worker_profile(p, db) for p in profiles]

@router.get("/employer/me", response_model=EmployerProfileResponse)
def get_my_employer_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
    if not profile:
        profile = EmployerProfile(
            user_id=current_user.id,
            company_name=f"{current_user.full_name}'s Enterprise",
            verified=False
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/employer/me", response_model=EmployerProfileResponse)
def update_my_employer_profile(
    profile_in: EmployerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
    if not profile:
        profile = EmployerProfile(
            user_id=current_user.id,
            company_name=profile_in.company_name or current_user.full_name
        )
        db.add(profile)

    for field, val in profile_in.model_dump(exclude_unset=True).items():
        setattr(profile, field, val)

    db.commit()
    db.refresh(profile)
    return profile

@router.get("/company/{employer_id}")
def get_company_profile(
    employer_id: int,
    db: Session = Depends(get_db)
):
    """
    Public company profile accessed by clicking company name on any job card.
    """
    emp_user = db.query(User).filter(User.id == employer_id).first()
    if not emp_user:
        raise HTTPException(status_code=404, detail="Company not found")

    profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == employer_id).first()
    company_name = profile.company_name if profile else emp_user.full_name

    jobs = db.query(Job).filter(Job.employer_id == employer_id, Job.status == JobStatus.OPEN).all()

    return {
        "employer_id": employer_id,
        "company_name": company_name,
        "industry": profile.industry if profile else "Industrial Infrastructure & Logistics",
        "company_size": profile.company_size if profile else "11-50 Employees",
        "description": profile.description if profile else f"{company_name} is a verified enterprise hiring skilled and field workforce on WorkForce AI.",
        "website": profile.website if profile else None,
        "location": profile.location if profile else "Uttarakhand, India",
        "phone": profile.phone if profile else None,
        "profile_photo": getattr(profile, "profile_photo", None) if profile else None,
        "verified": profile.verified if profile else True,
        "active_jobs_count": len(jobs),
        "jobs": [
            {
                "id": j.id,
                "title": j.title,
                "profession": j.profession,
                "location": j.location,
                "salary_min": j.salary_min,
                "salary_max": j.salary_max,
                "job_type": j.job_type,
                "is_resume_required": getattr(j, "is_resume_required", True)
            } for j in jobs
        ]
    }

@router.post("/upload-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files (JPEG, PNG, WEBP) are allowed")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    target_dir = os.path.join(os.getcwd(), "uploads", "photos")
    os.makedirs(target_dir, exist_ok=True)
    file_path = os.path.join(target_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    photo_url = f"/uploads/photos/{unique_filename}"
    
    # Save to user's active profile
    worker_prof = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if worker_prof:
        worker_prof.profile_photo = photo_url
        
    emp_prof = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
    if emp_prof:
        emp_prof.profile_photo = photo_url
        
    db.commit()
            
    return {"photo_url": photo_url}

@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ext = file.filename.split(".")[-1] if "." in file.filename else "pdf"
    unique_filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    target_dir = os.path.join(os.getcwd(), "uploads", "resumes")
    os.makedirs(target_dir, exist_ok=True)
    file_path = os.path.join(target_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    resume_url = f"/uploads/resumes/{unique_filename}"
    
    worker_prof = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if worker_prof:
        worker_prof.resume_url = resume_url
        db.commit()
        
    return {"resume_url": resume_url, "filename": file.filename}

@router.get("/professions", response_model=List[ProfessionResponse])
def get_professions(db: Session = Depends(get_db)):
    return db.query(Profession).all()

@router.get("/skills", response_model=List[SkillResponse])
def get_skills(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Skill)
    if category:
        query = query.filter(Skill.category == category)
    return query.limit(50).all()
