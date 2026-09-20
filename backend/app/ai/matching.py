import math
from typing import Dict, Any, List, Optional
from difflib import SequenceMatcher

# Common skill synonym mappings for field workforce
SYNONYM_GROUPS = [
    {"ac repair", "air conditioning maintenance", "hvac", "ac servicing", "cooling systems", "refrigeration"},
    {"electrical wiring", "wiring", "circuit repair", "house wiring", "industrial wiring", "panel board"},
    {"plumbing", "pipe fitting", "drainage repair", "sanitary installation", "leakage repair", "water supply"},
    {"driving", "heavy vehicle driving", "commercial driving", "chauffeur", "truck driving", "forklift operator"},
    {"welding", "arc welding", "tig welding", "mig welding", "gas cutting", "metal fabrication"},
    {"carpentry", "woodwork", "furniture making", "cabinetry", "framing", "interior wood finishing"},
    {"masonry", "bricklaying", "concreting", "plastering", "tile laying", "construction labor"},
    {"troubleshooting", "maintenance", "preventive maintenance", "equipment diagnosis", "repair"},
    {"cctv installation", "security system installation", "cctv repair", "alarm systems", "networking"},
    {"solar installation", "solar panel setup", "photovoltaic systems", "solar inverter maintenance"},
]

def string_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()

def are_skills_related(skill1: str, skill2: str) -> bool:
    s1, s2 = skill1.lower().strip(), skill2.lower().strip()
    if s1 == s2 or s1 in s2 or s2 in s1:
        return True
    if string_similarity(s1, s2) > 0.75:
        return True
    for group in SYNONYM_GROUPS:
        if any(item in s1 or s1 in item for item in group) and any(item in s2 or s2 in item for item in group):
            return True
    return False

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two GPS coordinates."""
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_match_score(
    worker_profession: Optional[str],
    worker_skills: List[str],
    worker_experience: float,
    worker_location: Optional[str],
    worker_lat: Optional[float],
    worker_lng: Optional[float],
    worker_expected_salary: Optional[float],
    job_profession: Optional[str],
    job_skills: List[str],
    job_experience: float,
    job_location: Optional[str],
    job_lat: Optional[float],
    job_lng: Optional[float],
    job_salary_min: float,
    job_salary_max: float
) -> Dict[str, Any]:
    """
    Computes a 5-pillar intelligent match score (0 - 100%) and generates
    detailed transparent explanations.
    Weights:
      - Skills: 35%
      - Experience: 25%
      - Location: 15%
      - Salary: 15%
      - Profession: 10%
    """
    explanations = []

    # 1. Profession Match (10%)
    prof_score = 0.0
    w_prof = (worker_profession or "").strip().lower()
    j_prof = (job_profession or "").strip().lower()
    if not w_prof or not j_prof:
        prof_score = 50.0
    elif w_prof == j_prof:
        prof_score = 100.0
        explanations.append(f"✓ Exact profession match: {job_profession}")
    elif w_prof in j_prof or j_prof in w_prof or string_similarity(w_prof, j_prof) > 0.6:
        prof_score = 85.0
        explanations.append(f"✓ Closely related profession: {worker_profession} to {job_profession}")
    else:
        prof_score = 30.0
        explanations.append(f"△ Different profession category ({worker_profession} vs {job_profession})")

    # 2. Skills Match (35%)
    skills_score = 0.0
    matched_skills = []
    missing_skills = []

    if not job_skills:
        skills_score = 85.0
        explanations.append("✓ General skill profile fits open requirements")
    else:
        for req in job_skills:
            req_matched = False
            for w_skill in worker_skills:
                if are_skills_related(req, w_skill):
                    req_matched = True
                    matched_skills.append(f"{w_skill} ({req})")
                    break
            if not req_matched:
                missing_skills.append(req)

        matched_ratio = len(matched_skills) / len(job_skills)
        skills_score = round(matched_ratio * 100, 1)

        if matched_ratio >= 0.8:
            explanations.append(f"✓ Strong skills match: {len(matched_skills)}/{len(job_skills)} required skills matched")
        elif matched_ratio >= 0.5:
            explanations.append(f"✓ Partial skills match: {len(matched_skills)}/{len(job_skills)} skills matched")
        else:
            explanations.append(f"△ Skill gaps detected: Missing {', '.join(missing_skills[:3])}")

    # 3. Experience Match (25%)
    exp_score = 0.0
    if job_experience <= 0:
        exp_score = 100.0
        explanations.append("✓ No minimum experience required; suitable for your level")
    elif worker_experience >= job_experience:
        exp_score = 100.0
        explanations.append(f"✓ Exceeds required experience: {worker_experience} yrs vs {job_experience} yrs required")
    else:
        exp_score = round(max(20.0, (worker_experience / job_experience) * 100), 1)
        explanations.append(f"△ Has {worker_experience} yrs experience; {job_experience} yrs preferred")

    # 4. Location Match (15%)
    loc_score = 0.0
    w_loc = (worker_location or "").strip().lower()
    j_loc = (job_location or "").strip().lower()

    if worker_lat is not None and worker_lng is not None and job_lat is not None and job_lng is not None:
        dist_km = haversine_distance(worker_lat, worker_lng, job_lat, job_lng)
        if dist_km <= 15:
            loc_score = 100.0
            explanations.append(f"✓ Very close to your location (~{dist_km:.1f} km away)")
        elif dist_km <= 35:
            loc_score = 85.0
            explanations.append(f"✓ Within commuting distance (~{dist_km:.1f} km away)")
        elif dist_km <= 80:
            loc_score = 65.0
            explanations.append(f"△ Commuting distance: ~{dist_km:.1f} km")
        else:
            loc_score = 35.0
            explanations.append(f"△ Relocation or travel needed (~{dist_km:.0f} km away)")
    elif w_loc and j_loc:
        if w_loc in j_loc or j_loc in w_loc:
            loc_score = 95.0
            explanations.append(f"✓ Job is in your preferred location ({job_location})")
        else:
            # Check city/state tokens
            w_tokens = set(w_loc.replace(",", " ").split())
            j_tokens = set(j_loc.replace(",", " ").split())
            if w_tokens.intersection(j_tokens):
                loc_score = 80.0
                explanations.append(f"✓ Nearby region match ({job_location})")
            else:
                loc_score = 50.0
                explanations.append(f"△ Job located in {job_location} (your profile is in {worker_location})")
    else:
        loc_score = 75.0

    # 5. Salary Match (15%)
    salary_score = 0.0
    expected = worker_expected_salary or ((job_salary_min + job_salary_max) / 2)
    if job_salary_min <= expected <= job_salary_max:
        salary_score = 100.0
        explanations.append(f"✓ Salary (₹{job_salary_min:,.0f} - ₹{job_salary_max:,.0f}) perfectly aligns with your expectation")
    elif expected < job_salary_min:
        salary_score = 100.0
        explanations.append(f"✓ Offered pay (₹{job_salary_min:,.0f}+) exceeds your current expectation")
    else:
        # Expected is above max
        diff = expected - job_salary_max
        ratio = diff / job_salary_max
        salary_score = round(max(30.0, (1.0 - ratio) * 100), 1)
        explanations.append(f"△ Expected salary is slightly above job budget (Budget up to ₹{job_salary_max:,.0f})")

    # Weighted Overall Score
    overall_score = round(
        (skills_score * 0.35) +
        (exp_score * 0.25) +
        (loc_score * 0.15) +
        (salary_score * 0.15) +
        (prof_score * 0.10),
        1
    )

    return {
        "overall_match": min(99.0, max(10.0, overall_score)),
        "skills_match": skills_score,
        "experience_match": exp_score,
        "location_match": loc_score,
        "salary_match": salary_score,
        "profession_match": prof_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "explanations": explanations,
    }

