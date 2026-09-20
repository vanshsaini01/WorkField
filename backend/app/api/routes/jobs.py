from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional

from app.database.database import get_db
from app.models.job import Job, JobStatus, SavedJob
from app.models.user import User, UserRole
from app.models.profile import WorkerProfile, EmployerProfile
from app.models.application import Application
from app.schemas.job import JobCreate, JobUpdate, JobResponse, SavedJobResponse
from app.api.deps import get_current_user
from app.ai.matching import calculate_match_score

router = APIRouter(prefix="/jobs", tags=["Jobs"])

def enrich_job_with_worker_data(job: Job, worker_user: Optional[User], db: Session) -> dict:
    """Enriches job dictionary with AI match score and saved status for worker."""
    employer = db.query(User).filter(User.id == job.employer_id).first()
    emp_profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == job.employer_id).first()
    company_name = emp_profile.company_name if emp_profile else (employer.full_name if employer else "Employer")
    emp_photo = emp_profile.profile_photo if emp_profile else None

    job_data = {
        "id": job.id,
        "title": job.title,
        "profession": job.profession,
        "description": job.description,
        "required_skills": job.required_skills or [],
        "experience_years": job.experience_years or 0.0,
        "salary_min": job.salary_min or (job.pay_rate or 15000.0),
        "salary_max": job.salary_max or (job.pay_rate or 25000.0),
        "pay_rate": job.pay_rate,
        "job_type": job.job_type or "Full-time",
        "location": job.location,
        "latitude": job.latitude,
        "longitude": job.longitude,
        "remote_or_onsite": job.remote_or_onsite or "On-site",
        "availability_shift": job.availability_shift or "Day Shift",
        "deadline": job.deadline,
        "status": job.status,
        "is_resume_required": getattr(job, "is_resume_required", True),
        "employer_id": job.employer_id,
        "employer_name": company_name,
        "employer_photo": emp_photo,
        "created_at": job.created_at,
        "match_score": None,
        "match_breakdown": None,
        "is_saved": False,
        "has_applied": False,
    }

    if worker_user and worker_user.role == UserRole.WORKER:
        # Check saved
        saved = db.query(SavedJob).filter(SavedJob.worker_id == worker_user.id, SavedJob.job_id == job.id).first()
        job_data["is_saved"] = bool(saved)

        # Check applied
        applied = db.query(Application).filter(Application.worker_id == worker_user.id, Application.job_id == job.id).first()
        job_data["has_applied"] = bool(applied)

        # Compute AI match score
        profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == worker_user.id).first()
        if profile:
            worker_skills = profile.skills_raw or []
            if not worker_skills and profile.skills:
                worker_skills = [s.skill_name for s in profile.skills]
            
            req_skills = job.required_skills or []
            if isinstance(req_skills, str):
                req_skills = [s.strip() for s in req_skills.split(",") if s.strip()]

            score_info = calculate_match_score(
                worker_profession=profile.profession,
                worker_skills=worker_skills,
                worker_experience=profile.experience_years or 0.0,
                worker_location=profile.location,
                worker_lat=profile.latitude,
                worker_lng=profile.longitude,
                worker_expected_salary=profile.expected_salary_min,
                job_profession=job.profession,
                job_skills=req_skills,
                job_experience=job.experience_years or 0.0,
                job_location=job.location,
                job_lat=job.latitude,
                job_lng=job.longitude,
                job_salary_min=job_data["salary_min"],
                job_salary_max=job_data["salary_max"]
            )
            job_data["match_score"] = score_info["overall_match"]
            job_data["match_breakdown"] = score_info

    return job_data


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.EMPLOYER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can create job postings"
        )
    
    clean_desc = (job_in.description or "").strip() or f"{job_in.title} - {job_in.profession} position in {job_in.location}"
    is_resume_req = False if job_in.profession.strip().lower() == "non-professional" else (job_in.is_resume_required if job_in.is_resume_required is not None else True)

    new_job = Job(
        employer_id=current_user.id,
        title=job_in.title,
        profession=job_in.profession,
        description=clean_desc,
        required_skills=job_in.required_skills or [],
        experience_years=job_in.experience_years or 0.0,
        salary_min=job_in.salary_min,
        salary_max=job_in.salary_max,
        pay_rate=job_in.pay_rate or job_in.salary_max,
        job_type=job_in.job_type or "Full-time",
        location=job_in.location,
        latitude=job_in.latitude,
        longitude=job_in.longitude,
        remote_or_onsite=job_in.remote_or_onsite or "On-site",
        availability_shift=job_in.availability_shift or "Day Shift",
        deadline=job_in.deadline,
        is_resume_required=is_resume_req,
        status=JobStatus.OPEN
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return enrich_job_with_worker_data(new_job, current_user, db)


@router.get("/", response_model=List[JobResponse])
def search_jobs(
    q: Optional[str] = Query(None, description="Search query across title, description, skills"),
    profession: Optional[str] = Query(None, description="Filter by profession"),
    location: Optional[str] = Query(None, description="Filter by city/location"),
    min_salary: Optional[float] = Query(None, description="Minimum salary threshold"),
    max_salary: Optional[float] = Query(None, description="Maximum salary threshold"),
    max_experience: Optional[float] = Query(None, description="Maximum experience required"),
    job_type: Optional[str] = Query(None, description="Job type (Full-time, Part-time, Contract, Daily Wage)"),
    status: Optional[str] = Query("open", description="Job status"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    # Current user optional for public browsing
    auth_header: Optional[str] = None
):
    query = db.query(Job)
    if status and status.lower() != "all":
        query = query.filter(Job.status == JobStatus.OPEN)

    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Job.title.ilike(search_pattern),
                Job.description.ilike(search_pattern),
                Job.location.ilike(search_pattern),
                Job.profession.ilike(search_pattern)
            )
        )

    if profession:
        query = query.filter(Job.profession.ilike(f"%{profession.strip()}%"))

    if location:
        query = query.filter(Job.location.ilike(f"%{location.strip()}%"))

    if min_salary is not None:
        query = query.filter(Job.salary_max >= min_salary)

    if max_salary is not None:
        query = query.filter(Job.salary_min <= max_salary)

    if max_experience is not None:
        query = query.filter(Job.experience_years <= max_experience)

    if job_type:
        query = query.filter(Job.job_type.ilike(f"%{job_type.strip()}%"))

    jobs = query.order_by(desc(Job.created_at)).offset(skip).limit(limit).all()

    # Try resolving current worker if token present in request header via get_current_user helper if available
    worker_user = None
    # Enrich jobs
    results = [enrich_job_with_worker_data(j, worker_user, db) for j in jobs]
    return results


@router.get("/employer/my-jobs")
def get_employer_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.EMPLOYER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Employer access required")

    emp_profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
    emp_photo = emp_profile.profile_photo if emp_profile else None
    company_name = emp_profile.company_name if emp_profile else current_user.full_name

    jobs = db.query(Job).filter(Job.employer_id == current_user.id).order_by(desc(Job.created_at)).all()
    results = []
    for job in jobs:
        app_count = db.query(Application).filter(Application.job_id == job.id).count()
        results.append({
            "id": job.id,
            "title": job.title,
            "profession": job.profession,
            "location": job.location,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "job_type": job.job_type,
            "status": job.status.value,
            "created_at": job.created_at,
            "applicant_count": app_count,
            "is_resume_required": getattr(job, "is_resume_required", True),
            "required_skills": job.required_skills or [],
            "employer_id": job.employer_id,
            "employer_name": company_name,
            "employer_photo": emp_photo
        })
    return results


@router.get("/saved/my-saved", response_model=List[JobResponse])
def get_my_saved_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    saved_records = db.query(SavedJob).filter(SavedJob.worker_id == current_user.id).order_by(desc(SavedJob.created_at)).all()
    results = []
    for s in saved_records:
        job = db.query(Job).filter(Job.id == s.job_id).first()
        if job:
            enriched = enrich_job_with_worker_data(job, current_user, db)
            enriched["is_saved"] = True
            results.append(enriched)
    return results


@router.post("/{job_id}/save")
def save_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(SavedJob).filter(SavedJob.worker_id == current_user.id, SavedJob.job_id == job_id).first()
    if not existing:
        saved = SavedJob(worker_id=current_user.id, job_id=job_id)
        db.add(saved)
        db.commit()
    return {"message": "Job saved successfully", "is_saved": True}


@router.delete("/{job_id}/save")
def unsave_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(SavedJob).filter(SavedJob.worker_id == current_user.id, SavedJob.job_id == job_id).delete()
    db.commit()
    return {"message": "Job unsaved successfully", "is_saved": False}


@router.get("/{job_id}", response_model=JobResponse)
def get_job_by_id(
    job_id: int,
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return enrich_job_with_worker_data(job, None, db)


@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_update: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.employer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to update this job")

    for field, value in job_update.model_dump(exclude_unset=True).items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)
    return enrich_job_with_worker_data(job, current_user, db)


@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.employer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")

    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}