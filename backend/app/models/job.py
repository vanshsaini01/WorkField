import enum
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Enum, ForeignKey, Boolean, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class JobStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"
    IN_PROGRESS = "in_progress"

class JobType(str, enum.Enum):
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"
    CONTRACT = "Contract"
    DAILY_WAGE = "Daily Wage"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False, index=True)
    profession = Column(String(100), nullable=False, index=True, default="Technician")
    description = Column(Text, nullable=True, default="")
    required_skills = Column(JSON, nullable=True) # list of strings, e.g. ["Wiring", "AC Repair"]
    experience_years = Column(Float, default=0.0)
    salary_min = Column(Float, nullable=False, default=15000.0)
    salary_max = Column(Float, nullable=False, default=25000.0)
    pay_rate = Column(Float, nullable=True) # backward compatibility
    job_type = Column(String(50), default="Full-time")
    location = Column(String(255), nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    remote_or_onsite = Column(String(50), default="On-site")
    availability_shift = Column(String(100), default="Day Shift")
    deadline = Column(String(100), nullable=True)
    is_resume_required = Column(Boolean, default=True, nullable=False)
    status = Column(Enum(JobStatus), nullable=False, default=JobStatus.OPEN)
    vacancies = Column(Integer, default=1, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employer = relationship("User", backref="posted_jobs")
    saved_by = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan")


class JobSkill(Base):
    __tablename__ = "job_skills"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False, index=True)
    is_mandatory = Column(Boolean, default=True)


class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('worker_id', 'job_id', name='unique_worker_saved_job'),
    )

    worker = relationship("User", back_populates="saved_jobs")
    job = relationship("Job", back_populates="saved_by")