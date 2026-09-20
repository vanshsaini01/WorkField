from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.ai.matching import calculate_match_score

def compute_text_semantic_similarity(text1: str, text2: str) -> float:
    """Computes TF-IDF cosine similarity between two text snippets."""
    if not text1 or not text2:
        return 0.5
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(score)
    except Exception:
        return 0.5

def rank_jobs_for_worker(
    worker_profession: str,
    worker_skills: List[str],
    worker_experience: float,
    worker_location: str,
    worker_lat: float,
    worker_lng: float,
    worker_expected_salary: float,
    jobs: List[Any]
) -> List[Dict[str, Any]]:
    """
    Ranks a list of Job model objects for a worker by calculating
    individual 5-pillar scores.
    """
    scored_jobs = []
    for job in jobs:
        req_skills = job.required_skills or []
        if isinstance(req_skills, str):
            req_skills = [s.strip() for s in req_skills.split(",") if s.strip()]

        score_data = calculate_match_score(
            worker_profession=worker_profession,
            worker_skills=worker_skills,
            worker_experience=worker_experience,
            worker_location=worker_location,
            worker_lat=worker_lat,
            worker_lng=worker_lng,
            worker_expected_salary=worker_expected_salary,
            job_profession=job.profession,
            job_skills=req_skills,
            job_experience=job.experience_years or 0.0,
            job_location=job.location,
            job_lat=job.latitude,
            job_lng=job.longitude,
            job_salary_min=job.salary_min or 0.0,
            job_salary_max=job.salary_max or 0.0
        )

        scored_jobs.append({
            "job": job,
            "match_score": score_data["overall_match"],
            "match_breakdown": score_data
        })

    # Sort descending by match score
    scored_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    return scored_jobs

def rank_candidates_for_job(
    job: Any,
    applications: List[Any]
) -> List[Dict[str, Any]]:
    """
    Ranks applications for an employer's job posting with AI match scores.
    """
    req_skills = job.required_skills or []
    if isinstance(req_skills, str):
        req_skills = [s.strip() for s in req_skills.split(",") if s.strip()]

    ranked_apps = []
    for app in applications:
        worker = app.worker
        profile = worker.worker_profile if worker else None

        worker_skills = []
        worker_exp = 0.0
        worker_prof = None
        worker_loc = None
        worker_salary = None
        worker_lat = None
        worker_lng = None

        if profile:
            worker_skills = profile.skills_raw or []
            if not worker_skills and profile.skills:
                worker_skills = [s.skill_name for s in profile.skills]
            worker_exp = profile.experience_years or 0.0
            worker_prof = profile.profession
            worker_loc = profile.location
            worker_salary = profile.expected_salary_min
            worker_lat = profile.latitude
            worker_lng = profile.longitude

        match_data = calculate_match_score(
            worker_profession=worker_prof,
            worker_skills=worker_skills,
            worker_experience=worker_exp,
            worker_location=worker_loc,
            worker_lat=worker_lat,
            worker_lng=worker_lng,
            worker_expected_salary=worker_salary,
            job_profession=job.profession,
            job_skills=req_skills,
            job_experience=job.experience_years or 0.0,
            job_location=job.location,
            job_lat=job.latitude,
            job_lng=job.longitude,
            job_salary_min=job.salary_min or 0.0,
            job_salary_max=job.salary_max or 0.0
        )

        ranked_apps.append({
            "application": app,
            "worker": worker,
            "profile": profile,
            "match_score": match_data["overall_match"],
            "match_breakdown": match_data
        })

    ranked_apps.sort(key=lambda x: x["match_score"], reverse=True)
    return ranked_apps

