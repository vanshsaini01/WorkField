import re
from typing import Dict, Any, List
from app.ai.resume_analyzer import SKILL_DICTIONARY, INDIAN_CITIES

def analyze_job_description(raw_text: str) -> Dict[str, Any]:
    """
    Parses unstructured job description text and extracts:
    - Job Title
    - Profession
    - Required Skills
    - Experience Required (years)
    - Salary Range (min / max)
    - Job Type (Full-time, Part-time, Contract, etc.)
    - Location
    - Key Responsibilities
    """
    clean_text = raw_text.replace("\r", " ")
    lines = [line.strip() for line in clean_text.split("\n") if line.strip()]

    # 1. Title Heuristic
    title = ""
    for line in lines[:3]:
        if len(line) < 60 and not any(k in line.lower() for k in ["salary", "location", "we are hiring", "urgent requirement"]):
            title = line.replace("Job Title:", "").replace("Title:", "").strip()
            break
    if not title:
        title = "Field Operations Specialist"

    # 2. Profession & Skills Matching
    profession_scores = {prof: 0 for prof in SKILL_DICTIONARY}
    detected_skills = []

    lower_text = clean_text.lower()
    for prof, skills in SKILL_DICTIONARY.items():
        if prof.lower() in lower_text:
            profession_scores[prof] += 3
        for skill in skills:
            if skill.lower() in lower_text:
                if skill not in detected_skills:
                    detected_skills.append(skill)
                profession_scores[prof] += 1

    profession = max(profession_scores, key=profession_scores.get)
    if profession_scores[profession] == 0:
        profession = "Technician"

    if not detected_skills:
        detected_skills = SKILL_DICTIONARY[profession][:3]

    # 3. Experience Required
    exp_required = 1.0
    exp_match = re.search(r'(\d+(?:\.\d+)?)\+?\s*(?:years|year|yrs|yr)\s*(?:of)?\s*(?:experience|exp)?', clean_text, re.IGNORECASE)
    if exp_match:
        try:
            exp_required = float(exp_match.group(1))
        except ValueError:
            pass

    # 4. Salary Min / Max
    salary_min = 20000.0
    salary_max = 30000.0

    # Look for patterns like ₹20,000 - ₹35,000 or 25000 to 35000
    salary_range_match = re.search(r'(?:₹|INR|Rs\.?)\s*([\d,]+)\s*(?:-|to)\s*(?:₹|INR|Rs\.?)?\s*([\d,]+)', clean_text, re.IGNORECASE)
    if salary_range_match:
        try:
            s_min = float(salary_range_match.group(1).replace(",", ""))
            s_max = float(salary_range_match.group(2).replace(",", ""))
            if s_min > 500:
                salary_min = s_min
                salary_max = s_max
        except ValueError:
            pass
    else:
        # Check for single number like ₹25,000 per month
        single_sal = re.search(r'(?:₹|INR|Rs\.?)\s*([\d,]+)', clean_text)
        if single_sal:
            try:
                base = float(single_sal.group(1).replace(",", ""))
                if base > 1000:
                    salary_min = base * 0.9
                    salary_max = base * 1.2
            except ValueError:
                pass

    # 5. Location
    location = "Roorkee, Uttarakhand"
    for city in INDIAN_CITIES:
        if re.search(rf'\b{city}\b', clean_text, re.IGNORECASE):
            location = city
            break

    # 6. Job Type
    job_type = "Full-time"
    if "part-time" in lower_text or "part time" in lower_text:
        job_type = "Part-time"
    elif "contract" in lower_text:
        job_type = "Contract"
    elif "daily wage" in lower_text or "daily basis" in lower_text:
        job_type = "Daily Wage"

    # 7. Responsibilities extraction (lines with dashes, bullets, or after 'responsibilities:')
    responsibilities = []
    for line in lines:
        if line.startswith(("-", "*", "•", "1.", "2.", "3.", "4.", "5.")):
            clean_item = re.sub(r'^[\-\*\•\d\.]+\s*', '', line).strip()
            if len(clean_item) > 10:
                responsibilities.append(clean_item)

    if not responsibilities:
        responsibilities = [
            f"Execute routine {profession.lower()} maintenance and troubleshooting operations",
            "Follow on-site health, safety, and operational standards",
            "Maintain accurate logs and coordinate with field team supervisors"
        ]

    return {
        "title": title,
        "profession": profession,
        "required_skills": detected_skills,
        "experience_years": exp_required,
        "salary_min": salary_min,
        "salary_max": salary_max,
        "job_type": job_type,
        "location": location,
        "responsibilities": responsibilities,
        "description": raw_text.strip()
    }

