import sys
import io
import asyncio
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

from httpx import ASGITransport, AsyncClient
from app.main import app

async def test_full_flow():
    print("[*] Starting End-to-End API Integration Verification...")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/")
        assert res.status_code == 200
        print("[PASS] Root endpoint responded:", res.json()["status"])

        # 2. Worker Login (seeded worker: Rahul)
        res = await client.post("/api/auth/login", json={
            "email": "worker@fieldwork.com",
            "password": "worker123"
        })
        assert res.status_code == 200, res.text
        worker_token = res.json()["access_token"]
        print("[PASS] Worker logged in successfully. Token acquired.")

        worker_headers = {"Authorization": f"Bearer {worker_token}"}

        # 3. Get Worker Profile
        res = await client.get("/api/profiles/worker/me", headers=worker_headers)
        assert res.status_code == 200
        profile = res.json()
        print(f"[PASS] Worker profile: {profile['title']} ({profile['profession']}) - {profile['profile_completed_percentage']}% complete")

        # 4. Employer Login (seeded employer: Apex Industrial)
        res = await client.post("/api/auth/login", json={
            "email": "employer@fieldwork.com",
            "password": "employer123"
        })
        assert res.status_code == 200, res.text
        emp_token = res.json()["access_token"]
        emp_headers = {"Authorization": f"Bearer {emp_token}"}
        print("[PASS] Employer logged in successfully.")

        # 5. Search Jobs
        res = await client.get("/api/jobs/?profession=Electrician")
        assert res.status_code == 200
        jobs = res.json()
        assert len(jobs) > 0
        job_id = jobs[0]["id"]
        print(f"[PASS] Found {len(jobs)} jobs for 'Electrician'. Selected job: '{jobs[0]['title']}' (ID: {job_id})")

        # 6. AI Recommended Jobs for Worker
        res = await client.get("/api/ai/recommendations/jobs", headers=worker_headers)
        assert res.status_code == 200
        recs = res.json()
        assert len(recs) > 0
        top_rec = recs[0]
        print(f"[PASS] AI Recommended Job: '{top_rec['title']}' with Match Score: {top_rec['match_score']}%")

        # 7. AI Candidate Ranking for Employer's Job
        res = await client.get(f"/api/applications/job/{job_id}", headers=emp_headers)
        assert res.status_code == 200
        ranked_candidates = res.json()
        assert len(ranked_candidates) > 0
        top_candidate = ranked_candidates[0]
        print(f"[PASS] Ranked Candidate #1: {top_candidate['worker_name']} - Match Score: {top_candidate['match_score']}%")

        # 8. Recruiter Status Update
        app_id = top_candidate["id"]
        res = await client.patch(f"/api/applications/{app_id}/status", json={
            "status": "shortlisted",
            "employer_notes": "Strong background in industrial cabling. Qualified for interview."
        }, headers=emp_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "shortlisted"
        print(f"[PASS] Recruiter updated candidate status to 'shortlisted' with custom note.")

        # 9. AI Career Assistant
        res = await client.post("/api/ai/career-assistant", json={
            "query": "Which skills should I learn?"
        }, headers=worker_headers)
        assert res.status_code == 200
        assistant_data = res.json()
        assert len(assistant_data["recommended_skills"]) > 0
        print(f"[PASS] AI Career Assistant recommended skills: {assistant_data['recommended_skills']}")

        # 10. AI Resume Analyzer
        res = await client.post("/api/ai/analyze-resume", json={
            "resume_text": "Experienced Plumber with 3 years experience in Pipe Fitting, Sanitary Installation, and Leakage Repair in Roorkee."
        }, headers=worker_headers)
        assert res.status_code == 200
        resume_analysis = res.json()
        assert resume_analysis["suggested_profession"] == "Plumber"
        print(f"[PASS] AI Resume Analyzer detected: {resume_analysis['suggested_profession']} with {resume_analysis['experience_years']} yrs experience")

        # 11. AI Job Description Analyzer
        res = await client.post("/api/ai/analyze-job", json={
            "job_text": "Hiring HVAC Technician for Haridwar site. 2+ years exp in AC repair and maintenance. Salary 20000 to 28000."
        }, headers=emp_headers)
        assert res.status_code == 200
        jd_analysis = res.json()
        assert jd_analysis["profession"] == "HVAC Technician"
        print(f"[PASS] AI JD Analyzer parsed: {jd_analysis['profession']} (Salary: {jd_analysis['salary_min']} - {jd_analysis['salary_max']})")

        print("\n=======================================================")
        print(">>> ALL END-TO-END MARKETPLACE APIS VERIFIED! <<<")
        print("=======================================================")

if __name__ == "__main__":
    asyncio.run(test_full_flow())

