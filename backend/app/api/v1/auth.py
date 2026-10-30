from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, require_admin
from app.core.audit_logger import audit_logger
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.models import User, UserRole
from app.schemas import (
    LoginRequest,
    LoginResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
)

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        audit_logger.auth_login(
            user_id=None,
            user_email=login_data.email,
            success=False,
            request=request,
            details={"reason": "invalid_credentials"},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email, "role": user.role.value},
        expires_delta=access_token_expires,
    )

    audit_logger.auth_login(
        user_id=user.id,
        user_email=user.email,
        success=True,
        request=request,
        details={"role": user.role.value},
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # Check if user exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        audit_logger.config_change(
            user_id=current_user.id,
            user_email=current_user.email,
            resource="user",
            action="create",
            request=request,
            details={"attempted_email": user_data.email, "outcome": "failed_duplicate"},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
        department=user_data.department,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    audit_logger.config_change(
        user_id=current_user.id,
        user_email=current_user.email,
        resource="user",
        action="create",
        request=request,
        details={
            "created_user_id": user.id,
            "created_email": user.email,
            "role": user_data.role.value,
        },
    )

    return UserResponse.model_validate(user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_me(
    user_update: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    old_data = {
        "full_name": current_user.full_name,
        "department": current_user.department,
        "role": current_user.role.value,
    }

    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.department is not None:
        current_user.department = user_update.department
    if user_update.role is not None and current_user.role == UserRole.ADMIN:
        current_user.role = user_update.role

    db.commit()
    db.refresh(current_user)

    new_data = {
        "full_name": current_user.full_name,
        "department": current_user.department,
        "role": current_user.role.value,
    }

    audit_logger.config_change(
        user_id=current_user.id,
        user_email=current_user.email,
        resource="user.profile",
        action="update",
        request=request,
        details={"old": old_data, "new": new_data},
    )

    return UserResponse.model_validate(current_user)


@router.get("/users", response_model=list[UserResponse])
def list_users(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    audit_logger.data_access(
        user_id=current_user.id,
        user_email=current_user.email,
        resource="users",
        action="list",
        request=request,
        details={
            "filters": {"role": role.value if role else None, "department": department}
        },
    )

    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if department:
        query = query.filter(User.department == department)
    users = query.offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Students can only see themselves, teachers can see their students, admins see all
    if current_user.role == UserRole.STUDENT and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Teachers can only see students in their classes
    if current_user.role == UserRole.TEACHER:
        from app.db.models import Class, Enrollment

        student_classes = (
            db.query(Enrollment)
            .join(Class)
            .filter(
                Enrollment.student_id == user_id, Class.teacher_id == current_user.id
            )
            .first()
        )
        if not student_classes and user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    audit_logger.data_access(
        user_id=current_user.id,
        user_email=current_user.email,
        resource=f"users/{user_id}",
        action="read",
        request=request,
        details={"target_user_id": user_id},
    )

    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_data = {
        "full_name": user.full_name,
        "department": user.department,
        "role": user.role.value,
    }

    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.department is not None:
        user.department = user_update.department
    if user_update.role is not None:
        user.role = user_update.role

    db.commit()
    db.refresh(user)

    new_data = {
        "full_name": user.full_name,
        "department": user.department,
        "role": user.role.value,
    }

    audit_logger.config_change(
        user_id=current_user.id,
        user_email=current_user.email,
        resource=f"users/{user_id}",
        action="update",
        request=request,
        details={"old": old_data, "new": new_data},
    )

    return UserResponse.model_validate(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    audit_logger.config_change(
        user_id=current_user.id,
        user_email=current_user.email,
        resource=f"users/{user_id}",
        action="delete",
        request=request,
        details={"deleted_email": user.email, "deleted_role": user.role.value},
    )

    db.delete(user)
    db.commit()
