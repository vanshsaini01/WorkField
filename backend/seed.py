from app.database.database import SessionLocal, engine, Base
import app.models # registers all tables
from app.models.user import User, UserRole
from app.models.profile import WorkerProfile, EmployerProfile, Profession, Skill, WorkerSkill, AvailabilityType
from app.models.job import Job, JobStatus, JobType
from app.models.application import Application, ApplicationStatus
from app.models.communication import Notification
from app.core.security import get_password_hash
from app.ai.matching import calculate_match_score

def seed_database():
    print("[*] Recreating database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Professions
        professions_data = [
            {"name": "Electrician", "category": "Electrical", "description": "Installation and maintenance of electrical systems, wiring, and machinery.", "icon": "Zap"},
            {"name": "Plumber", "category": "Civil & Sanitary", "description": "Piping, drainage, and water supply maintenance for commercial and residential sites.", "icon": "Wrench"},
            {"name": "HVAC Technician", "category": "Climate Systems", "description": "Air conditioning, chiller plants, refrigeration, and ventilation specialists.", "icon": "Thermometer"},
            {"name": "Driver", "category": "Logistics & Transport", "description": "Commercial heavy vehicle, logistics transport, and fleet vehicle operators.", "icon": "Truck"},
            {"name": "Construction Worker", "category": "Construction", "description": "Masonry, bricklaying, scaffolding, concrete, and site infrastructure.", "icon": "HardHat"},
            {"name": "Technician / Mechanic", "category": "Mechanical", "description": "Preventive maintenance of machinery, generators, hydraulics, and motors.", "icon": "Tool"},
            {"name": "Solar Technician", "category": "Renewable Energy", "description": "Solar PV panel installation, rooftop arrays, and grid inverters.", "icon": "Sun"},
            {"name": "CCTV & Security Technician", "category": "Electronics & Security", "description": "Surveillance system installation, networking, and sensor setups.", "icon": "Video"},
            {"name": "Non-professional", "category": "General Labor", "description": "General field assistance, warehouse helpers, packing, loading/unloading, and site tasks.", "icon": "HardHat"},
        ]
        for p_data in professions_data:
            if not db.query(Profession).filter(Profession.name == p_data["name"]).first():
                db.add(Profession(**p_data))
        db.commit()
        print("[+] Professions seeded")

        # 2. Seed Skills
        skills_data = [
            ("Electrical Wiring", "Electrical"), ("Industrial Maintenance", "Electrical"),
            ("Panel Board Wiring", "Electrical"), ("Troubleshooting", "Electrical"),
            ("AC Repair", "Climate Systems"), ("Air Conditioning Maintenance", "Climate Systems"),
            ("Refrigerant Charging", "Climate Systems"), ("Pipe Fitting", "Civil & Sanitary"),
            ("Drainage Repair", "Civil & Sanitary"), ("Sanitary Installation", "Civil & Sanitary"),
            ("Commercial Driving", "Logistics"), ("Heavy Vehicle Operation", "Logistics"),
            ("Defensive Driving", "Logistics"), ("Bricklaying", "Construction"),
            ("Tile Laying", "Construction"), ("Plastering", "Construction"),
            ("Concreting", "Construction"), ("Solar Installation", "Renewable Energy"),
            ("CCTV Installation", "Electronics"), ("High Voltage Safety", "Electrical"),
            ("Forklift Operation", "Logistics"), ("Diesel Generator Servicing", "Mechanical")
        ]
        for s_name, s_cat in skills_data:
            if not db.query(Skill).filter(Skill.name == s_name).first():
                db.add(Skill(name=s_name, category=s_cat))
        db.commit()
        print("[+] Skills catalog seeded")

        # 3. Seed Users
        # Admin
        if not db.query(User).filter(User.email == "admin@fieldwork.com").first():
            db.add(User(
                full_name="System Administrator",
                email="admin@fieldwork.com",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN
            ))

        # Employer 1: Apex Industrial Infrastructure (Roorkee)
        emp1 = db.query(User).filter(User.email == "employer@fieldwork.com").first()
        if not emp1:
            emp1 = User(
                full_name="Apex Industrial Works",
                email="employer@fieldwork.com",
                hashed_password=get_password_hash("employer123"),
                role=UserRole.EMPLOYER
            )
            db.add(emp1)
            db.flush()
            db.add(EmployerProfile(
                user_id=emp1.id,
                company_name="Apex Industrial Works Ltd",
                industry="Industrial Manufacturing & Infrastructure",
                company_size="51-200",
                description="Leading industrial facility management and electro-mechanical contractors in Uttarakhand region.",
                website="https://apexindustrial.in",
                location="Roorkee, Uttarakhand",
                phone="+91 98765 43210",
                verified=True
            ))

        # Employer 2: Uttarakhand Power & Infrastructure
        emp2 = db.query(User).filter(User.email == "powergrid@fieldwork.com").first()
        if not emp2:
            emp2 = User(
                full_name="Uttarakhand Power & Infra",
                email="powergrid@fieldwork.com",
                hashed_password=get_password_hash("employer123"),
                role=UserRole.EMPLOYER
            )
            db.add(emp2)
            db.flush()
            db.add(EmployerProfile(
                user_id=emp2.id,
                company_name="Uttarakhand Power & Infra Corp",
                industry="Power & Renewable Energy",
                company_size="201+",
                description="Power transmission, industrial electrification, and renewable solar installations.",
                location="Haridwar, Uttarakhand",
                phone="+91 98111 22233",
                verified=True
            ))

        # Workers
        workers_info = [
            {
                "full_name": "Rahul Sharma",
                "email": "worker@fieldwork.com",
                "password": "worker123",
                "title": "Senior Industrial Electrician",
                "profession": "Electrician",
                "experience_years": 3.5,
                "location": "Roorkee, Uttarakhand",
                "latitude": 29.8543,
                "longitude": 77.8880,
                "expected_salary_min": 25000.0,
                "expected_salary_max": 32000.0,
                "availability": AvailabilityType.FULL_TIME,
                "bio": "Certified industrial electrician with 3.5 years of experience in 3-phase wiring, control panel troubleshooting, and plant maintenance.",
                "phone": "+91 98980 12345",
                "skills": ["Electrical Wiring", "Industrial Maintenance", "Troubleshooting", "AC Repair", "Panel Board Wiring"],
                "certifications": ["ITI Electrician (NCVT)", "Wireman License Grade 1"]
            },
            {
                "full_name": "Amit Verma",
                "email": "amit@fieldwork.com",
                "password": "worker123",
                "title": "HVAC & AC Service Technician",
                "profession": "HVAC Technician",
                "experience_years": 2.5,
                "location": "Haridwar, Uttarakhand",
                "latitude": 29.9457,
                "longitude": 78.1642,
                "expected_salary_min": 22000.0,
                "expected_salary_max": 28000.0,
                "availability": AvailabilityType.FULL_TIME,
                "bio": "Specialized in commercial and residential air conditioning maintenance, compressor repair, and duct servicing.",
                "phone": "+91 97770 54321",
                "skills": ["AC Repair", "Air Conditioning Maintenance", "Troubleshooting", "Refrigerant Charging"],
                "certifications": ["HVAC Technician Trade Certificate"]
            },
            {
                "full_name": "Vishal Kumar",
                "email": "vishal@fieldwork.com",
                "password": "worker123",
                "title": "Commercial Heavy Vehicle Driver",
                "profession": "Driver",
                "experience_years": 4.0,
                "location": "Roorkee, Uttarakhand",
                "latitude": 29.8543,
                "longitude": 77.8880,
                "expected_salary_min": 26000.0,
                "expected_salary_max": 35000.0,
                "availability": AvailabilityType.FULL_TIME,
                "bio": "4+ years of accident-free heavy transport driving experience across North India highway corridors. Valid commercial heavy transport license.",
                "phone": "+91 96660 11223",
                "skills": ["Commercial Driving", "Heavy Vehicle Operation", "Defensive Driving", "Vehicle Inspection"],
                "certifications": ["Heavy Transport Vehicle (HTV) Commercial License"]
            },
            {
                "full_name": "Mohit Negi",
                "email": "mohit@fieldwork.com",
                "password": "worker123",
                "title": "Senior Plumbing & Pipe Fitter",
                "profession": "Plumber",
                "experience_years": 3.0,
                "location": "Dehradun, Uttarakhand",
                "latitude": 30.3165,
                "longitude": 78.0322,
                "expected_salary_min": 22000.0,
                "expected_salary_max": 30000.0,
                "availability": AvailabilityType.FULL_TIME,
                "bio": "Commercial building drainage, sanitary line installation, and water booster pump installation.",
                "phone": "+91 95550 99887",
                "skills": ["Pipe Fitting", "Drainage Repair", "Sanitary Installation", "Water Supply Systems"],
                "certifications": ["ITI Plumber Trade Certificate"]
            },
            {
                "full_name": "Suresh Patel",
                "email": "suresh@fieldwork.com",
                "password": "worker123",
                "title": "Solar PV Rooftop Installer",
                "profession": "Solar Technician",
                "experience_years": 2.0,
                "location": "Haridwar, Uttarakhand",
                "latitude": 29.9457,
                "longitude": 78.1642,
                "expected_salary_min": 20000.0,
                "expected_salary_max": 27000.0,
                "availability": AvailabilityType.FULL_TIME,
                "bio": "Skilled in solar photovoltaic module installation, inverter cabling, and earthing pit preparation.",
                "phone": "+91 94440 33445",
                "skills": ["Solar Installation", "Electrical Wiring", "Earthing Systems", "Troubleshooting"],
                "certifications": ["Suryamitra Solar Certified"]
            }
        ]

        for w_data in workers_info:
            w_user = db.query(User).filter(User.email == w_data["email"]).first()
            if not w_user:
                w_user = User(
                    full_name=w_data["full_name"],
                    email=w_data["email"],
                    hashed_password=get_password_hash(w_data["password"]),
                    role=UserRole.WORKER
                )
                db.add(w_user)
                db.flush()

                w_prof = WorkerProfile(
                    user_id=w_user.id,
                    title=w_data["title"],
                    profession=w_data["profession"],
                    experience_years=w_data["experience_years"],
                    location=w_data["location"],
                    latitude=w_data["latitude"],
                    longitude=w_data["longitude"],
                    expected_salary_min=w_data["expected_salary_min"],
                    expected_salary_max=w_data["expected_salary_max"],
                    availability=w_data["availability"],
                    bio=w_data["bio"],
                    phone=w_data["phone"],
                    skills_raw=w_data["skills"],
                    certifications=w_data["certifications"],
                    profile_completed_percentage=90
                )
                db.add(w_prof)
                db.flush()

                for s_name in w_data["skills"]:
                    db.add(WorkerSkill(
                        worker_profile_id=w_prof.id,
                        skill_name=s_name,
                        proficiency_level="expert" if "Senior" in w_data["title"] else "intermediate",
                        years_of_experience=w_data["experience_years"]
                    ))

        db.commit()
        print("[+] Workers and profiles seeded")

        # 4. Seed Jobs
        emp1 = db.query(User).filter(User.email == "employer@fieldwork.com").first()
        emp2 = db.query(User).filter(User.email == "powergrid@fieldwork.com").first()

        sample_jobs_data = [
            {
                "title": "Industrial Electrician",
                "profession": "Electrician",
                "description": "Looking for an experienced Industrial Electrician for machinery wiring, preventive maintenance of manufacturing lines, and rapid troubleshooting in our Roorkee plant.",
                "required_skills": ["Electrical Wiring", "Industrial Maintenance", "Troubleshooting"],
                "experience_years": 2.0,
                "salary_min": 22000.0,
                "salary_max": 30000.0,
                "job_type": "Full-time",
                "location": "Roorkee, Uttarakhand",
                "latitude": 29.8543,
                "longitude": 77.8880,
                "remote_or_onsite": "On-site",
                "availability_shift": "General Shift (8 AM - 5 PM)",
                "employer_id": emp1.id
            },
            {
                "title": "HVAC & AC Maintenance Technician",
                "profession": "HVAC Technician",
                "description": "Responsible for seasonal servicing, refrigerant leak checking, compressor maintenance, and cooling tower upkeep across Haridwar commercial units.",
                "required_skills": ["AC Repair", "Air Conditioning Maintenance", "Troubleshooting"],
                "experience_years": 2.0,
                "salary_min": 20000.0,
                "salary_max": 28000.0,
                "job_type": "Full-time",
                "location": "Haridwar, Uttarakhand",
                "latitude": 29.9457,
                "longitude": 78.1642,
                "remote_or_onsite": "On-site",
                "availability_shift": "Rotational Shift",
                "employer_id": emp1.id
            },
            {
                "title": "Heavy Commercial Fleet Driver",
                "profession": "Driver",
                "description": "Operating 16-wheel multi-axle freight vehicles between Roorkee and Delhi NCR distribution warehouses. Timely delivery and vehicle inspection adherence.",
                "required_skills": ["Commercial Driving", "Heavy Vehicle Operation", "Defensive Driving"],
                "experience_years": 3.0,
                "salary_min": 25000.0,
                "salary_max": 34000.0,
                "job_type": "Full-time",
                "location": "Roorkee, Uttarakhand",
                "latitude": 29.8543,
                "longitude": 77.8880,
                "remote_or_onsite": "On-site",
                "availability_shift": "Highway Routes",
                "employer_id": emp1.id
            },
            {
                "title": "Lead Plumbing & Piping Specialist",
                "profession": "Plumber",
                "description": "Commercial pipeline installations, pressure testing of sanitary networks, and emergency leakage mitigation for multi-story residential complex in Dehradun.",
                "required_skills": ["Pipe Fitting", "Sanitary Installation", "Drainage Repair"],
                "experience_years": 2.0,
                "salary_min": 22000.0,
                "salary_max": 29000.0,
                "job_type": "Contract",
                "location": "Dehradun, Uttarakhand",
                "latitude": 30.3165,
                "longitude": 78.0322,
                "remote_or_onsite": "On-site",
                "availability_shift": "Day Shift",
                "employer_id": emp1.id
            },
            {
                "title": "Solar PV Rooftop Installer",
                "profession": "Solar Technician",
                "description": "Mounting photovoltaic modules, inverter DC/AC cabling, earthing installation, and commissioning for industrial solar projects in SIDCUL Haridwar.",
                "required_skills": ["Solar Installation", "Electrical Wiring", "Troubleshooting"],
                "experience_years": 1.0,
                "salary_min": 18000.0,
                "salary_max": 26000.0,
                "job_type": "Full-time",
                "location": "Haridwar, Uttarakhand",
                "latitude": 29.9457,
                "longitude": 78.1642,
                "remote_or_onsite": "On-site",
                "availability_shift": "Day Shift",
                "employer_id": emp2.id
            },
            {
                "title": "High-Voltage Substation Electrician",
                "profession": "Electrician",
                "description": "Maintenance of 33kV transformers, switchgear, circuit breakers, and battery banks at industrial power distribution substation.",
                "required_skills": ["High Voltage Safety", "Electrical Wiring", "Panel Board Wiring"],
                "experience_years": 3.0,
                "salary_min": 28000.0,
                "salary_max": 38000.0,
                "job_type": "Full-time",
                "location": "Roorkee, Uttarakhand",
                "latitude": 29.8543,
                "longitude": 77.8880,
                "remote_or_onsite": "On-site",
                "availability_shift": "Day Shift",
                "employer_id": emp2.id
            },
            {
                "title": "CCTV & Security Surveillance Technician",
                "profession": "CCTV & Security Technician",
                "description": "Installation and cabling of IP cameras, NVR configuration, access control biometric units, and perimeter surveillance.",
                "required_skills": ["CCTV Installation", "Troubleshooting"],
                "experience_years": 1.0,
                "salary_min": 19000.0,
                "salary_max": 26000.0,
                "job_type": "Full-time",
                "location": "Roorkee, Uttarakhand",
                "latitude": 29.8543,
                "longitude": 77.8880,
                "remote_or_onsite": "On-site",
                "availability_shift": "General Shift",
                "employer_id": emp1.id
            },
            {
                "title": "Diesel Generator & Maintenance Mechanic",
                "profession": "Technician / Mechanic",
                "description": "Routine servicing, oil and filter replacements, mechanical diagnostics, and emergency repair of standby diesel generator sets.",
                "required_skills": ["Diesel Generator Servicing", "Troubleshooting", "Industrial Maintenance"],
                "experience_years": 2.5,
                "salary_min": 24000.0,
                "salary_max": 32000.0,
                "job_type": "Full-time",
                "location": "Roorkee, Uttarakhand",
                "latitude": 29.8543,
                "longitude": 77.8880,
                "remote_or_onsite": "On-site",
                "availability_shift": "Day Shift",
                "is_resume_required": True,
                "employer_id": emp1.id
            },
            {
                "title": "Warehouse Material Loader & Helper",
                "profession": "Non-professional",
                "description": "Assisting with cargo unloading, carton sorting, inventory stacking, and warehouse maintenance. Open to all, no resume required.",
                "required_skills": ["Loading / Unloading", "Physical Stamina"],
                "experience_years": 0.0,
                "salary_min": 14000.0,
                "salary_max": 19000.0,
                "job_type": "Full-time",
                "location": "Roorkee, Uttarakhand",
                "latitude": 29.8543,
                "longitude": 77.8880,
                "remote_or_onsite": "On-site",
                "availability_shift": "Day Shift",
                "is_resume_required": False,
                "employer_id": emp1.id
            },
            {
                "title": "Office Delivery Boy & Field Runner",
                "profession": "Non-professional",
                "description": "Delivering documents and sample packages between local sites in Haridwar. Direct apply without resume.",
                "required_skills": ["Local Area Knowledge", "Punctuality"],
                "experience_years": 0.0,
                "salary_min": 13000.0,
                "salary_max": 18000.0,
                "job_type": "Full-time",
                "location": "Haridwar, Uttarakhand",
                "latitude": 29.9457,
                "longitude": 78.1642,
                "remote_or_onsite": "On-site",
                "availability_shift": "Day Shift",
                "is_resume_required": False,
                "employer_id": emp2.id
            }
        ]

        created_jobs = []
        for j_data in sample_jobs_data:
            existing = db.query(Job).filter(Job.title == j_data["title"], Job.employer_id == j_data["employer_id"]).first()
            if not existing:
                job_obj = Job(**j_data, status=JobStatus.OPEN, pay_rate=j_data["salary_max"])
                db.add(job_obj)
                db.flush()
                created_jobs.append(job_obj)
            else:
                created_jobs.append(existing)

        db.commit()
        print(f"[+] {len(created_jobs)} Fieldwork jobs seeded")

        # 5. Seed Applications with pre-computed AI match scores so Candidate Ranking can be tested immediately!
        job1 = db.query(Job).filter(Job.title == "Industrial Electrician").first()
        rahul = db.query(User).filter(User.email == "worker@fieldwork.com").first()
        amit = db.query(User).filter(User.email == "amit@fieldwork.com").first()
        suresh = db.query(User).filter(User.email == "suresh@fieldwork.com").first()

        if job1 and rahul:
            existing_app1 = db.query(Application).filter(Application.job_id == job1.id, Application.worker_id == rahul.id).first()
            if not existing_app1:
                rahul_prof = rahul.worker_profile
                score_res = calculate_match_score(
                    worker_profession=rahul_prof.profession,
                    worker_skills=rahul_prof.skills_raw or [],
                    worker_experience=rahul_prof.experience_years,
                    worker_location=rahul_prof.location,
                    worker_lat=rahul_prof.latitude,
                    worker_lng=rahul_prof.longitude,
                    worker_expected_salary=rahul_prof.expected_salary_min,
                    job_profession=job1.profession,
                    job_skills=job1.required_skills,
                    job_experience=job1.experience_years,
                    job_location=job1.location,
                    job_lat=job1.latitude,
                    job_lng=job1.longitude,
                    job_salary_min=job1.salary_min,
                    job_salary_max=job1.salary_max
                )
                db.add(Application(
                    job_id=job1.id,
                    worker_id=rahul.id,
                    cover_letter="I have 3.5 years of experience in industrial wiring and plant maintenance in Roorkee. Available immediately.",
                    status=ApplicationStatus.SHORTLISTED,
                    match_score=score_res["overall_match"],
                    match_breakdown=score_res
                ))

        if job1 and amit:
            existing_app2 = db.query(Application).filter(Application.job_id == job1.id, Application.worker_id == amit.id).first()
            if not existing_app2:
                amit_prof = amit.worker_profile
                score_res = calculate_match_score(
                    worker_profession=amit_prof.profession,
                    worker_skills=amit_prof.skills_raw or [],
                    worker_experience=amit_prof.experience_years,
                    worker_location=amit_prof.location,
                    worker_lat=amit_prof.latitude,
                    worker_lng=amit_prof.longitude,
                    worker_expected_salary=amit_prof.expected_salary_min,
                    job_profession=job1.profession,
                    job_skills=job1.required_skills,
                    job_experience=job1.experience_years,
                    job_location=job1.location,
                    job_lat=job1.latitude,
                    job_lng=job1.longitude,
                    job_salary_min=job1.salary_min,
                    job_salary_max=job1.salary_max
                )
                db.add(Application(
                    job_id=job1.id,
                    worker_id=amit.id,
                    cover_letter="Experienced technician with strong troubleshooting skills and willing to commute from Haridwar.",
                    status=ApplicationStatus.PENDING,
                    match_score=score_res["overall_match"],
                    match_breakdown=score_res
                ))

        if job1 and suresh:
            existing_app3 = db.query(Application).filter(Application.job_id == job1.id, Application.worker_id == suresh.id).first()
            if not existing_app3:
                suresh_prof = suresh.worker_profile
                score_res = calculate_match_score(
                    worker_profession=suresh_prof.profession,
                    worker_skills=suresh_prof.skills_raw or [],
                    worker_experience=suresh_prof.experience_years,
                    worker_location=suresh_prof.location,
                    worker_lat=suresh_prof.latitude,
                    worker_lng=suresh_prof.longitude,
                    worker_expected_salary=suresh_prof.expected_salary_min,
                    job_profession=job1.profession,
                    job_skills=job1.required_skills,
                    job_experience=job1.experience_years,
                    job_location=job1.location,
                    job_lat=job1.latitude,
                    job_lng=job1.longitude,
                    job_salary_min=job1.salary_min,
                    job_salary_max=job1.salary_max
                )
                db.add(Application(
                    job_id=job1.id,
                    worker_id=suresh.id,
                    cover_letter="Passionate technician with hands-on electrical and solar cabling background.",
                    status=ApplicationStatus.PENDING,
                    match_score=score_res["overall_match"],
                    match_breakdown=score_res
                ))

        db.commit()
        print("[+] Sample applications and AI candidate rankings seeded")

        print("\n[SUCCESS] Database successfully seeded with rich field workforce marketplace data!")

    except Exception as e:
        print(f"[-] Error seeding database: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()