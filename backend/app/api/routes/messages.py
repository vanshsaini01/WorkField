from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.database.database import get_db
from app.models.user import User, UserRole
from app.models.communication import Message, Notification
from app.models.job import Job
from app.models.profile import EmployerProfile
from app.api.deps import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])

class MessageCreate(BaseModel):
    receiver_id: int
    content: str
    job_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    job_id: Optional[int] = None
    content: str
    is_read: bool
    created_at: datetime
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None

    class Config:
        from_attributes = True

class ConversationItem(BaseModel):
    other_user_id: int
    other_user_name: str
    other_user_role: str
    last_message: str
    last_message_time: datetime
    unread_count: int
    job_title: Optional[str] = None

@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    msg_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not msg_in.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    receiver = db.query(User).filter(User.id == msg_in.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Recipient user not found")

    new_msg = Message(
        sender_id=current_user.id,
        receiver_id=msg_in.receiver_id,
        job_id=msg_in.job_id,
        content=msg_in.content.strip()
    )
    db.add(new_msg)

    # In-app notification for recipient
    job_title = ""
    if msg_in.job_id:
        job = db.query(Job).filter(Job.id == msg_in.job_id).first()
        if job:
            job_title = f" regarding '{job.title}'"

    notif = Notification(
        user_id=msg_in.receiver_id,
        title=f"New message from {current_user.full_name}",
        message=f"{current_user.full_name}: {new_msg.content[:80]}...",
        type="message",
        link=f"/messages?user={current_user.id}"
    )
    db.add(notif)

    db.commit()
    db.refresh(new_msg)

    return {
        "id": new_msg.id,
        "sender_id": new_msg.sender_id,
        "receiver_id": new_msg.receiver_id,
        "job_id": new_msg.job_id,
        "content": new_msg.content,
        "is_read": new_msg.is_read,
        "created_at": new_msg.created_at,
        "sender_name": current_user.full_name,
        "receiver_name": receiver.full_name
    }

@router.get("/conversations", response_model=List[ConversationItem])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all active conversation threads for the logged-in user.
    """
    messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id
        )
    ).order_by(desc(Message.created_at)).all()

    threads = {}
    for m in messages:
        other_id = m.receiver_id if m.sender_id == current_user.id else m.sender_id
        if other_id not in threads:
            other_user = db.query(User).filter(User.id == other_id).first()
            if not other_user:
                continue

            unread_count = db.query(Message).filter(
                Message.sender_id == other_id,
                Message.receiver_id == current_user.id,
                Message.is_read == False
            ).count()

            job_title = None
            if m.job_id:
                job = db.query(Job).filter(Job.id == m.job_id).first()
                if job:
                    job_title = job.title

            threads[other_id] = {
                "other_user_id": other_id,
                "other_user_name": other_user.full_name,
                "other_user_role": other_user.role.value if hasattr(other_user.role, "value") else str(other_user.role),
                "last_message": m.content,
                "last_message_time": m.created_at,
                "unread_count": unread_count,
                "job_title": job_title
            }

    return list(threads.values())

@router.get("/user-info/{user_id}")
def get_chat_user_info(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    display_name = target.full_name
    if target.role == UserRole.EMPLOYER:
        prof = db.query(EmployerProfile).filter(EmployerProfile.user_id == target.id).first()
        if prof and prof.company_name:
            display_name = prof.company_name

    return {
        "id": target.id,
        "full_name": display_name,
        "email": target.email,
        "role": target.role.value if hasattr(target.role, "value") else str(target.role)
    }

@router.get("/{other_user_id}", response_model=List[MessageResponse])
def get_chat_history(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch full chat message history between current_user and other_user_id.
    """
    other_user = db.query(User).filter(User.id == other_user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id)
        )
    ).order_by(Message.created_at.asc()).all()

    # Automatically mark unread incoming messages as read
    db.query(Message).filter(
        Message.sender_id == other_user_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()

    results = []
    for m in messages:
        sender_name = current_user.full_name if m.sender_id == current_user.id else other_user.full_name
        receiver_name = other_user.full_name if m.sender_id == current_user.id else current_user.full_name
        results.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "job_id": m.job_id,
            "content": m.content,
            "is_read": m.is_read,
            "created_at": m.created_at,
            "sender_name": sender_name,
            "receiver_name": receiver_name
        })

    return results

@router.patch("/{other_user_id}/read")
def mark_messages_read(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Message).filter(
        Message.sender_id == other_user_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success", "marked_read": True}

