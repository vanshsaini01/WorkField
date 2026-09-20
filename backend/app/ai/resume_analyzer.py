import re
import os
import json
from typing import Dict, Any, List
import pikepdf
from app.core.config import settings

# Comprehensive skill ontology for field workforce
SKILL_DICTIONARY = {
    "Electrician": [
        "Electrical Wiring", "Circuit Breaker Installation", "Industrial Maintenance",
        "Panel Board Wiring", "Troubleshooting", "Motor Control", "Transformer Maintenance",
        "Lighting Installation", "Earthing Systems", "Conduit Bending", "High Voltage Safety",
        "AC Repair", "Appliance Repair", "Cable Jointing", "Multimeter Testing"
    ],
    "Plumber": [
        "Pipe Fitting", "Drainage Repair", "Sanitary Installation", "Leakage Repair",
        "Water Supply Systems", "PPR/CPVC Piping", "Boiler Maintenance", "Faucet Installation",
        "Pump Installation", "Sewage Inspection", "Soldering & Brazing", "Water Metering"
    ],
    "HVAC Technician": [
        "AC Repair", "Air Conditioning Maintenance", "Refrigerant Charging", "Compressor Servicing",
        "Ductwork Installation", "Chiller Plant Operation", "Thermostat Calibration",
        "HVAC Diagnostics", "Cooling Tower Maintenance", "Air Quality Testing"
    ],
    "Driver": [
        "Commercial Driving", "Heavy Vehicle Operation", "GPS Navigation", "Defensive Driving",
        "Route Planning", "Vehicle Inspection", "Cargo Handling", "Logistics Documentation",
        "Forklift Operation", "Fuel Efficiency Monitoring", "Emergency Roadside Repair"
    ],
    "Construction Worker / Mason": [
        "Bricklaying", "Plastering", "Concreting", "Tile Laying", "Scaffolding Setup",
        "Formwork Construction", "Site Safety Compliance", "Blueprint Reading",
        "Demolition", "Material Handling", "Waterproofing", "Steel Fixing"
    ],
    "Technician / Mechanic": [
        "Equipment Diagnosis", "Preventive Maintenance", "Hydraulics & Pneumatics",
        "Welding (Arc/MIG/TIG)", "Lathe Operation", "CCTV Installation", "Solar Panel Setup",
        "Battery Bank Maintenance", "Diesel Generator Servicing", "Elevator Maintenance"
    ]
}

INDIAN_CITIES = [
    "Roorkee", "Haridwar", "Dehradun", "Delhi", "Noida", "Gurugram", "Ghaziabad", "Faridabad",
    "Mumbai", "Pune", "Bengaluru", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad",
    "Jaipur", "Lucknow", "Chandigarh", "Kanpur", "Nagpur", "Indore", "Bhopal", "Patna", "Ludhiana"
]

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extracts raw text from PDF bytes using pikepdf or basic stream extraction."""
    extracted_text = []
    try:
        # Write to temporary file or read in-memory with pikepdf
        import io
        stream = io.BytesIO(pdf_bytes)
        with pikepdf.open(stream) as pdf:
            for page in pdf.pages:
                # Basic text extraction from page contents
                for obj_name, obj in page.Contents.items() if hasattr(page.Contents, 'items') else enumerate([page.Contents]):
                    try:
                        data = obj.read_bytes().decode('latin-1', errors='ignore')
                        # Extract strings between parentheses in PDF streams e.g. (Text) Tj
                        matches = re.findall(r'\((.*?)\)\s*T[jJ]', data)
                        if matches:
                            extracted_text.append(" ".join(matches))
                    except Exception:
                        pass
    except Exception as e:
        print("PDF stream parsing fallback:", e)

    # If stream extraction yielded little text, fall back to string regex over bytes
    if not extracted_text:
        try:
            raw = pdf_bytes.decode('utf-8', errors='ignore')
            words = re.findall(r'[A-Za-z0-9@.,\+\-\s]{4,}', raw)
            extracted_text = words
        except Exception:
            pass

    return "\n".join(extracted_text)

def analyze_resume_text(text: str) -> Dict[str, Any]:
    """
    Analyzes resume text using NLP rule extraction and returns structured
    worker profile suggestions.
    """
    clean_text = text.replace("\r", " ")
    lines = [line.strip() for line in clean_text.split("\n") if line.strip()]

    # 1. Candidate Name (heuristic: first non-empty line or near top)
    name = "Field Professional"
    for line in lines[:5]:
        if len(line) < 40 and not any(keyword in line.lower() for keyword in ["resume", "curriculum", "cv", "email", "phone", "profile"]):
            # Check if it looks like a name (words starting with capitals)
            words = line.split()
            if 1 <= len(words) <= 4 and all(w[0].isupper() for w in words if w):
                name = line
                break

    # 2. Email & Phone
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', clean_text)
    email = email_match.group(0) if email_match else ""

    phone_match = re.search(r'(?:\+91[\-\s]?)?[6789]\d{9}', clean_text)
    phone = phone_match.group(0) if phone_match else ""

    # 3. Location detection
    location = "Roorkee, Uttarakhand"
    for city in INDIAN_CITIES:
        if re.search(rf'\b{city}\b', clean_text, re.IGNORECASE):
            location = city
            break

    # 4. Experience Years
    exp_years = 2.0
    exp_patterns = [
        r'(\d+(?:\.\d+)?)\+?\s*(?:years|year|yrs|yr)\s*(?:of)?\s*(?:experience|exp)?',
        r'(?:experience|exp)\s*:\s*(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)?'
    ]
    for pat in exp_patterns:
        m = re.search(pat, clean_text, re.IGNORECASE)
        if m:
            try:
                val = float(m.group(1))
                if 0.5 <= val <= 35:
                    exp_years = val
                    break
            except ValueError:
                pass

    # 5. Skills Detection & Profession Suggestion
    detected_skills = []
    profession_scores = {prof: 0 for prof in SKILL_DICTIONARY}

    lower_text = clean_text.lower()
    for prof, skills in SKILL_DICTIONARY.items():
        for skill in skills:
            if re.search(rf'\b{re.escape(skill.lower())}\b', lower_text):
                if skill not in detected_skills:
                    detected_skills.append(skill)
                profession_scores[prof] += 1
            else:
                # Partial token match for compound skills
                parts = skill.lower().split()
                if len(parts) > 1 and all(p in lower_text for p in parts):
                    if skill not in detected_skills:
                        detected_skills.append(skill)
                    profession_scores[prof] += 1

    # Determine top suggested profession
    suggested_prof = max(profession_scores, key=profession_scores.get)
    if profession_scores[suggested_prof] == 0:
        suggested_prof = "Technician"

    # Default fallback skills if none detected in raw text
    if not detected_skills:
        detected_skills = SKILL_DICTIONARY[suggested_prof][:4]

    # 6. Education & Certifications
    education = []
    for edu_term in ["ITI", "Diploma", "B.Tech", "Polytechnic", "10th Pass", "12th Pass", "High School", "Apprenticeship"]:
        if re.search(rf'\b{edu_term}\b', clean_text, re.IGNORECASE):
            education.append(edu_term)
    if not education:
        education = ["ITI / Technical Diploma"]

    certifications = []
    for cert in ["Wireman License", "Commercial Driving License (Heavy)", "Safety Certification (OSHA)", "HVAC Certified", "First Aid Certified"]:
        if any(w.lower() in lower_text for w in cert.split()[:2]):
            certifications.append(cert)
    if not certifications:
        certifications = [f"{suggested_prof} Trade Certificate"]

    return {
        "full_name": name,
        "email": email,
        "phone": phone,
        "suggested_profession": suggested_prof,
        "detected_skills": detected_skills,
        "experience_years": exp_years,
        "location": location,
        "education": education,
        "certifications": certifications,
        "suggested_title": f"Experienced {suggested_prof} ({exp_years:.0f}+ yrs)",
        "expected_salary_min": 18000.0 if exp_years < 2 else 25000.0,
        "expected_salary_max": 28000.0 if exp_years < 2 else 40000.0,
    }

