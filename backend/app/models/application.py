import enum
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Enum, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWING = "reviewing"
    SHORTLISTED = "shortlisted"
    INTERVIEW = "interview"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    worker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    cover_letter = Column(Text, nullable=True)
    resume_url = Column(Text, nullable=True)
    status = Column(Enum(ApplicationStatus), nullable=False, default=ApplicationStatus.PENDING)
    
    match_score = Column(Float, nullable=True)
    match_breakdown = Column(JSON, nullable=True) # { skills_match: 95, exp_match: 100, ... }
    employer_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Prevent a worker from applying to the same job twice
    __table_args__ = (
        UniqueConstraint('job_id', 'worker_id', name='unique_job_worker_application'),
    )

    # Relationships
    job = relationship("Job", backref="applications")
    worker = relationship("User", backref="applications")