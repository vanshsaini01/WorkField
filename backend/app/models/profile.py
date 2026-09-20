import enum
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class AvailabilityType(str, enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    DAILY_WAGE = "daily_wage"
    IMMEDIATE = "immediate"

class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    title = Column(String(255), nullable=True) # e.g. "Senior Industrial Electrician"
    profession = Column(String(100), nullable=True, index=True) # e.g. "Electrician", "Plumber"
    experience_years = Column(Float, default=0.0)
    location = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    expected_salary_min = Column(Float, nullable=True) # Monthly or hourly
    expected_salary_max = Column(Float, nullable=True)
    availability = Column(Enum(AvailabilityType), default=AvailabilityType.FULL_TIME)
    is_available = Column(Boolean, default=True, nullable=False)
    availability_note = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    profile_photo = Column(Text, nullable=True)
    resume_url = Column(Text, nullable=True)
    resume_text = Column(Text, nullable=True)
    certifications = Column(JSON, nullable=True) # List of cert objects or strings
    skills_raw = Column(JSON, nullable=True) # List of skill strings: ["Wiring", "AC Repair"]
    profile_completed_percentage = Column(Integer, default=20)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="worker_profile")
    skills = relationship("WorkerSkill", back_populates="worker_profile", cascade="all, delete-orphan")


class EmployerProfile(Base):
    __tablename__ = "employer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    company_name = Column(String(255), nullable=False)
    profile_photo = Column(Text, nullable=True)
    industry = Column(String(100), nullable=True) # Construction, Maintenance, Logistics, etc.
    company_size = Column(String(50), nullable=True) # "1-10", "11-50", "51-200", "201+"
    description = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    verified = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="employer_profile")


class Profession(Base):
    __tablename__ = "professions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=True) # Electrical, Plumbing, Mechanical, Driving, etc.


class WorkerSkill(Base):
    __tablename__ = "worker_skills"

    id = Column(Integer, primary_key=True, index=True)
    worker_profile_id = Column(Integer, ForeignKey("worker_profiles.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False, index=True)
    proficiency_level = Column(String(50), default="intermediate") # beginner, intermediate, expert
    years_of_experience = Column(Float, default=1.0)

    worker_profile = relationship("WorkerProfile", back_populates="skills")

