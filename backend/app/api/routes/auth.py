from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User, UserRole
from app.models.profile import WorkerProfile, EmployerProfile
from app.schemas.auth import UserRegister, UserLogin, UserResponse, AuthResponse, SwitchRoleRequest
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    if user_data.password != user_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered. Please login instead."
        )
    
    hashed_pwd = get_password_hash(user_data.password)
    
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_pwd,
        role=UserRole(user_data.role.value)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Automatically create profile record based on role
    if new_user.role == UserRole.WORKER:
        worker_prof = WorkerProfile(
            user_id=new_user.id,
            title=new_user.full_name,
            profile_completed_percentage=20
        )
        db.add(worker_prof)
    elif new_user.role == UserRole.EMPLOYER:
        emp_prof = EmployerProfile(
            user_id=new_user.id,
            company_name=f"{new_user.full_name}'s Company",
            verified=False
        )
        db.add(emp_prof)
    db.commit()

    # Generate access token for automatic authentication after signup
    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role.value})

    user_resp = UserResponse(
        id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        role=new_user.role.value,
        is_active=new_user.is_active
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_resp
    }

@router.post("/login", response_model=AuthResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    user_resp = UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role.value,
        is_active=user.is_active
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_resp
    }

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    """
    Fetch the currently authenticated user's profile.
    """
    return current_user


@router.post("/switch-role", response_model=AuthResponse)
def switch_role(
    req: SwitchRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows a user to switch their active role between 'worker' and 'employer'.
    Automatically provisions profile records if needed.
    """
    target_role = UserRole(req.role.value)
    current_user.role = target_role

    if target_role == UserRole.WORKER:
        worker_prof = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
        if not worker_prof:
            worker_prof = WorkerProfile(
                user_id=current_user.id,
                title=f"{current_user.full_name}",
                profession="General",
                profile_completed_percentage=30
            )
            db.add(worker_prof)
    elif target_role == UserRole.EMPLOYER:
        emp_prof = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
        if not emp_prof:
            emp_prof = EmployerProfile(
                user_id=current_user.id,
                company_name=f"{current_user.full_name}'s Enterprise",
                verified=False
            )
            db.add(emp_prof)

    db.commit()
    db.refresh(current_user)

    access_token = create_access_token(data={"sub": str(current_user.id), "role": current_user.role.value})
    user_resp = UserResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role.value,
        is_active=current_user.is_active
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_resp
    }