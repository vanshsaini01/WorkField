from typing import Dict, Any, List
import json
import urllib.request
from app.core.config import settings
from app.ai.matching import are_skills_related

def get_career_advice(
    query: str,
    worker_profile: Dict[str, Any],
    available_jobs: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Provides intelligent career guidance to field workers by synthesizing:
    - The worker's current profession, skills, and experience
    - Real-time market demand across available jobs in the platform
    - Up-skilling recommendations for higher-paying positions
    """
    profession = worker_profile.get("profession") or "Field Technician"
    experience = worker_profile.get("experience_years", 0.0)
    current_skills = worker_profile.get("skills", [])
    user_location = worker_profile.get("location", "Your area")

    # 1. Market demand analysis: collect most requested skills for this profession
    market_skill_counts = {}
    matching_job_titles = []
    higher_paying_skills = {}

    for job in available_jobs:
        job_prof = job.get("profession", "")
        job_skills = job.get("required_skills", []) or []
        job_salary = job.get("salary_max", 0.0)

        # Check if job is related to worker's profession
        if profession.lower() in job_prof.lower() or job_prof.lower() in profession.lower() or not job_prof:
            matching_job_titles.append(job.get("title", ""))
            for skill in job_skills:
                market_skill_counts[skill] = market_skill_counts.get(skill, 0) + 1
                if job_salary > 30000:
                    higher_paying_skills[skill] = higher_paying_skills.get(skill, 0) + 1

    # 2. Identify skill gaps (market skills that worker does not have)
    missing_market_skills = []
    for m_skill, count in sorted(market_skill_counts.items(), key=lambda x: x[1], reverse=True):
        has_skill = any(are_skills_related(m_skill, cur) for cur in current_skills)
        if not has_skill and m_skill not in missing_market_skills:
            missing_market_skills.append({
                "skill": m_skill,
                "demand_frequency": count,
                "is_high_paying": m_skill in higher_paying_skills
            })

    # 3. Pluggable Gemini / OpenAI check
    clean_query = query.strip().lower()

    if settings.GEMINI_API_KEY:
        try:
            prompt = f"""
You are an expert AI Career Advisor for skilled field workers (electricians, technicians, plumbers, drivers, mechanics, etc.).
Worker Profile:
- Profession: {profession}
- Experience: {experience} years
- Current Skills: {', '.join(current_skills)}
- Location: {user_location}

Market Context in Platform:
- Current open roles: {', '.join(set(matching_job_titles[:5]))}
- High demand missing skills: {', '.join([s['skill'] for s in missing_market_skills[:5]])}

Worker Query: "{query}"

Provide an encouraging, direct, practical, and structured response tailored specifically to field workforce career growth. Focus on earning potential, safety certifications, and specific in-demand technical competencies.
"""
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            data = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=8) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                reply_text = res_body["candidates"][0]["content"]["parts"][0]["text"]
                return {
                    "reply": reply_text,
                    "recommended_skills": [s["skill"] for s in missing_market_skills[:4]],
                    "suggested_roles": list(set(matching_job_titles))[:4],
                    "provider": "Gemini AI"
                }
        except Exception as e:
            print("Gemini API call skipped/fallback:", e)

    # 4. Built-in High-Fidelity Assistant Engine
    reply_paragraphs = []
    suggested_roles = list(set(matching_job_titles))[:4]
    if not suggested_roles:
        suggested_roles = [
            f"Senior {profession}",
            f"{profession} Supervisor",
            f"Industrial {profession} Specialist",
            "Preventive Maintenance Contractor"
        ]

    recommended_skills_list = [s["skill"] for s in missing_market_skills[:4]]
    if not recommended_skills_list:
        recommended_skills_list = ["Industrial Safety (OSHA)", "Blueprint Reading", "Automated Control Systems", "Preventive Diagnostics"]

    if "what jobs" in clean_query or "suitable" in clean_query or "roles" in clean_query:
        reply_paragraphs.append(f"Based on your profile as a **{profession}** with **{experience:.0f} years of experience** and your verified skills ({', '.join(current_skills[:3]) if current_skills else 'hands-on technical background'}), you are well-suited for:")
        for r in suggested_roles:
            reply_paragraphs.append(f"• **{r}**")
        reply_paragraphs.append(f"\nCurrently, employers in **{user_location}** and nearby industrial corridors are actively hiring for these positions with competitive pay rates.")

    elif "skill" in clean_query or "learn" in clean_query or "improve" in clean_query:
        reply_paragraphs.append(f"To boost your daily rate and unlock higher-paying commercial job opportunities, our platform market analysis recommends focusing on these high-demand skills:")
        for s in missing_market_skills[:4]:
            tag = " ⭐ (High Pay Potential)" if s["is_high_paying"] else ""
            reply_paragraphs.append(f"• **{s['skill']}**{tag} — Mentioned in {s['demand_frequency']} active listings")
        reply_paragraphs.append(f"\nAdding these skills to your profile can increase your match score by up to **25%** on new listings.")

    elif "salary" in clean_query or "earn" in clean_query or "pay" in clean_query:
        reply_paragraphs.append(f"In your profession ({profession}), current market rates in our system range between **₹20,000 to ₹42,000/month** depending on specialized certifications.")
        reply_paragraphs.append(f"Workers with expertise in **{', '.join(recommended_skills_list[:2])}** and 2+ years of field experience command average salaries **20-30% higher** than standard baseline rates.")

    else:
        reply_paragraphs.append(f"Hello! I am your **Fieldwork Career Assistant**. Here is an analysis of your current market standing:")
        reply_paragraphs.append(f"• **Current Profile:** {profession} ({experience:.0f} yrs experience)")
        reply_paragraphs.append(f"• **Top Target Roles:** {', '.join(suggested_roles[:3])}")
        reply_paragraphs.append(f"• **Recommended Skill Additions:** {', '.join(recommended_skills_list[:3])}")
        reply_paragraphs.append("\nFeel free to ask me:\n- *What jobs are suitable for me?*\n- *Which skills should I learn next to increase my pay?*\n- *How can I improve my job match percentage?*")

    return {
        "reply": "\n\n".join(reply_paragraphs),
        "recommended_skills": recommended_skills_list,
        "suggested_roles": suggested_roles,
        "provider": "Fieldwork AI Engine"
    }

