import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.database import engine, Base
import app.models # imports all tables

from app.api.routes import auth, profiles, jobs, applications, ai, notifications, messages

# Initialize tables
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists
upload_dir = os.path.join(os.getcwd(), "uploads")
os.makedirs(os.path.join(upload_dir, "photos"), exist_ok=True)
os.makedirs(os.path.join(upload_dir, "resumes"), exist_ok=True)

app = FastAPI(
    title="AI-Powered Field Workforce Job Marketplace API",
    description="Intelligent matching and recruitment platform for field technicians and employers.",
    version="1.0.0"
)

app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(profiles.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(messages.router, prefix="/api")

# Also include them without /api prefix for backwards compatibility
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(messages.router)

@app.get("/")
def read_root():
    return {
        "project": "AI-Powered Field Workforce Job Marketplace",
        "status": "online",
        "docs_url": "/docs"
    }