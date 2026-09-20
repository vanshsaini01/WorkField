from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.job import Job, JobStatus
from app.models.user import User, UserRole
from app.models.profile import WorkerProfile, EmployerProfile
from app.models.communication import Notification
from app.schemas.application import ApplicationCreate, ApplicationStatusUpdate, ApplicationResponse
from app.api.deps import get_current_user
from app.ai.matching import calculate_match_score

router = APIRouter(prefix="/applications", tags=["Applications"])

def enrich_application_data(app: Application, db: Session) -> dict:
    job = db.query(Job).filter(Job.id == app.job_id).first()
    worker = db.query(User).filter(User.id == app.worker_id).first()
    worker_prof = db.query(WorkerProfile).filter(WorkerProfile.user_id == app.worker_id).first() if worker else None

    company_name = "Employer"
    if job:
        emp_prof = db.query(EmployerProfile).filter(EmployerProfile.user_id == job.employer_id).first()
        if emp_prof:
            company_name = emp_prof.company_name

    skills_list = []
    if worker_prof:
        skills_list = worker_prof.skills_raw or [s.skill_name for s in worker_prof.skills]

    return {
        "id": app.id,
        "job_id": app.job_id,
        "worker_id": app.worker_id,
        "cover_letter": app.cover_letter,
        "resume_url": app.resume_url,
        "status": app.status,
        "match_score": app.match_score,
        "match_breakdown": app.match_breakdown,
        "employer_notes": app.employer_notes,
        "created_at": app.created_at,
        "worker_name": worker.full_name if worker else "Worker",
        "worker_email": worker.email if worker else "",
        "worker_phone": worker_prof.phone if worker_prof else "",
        "worker_profession": worker_prof.profession if worker_prof else "",
        "worker_skills": skills_list,
        "worker_experience": worker_prof.experience_years if worker_prof else 0.0,
        "job_title": job.title if job else "Job",
        "job_profession": job.profession if job else "",
        "job_location": job.location if job else "",
        "job_salary_min": job.salary_min if job else 0.0,
        "job_salary_max": job.salary_max if job else 0.0,
        "company_name": company_name,
        "employer_id": job.employer_id if job else None
    }


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_for_job(
    app_in: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Workers can apply for open jobs.
    """
    if current_user.role != UserRole.WORKER and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workers can apply for jobs"
        )
    
    # Check if job exists and is open
    job = db.query(Job).filter(Job.id == app_in.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != JobStatus.OPEN:
        raise HTTPException(status_code=400, detail="Job is not open for applications")

    # Check for existing application
    existing_app = db.query(Application).filter(
        Application.job_id == app_in.job_id,
        Application.worker_id == current_user.id
    ).first()
    if existing_app:
        raise HTTPException(status_code=400, detail="You have already applied for this job")

    # Check resume requirement
    is_resume_required = getattr(job, "is_resume_required", True)
    if job.profession and job.profession.strip().lower() == "non-professional":
        is_resume_required = False

    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    submitted_resume = app_in.resume_url or (profile.resume_url if profile else None)

    if is_resume_required and not submitted_resume:
        raise HTTPException(
            status_code=400,
            detail="This position requires a resume. Please provide a resume link or attachment."
        )

    # Sync any updated details from worker application to their profile
    if profile:
        if app_in.worker_phone:
            profile.phone = app_in.worker_phone
        if app_in.resume_url:
            profile.resume_url = app_in.resume_url
        if app_in.worker_experience is not None:
            profile.experience_years = app_in.worker_experience
        if app_in.worker_skills:
            profile.skills_raw = app_in.worker_skills

    # Compute AI match score for application record
    match_score = None
    match_breakdown = None

    if profile:
        worker_skills = profile.skills_raw or [s.skill_name for s in profile.skills]
        req_skills = job.required_skills or []
        if isinstance(req_skills, str):
            req_skills = [s.strip() for s in req_skills.split(",") if s.strip()]

        score_res = calculate_match_score(
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
            job_salary_min=job.salary_min or 0.0,
            job_salary_max=job.salary_max or 0.0
        )
        match_score = score_res["overall_match"]
        match_breakdown = score_res

    new_app = Application(
        job_id=app_in.job_id,
        worker_id=current_user.id,
        cover_letter=app_in.cover_letter or "",
        resume_url=submitted_resume,
        status=ApplicationStatus.PENDING,
        match_score=match_score,
        match_breakdown=match_breakdown
    )
    db.add(new_app)

    # Notify Employer
    score_str = f" ({match_score:.0f}% AI Match)" if match_score else ""
    notif = Notification(
        user_id=job.employer_id,
        title=f"New Applicant for {job.title}",
        message=f"{current_user.full_name} applied for '{job.title}'{score_str}.",
        type="application",
        link=f"/employer/jobs/{job.id}/candidates"
    )
    db.add(notif)

    db.commit()
    db.refresh(new_app)
    return enrich_application_data(new_app, db)


@router.get("/my-applications", response_model=List[ApplicationResponse])
def get_my_applications(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Workers view their own job applications with optional status filter.
    """
    query = db.query(Application).filter(Application.worker_id == current_user.id)
    if status and status.lower() != "all":
        query = query.filter(Application.status == status.lower())
    apps = query.order_by(Application.created_at.desc()).all()
    return [enrich_application_data(a, db) for a in apps]


@router.get("/employer/all", response_model=List[ApplicationResponse])
def get_all_employer_applications(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Employers view all candidates across all their posted jobs, with optional status filter.
    """
    if current_user.role != UserRole.EMPLOYER and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only employers can view their candidate pool"
        )

    job_ids = [j.id for j in db.query(Job.id).filter(Job.employer_id == current_user.id).all()]
    if not job_ids:
        return []

    query = db.query(Application).filter(Application.job_id.in_(job_ids))
    if status and status.lower() != "all":
        query = query.filter(Application.status == status.lower())

    apps = query.order_by(Application.match_score.desc(), Application.created_at.desc()).all()
    return [enrich_application_data(a, db) for a in apps]


@router.get("/job/{job_id}", response_model=List[ApplicationResponse])
def get_job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Employers view candidates who applied for their job posting.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.employer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to view candidates for this job")

    # Order candidates by match score descending (AI candidate ranking!)
    apps = db.query(Application).filter(Application.job_id == job_id).order_by(Application.match_score.desc()).all()
    return [enrich_application_data(a, db) for a in apps]


@router.patch("/{app_id}/status", response_model=ApplicationResponse)
def update_application_status(
    app_id: int,
    status_update: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Employers update status (Accepted/Rejected) of an application.
    """
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(Job.id == app.job_id).first()
    if job.employer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to modify this candidate application")

    app.status = ApplicationStatus(status_update.status.value)
    if status_update.employer_notes:
        app.employer_notes = status_update.employer_notes

    # Send Notification to Worker
    notif = Notification(
        user_id=app.worker_id,
        title=f"Application Update: {job.title}",
        message=f"Your application status has changed to: {app.status.value.upper()}.",
        type="status",
        link="/worker/applications"
    )
    db.add(notif)

    db.commit()
    db.refresh(app)
    return enrich_application_data(app, db)