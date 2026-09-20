from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.database.database import get_db
from app.models.user import User, UserRole
from app.models.job import Job, JobStatus
from app.models.profile import WorkerProfile, EmployerProfile
from app.models.application import Application
from app.api.deps import get_current_user
from app.ai.matching import calculate_match_score
from app.ai.recommendation import rank_jobs_for_worker
from app.ai.resume_analyzer import analyze_resume_text, extract_text_from_pdf_bytes
from app.ai.job_analyzer import analyze_job_description
from app.ai.career_assistant import get_career_advice
from app.schemas.job import JobResponse

router = APIRouter(prefix="/ai", tags=["AI Engine"])

class ResumeTextInput(BaseModel):
    resume_text: str

class JobTextInput(BaseModel):
    job_text: str

class CareerQueryInput(BaseModel):
    query: str

@router.post("/analyze-resume")
def analyze_resume_endpoint(
    text_input: ResumeTextInput,
    current_user: User = Depends(get_current_user)
):
    """
    Extracts structured worker profile information from pasted resume text.
    """
    resume_content = text_input.resume_text
    if not resume_content or len(resume_content.strip()) < 10:
        raise HTTPException(status_code=400, detail="Resume text is too short to analyze")

    analysis = analyze_resume_text(resume_content)
    analysis["raw_text_snippet"] = resume_content[:300] + "..."
    return analysis


@router.post("/analyze-resume-file")
async def analyze_resume_file_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Extracts structured worker profile information from uploaded PDF or text file.
    """
    file_bytes = await file.read()
    if file.filename.lower().endswith(".pdf"):
        resume_content = extract_text_from_pdf_bytes(file_bytes)
    else:
        resume_content = file_bytes.decode("utf-8", errors="ignore")

    if not resume_content or len(resume_content.strip()) < 10:
        raise HTTPException(status_code=400, detail="Could not extract readable text from resume file")

    analysis = analyze_resume_text(resume_content)
    analysis["raw_text_snippet"] = resume_content[:300] + "..."
    return analysis


@router.post("/analyze-job")
def analyze_job_endpoint(
    input_data: JobTextInput,
    current_user: User = Depends(get_current_user)
):
    """
    Analyzes raw job descriptions and automatically extracts title, profession,
    skills, experience, location, and salary bounds.
    """
    if not input_data.job_text or len(input_data.job_text.strip()) < 15:
        raise HTTPException(status_code=400, detail="Job description text is too short to analyze")

    return analyze_job_description(input_data.job_text)


@router.get("/recommendations/jobs")
def get_recommended_jobs(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns AI-ranked job recommendations for the authenticated worker.
    """
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    
    worker_skills = []
    worker_exp = 0.0
    worker_prof = None
    worker_loc = None
    worker_salary = None
    worker_lat = None
    worker_lng = None

    if profile:
        worker_skills = profile.skills_raw or [s.skill_name for s in profile.skills]
        worker_exp = profile.experience_years or 0.0
        worker_prof = profile.profession
        worker_loc = profile.location
        worker_salary = profile.expected_salary_min
        worker_lat = profile.latitude
        worker_lng = profile.longitude

    # Get open jobs
    open_jobs = db.query(Job).filter(Job.status == JobStatus.OPEN).all()
    ranked = rank_jobs_for_worker(
        worker_profession=worker_prof,
        worker_skills=worker_skills,
        worker_experience=worker_exp,
        worker_location=worker_loc,
        worker_lat=worker_lat,
        worker_lng=worker_lng,
        worker_expected_salary=worker_salary,
        jobs=open_jobs
    )

    results = []
    for item in ranked[:limit]:
        job = item["job"]
        emp_prof = db.query(EmployerProfile).filter(EmployerProfile.user_id == job.employer_id).first()
        company_name = emp_prof.company_name if emp_prof else "Enterprise Employer"
        employer_photo = emp_prof.profile_photo if emp_prof else None

        results.append({
            "id": job.id,
            "title": job.title,
            "profession": job.profession,
            "description": job.description,
            "required_skills": job.required_skills or [],
            "experience_years": job.experience_years or 0.0,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "vacancies": getattr(job, "vacancies", 1) or 1,
            "job_type": job.job_type,
            "location": job.location,
            "remote_or_onsite": job.remote_or_onsite,
            "availability_shift": job.availability_shift or "Day Shift",
            "deadline": job.deadline,
            "is_resume_required": getattr(job, "is_resume_required", True),
            "employer_id": job.employer_id,
            "employer_name": company_name,
            "employer_photo": employer_photo,
            "created_at": job.created_at,
            "match_score": item["match_score"],
            "match_breakdown": item["match_breakdown"],
        })
    return results


@router.get("/recommendations/candidates/{job_id}")
def get_candidate_recommendations(
    job_id: int,
    limit: int = 15,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ranks potential worker candidates in the entire system for an employer's job.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.employer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    workers = db.query(User).filter(User.role == UserRole.WORKER, User.is_active == True).all()
    req_skills = job.required_skills or []
    if isinstance(req_skills, str):
        req_skills = [s.strip() for s in req_skills.split(",") if s.strip()]

    candidate_ranks = []
    for w in workers:
        prof = w.worker_profile
        w_skills = prof.skills_raw or ([s.skill_name for s in prof.skills] if prof else [])
        w_exp = prof.experience_years or 0.0 if prof else 0.0
        w_prof = prof.profession if prof else None
        w_loc = prof.location if prof else None
        w_salary = prof.expected_salary_min if prof else None

        score_res = calculate_match_score(
            worker_profession=w_prof,
            worker_skills=w_skills,
            worker_experience=w_exp,
            worker_location=w_loc,
            worker_lat=prof.latitude if prof else None,
            worker_lng=prof.longitude if prof else None,
            worker_expected_salary=w_salary,
            job_profession=job.profession,
            job_skills=req_skills,
            job_experience=job.experience_years or 0.0,
            job_location=job.location,
            job_lat=job.latitude,
            job_lng=job.longitude,
            job_salary_min=job.salary_min or 0.0,
            job_salary_max=job.salary_max or 0.0
        )

        candidate_ranks.append({
            "worker_id": w.id,
            "full_name": w.full_name,
            "email": w.email,
            "profile_photo": prof.profile_photo if prof else None,
            "profession": w_prof or "General Worker",
            "experience_years": w_exp,
            "skills": w_skills,
            "location": w_loc or "Not specified",
            "match_score": score_res["overall_match"],
            "match_breakdown": score_res
        })

    candidate_ranks.sort(key=lambda x: x["match_score"], reverse=True)
    return candidate_ranks[:limit]


@router.post("/career-assistant")
def career_assistant_endpoint(
    query_in: CareerQueryInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AI Career Assistant answering worker queries, evaluating market trends,
    and recommending skill additions.
    """
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    worker_data = {
        "profession": profile.profession if profile else "Field Professional",
        "experience_years": profile.experience_years if profile else 1.0,
        "skills": profile.skills_raw or ([s.skill_name for s in profile.skills] if profile else []),
        "location": profile.location if profile else "Roorkee"
    }

    # Fetch available platform jobs
    open_jobs = db.query(Job).filter(Job.status == JobStatus.OPEN).all()
    jobs_data = [
        {
            "title": j.title,
            "profession": j.profession,
            "required_skills": j.required_skills or [],
            "salary_max": j.salary_max or 0.0
        }
        for j in open_jobs
    ]

    return get_career_advice(
        query=query_in.query,
        worker_profile=worker_data,
        available_jobs=jobs_data
    )
