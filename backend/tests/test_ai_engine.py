import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from app.ai.matching import calculate_match_score, are_skills_related
from app.ai.resume_analyzer import analyze_resume_text
from app.ai.job_analyzer import analyze_job_description
from app.ai.career_assistant import get_career_advice

def test_skill_synonyms():
    print("Testing skill synonyms...")
    assert are_skills_related("AC repair", "Air conditioning maintenance")
    assert are_skills_related("Wiring", "Electrical Wiring")
    assert are_skills_related("Pipe Fitting", "Plumbing")
    print("[PASS] Skill synonyms matched correctly.")

def test_matching_engine():
    print("Testing 5-pillar matching engine...")
    score_res = calculate_match_score(
        worker_profession="Electrician",
        worker_skills=["Electrical Wiring", "AC Repair", "Industrial Maintenance"],
        worker_experience=3.0,
        worker_location="Roorkee",
        worker_lat=29.8543,
        worker_lng=77.8880,
        worker_expected_salary=25000.0,
        job_profession="Electrician",
        job_skills=["Electrical Wiring", "Industrial Maintenance", "Troubleshooting"],
        job_experience=2.0,
        job_location="Roorkee",
        job_lat=29.8543,
        job_lng=77.8880,
        job_salary_min=22000.0,
        job_salary_max=30000.0
    )
    print(f"Match Score: {score_res['overall_match']}%")
    print(f"Skills Match: {score_res['skills_match']}%")
    print(f"Experience Match: {score_res['experience_match']}%")
    print(f"Explanations: {score_res['explanations']}")
    assert score_res["overall_match"] > 80.0
    assert len(score_res["explanations"]) >= 4
    print("[PASS] 5-pillar matching engine verified.")

def test_resume_analyzer():
    print("Testing AI Resume Analyzer...")
    sample_resume = """
    RAHUL SHARMA
    Email: rahul.sharma@example.com | Phone: 9876543210
    Location: Roorkee, Uttarakhand
    
    PROFESSIONAL SUMMARY
    Certified Industrial Electrician with 3.5 years of experience in 3-phase wiring,
    panel board installation, motor maintenance, and electrical troubleshooting.
    
    SKILLS
    - Electrical Wiring
    - Industrial Maintenance
    - Panel Board Wiring
    - AC Repair
    - Equipment Troubleshooting
    
    EDUCATION & CERTIFICATIONS
    - ITI Electrician (NCVT)
    - Wireman License Grade 1
    """
    res = analyze_resume_text(sample_resume)
    print("Extracted Profession:", res["suggested_profession"])
    print("Extracted Skills:", res["detected_skills"])
    print("Extracted Exp:", res["experience_years"])
    assert "Electrician" in res["suggested_profession"]
    assert res["experience_years"] == 3.5
    assert len(res["detected_skills"]) >= 3
    print("[PASS] AI Resume Analyzer verified.")

def test_job_analyzer():
    print("Testing AI Job Description Analyzer...")
    sample_jd = """
    Urgent Hiring: Industrial Electrician
    We are looking for an experienced electrician for manufacturing unit in Roorkee.
    Requirements:
    - 2+ years of experience in plant maintenance
    - Must know Electrical Wiring and Industrial Maintenance
    - Troubleshooting electrical control panels
    Salary: Rs. 22,000 to Rs. 30,000 per month
    Full-time on-site day shift.
    """
    jd_res = analyze_job_description(sample_jd)
    print("Extracted Title:", jd_res["title"])
    print("Extracted Profession:", jd_res["profession"])
    print("Extracted Skills:", jd_res["required_skills"])
    print("Extracted Salary:", jd_res["salary_min"], "-", jd_res["salary_max"])
    assert jd_res["profession"] == "Electrician"
    assert jd_res["salary_min"] == 22000.0
    assert jd_res["salary_max"] == 30000.0
    print("[PASS] AI Job Description Analyzer verified.")

def test_career_assistant():
    print("Testing AI Career Assistant...")
    worker = {
        "profession": "Electrician",
        "experience_years": 3.0,
        "skills": ["Electrical Wiring", "AC Repair"],
        "location": "Roorkee"
    }
    jobs = [
        {"title": "Industrial Electrician", "profession": "Electrician", "required_skills": ["Electrical Wiring", "Industrial Maintenance", "PLC"], "salary_max": 35000},
        {"title": "Solar PV Installer", "profession": "Solar Technician", "required_skills": ["Solar Installation", "Electrical Wiring"], "salary_max": 28000}
    ]
    advice = get_career_advice("What jobs are suitable for me?", worker, jobs)
    print("Assistant Reply snippet:", advice["reply"][:150])
    assert len(advice["suggested_roles"]) > 0
    print("[PASS] AI Career Assistant verified.")

if __name__ == "__main__":
    test_skill_synonyms()
    test_matching_engine()
    test_resume_analyzer()
    test_job_analyzer()
    test_career_assistant()
    print("\n[ALL AI TESTS PASSED SUCCESSFULLY!]")
