from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, require_admin, require_teacher
from app.db.models import Class, Enrollment, User, UserRole
from app.schemas import (
    ClassCreate,
    ClassResponse,
    ClassUpdate,
    EnrollmentCreate,
    EnrollmentResponse,
)

router = APIRouter()


@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # Verify teacher exists and has teacher role
    teacher = (
        db.query(User)
        .filter(User.id == class_data.teacher_id, User.role == UserRole.TEACHER)
        .first()
    )
    if not teacher:
        raise HTTPException(
            status_code=400, detail="Teacher not found or not a teacher"
        )

    # Check if code already exists
    existing = db.query(Class).filter(Class.code == class_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Class code already exists")

    class_obj = Class(**class_data.model_dump())
    db.add(class_obj)
    db.commit()
    db.refresh(class_obj)
    return ClassResponse.model_validate(class_obj)


@router.get("", response_model=List[ClassResponse])
def list_classes(
    skip: int = 0,
    limit: int = 100,
    department: Optional[str] = None,
    semester: Optional[int] = None,
    teacher_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Class)

    # RBAC: Teachers only see their own classes, students see enrolled classes
    if current_user.role == UserRole.TEACHER:
        query = query.filter(Class.teacher_id == current_user.id)
    elif current_user.role == UserRole.STUDENT:
        enrolled_class_ids = (
            db.query(Enrollment.class_id)
            .filter(
                Enrollment.student_id == current_user.id, Enrollment.is_active.is_(True)
            )
            .subquery()
        )
        query = query.filter(Class.id.in_(enrolled_class_ids))

    if department:
        query = query.filter(Class.department == department)
    if semester:
        query = query.filter(Class.semester == semester)
    if teacher_id and current_user.role == UserRole.ADMIN:
        query = query.filter(Class.teacher_id == teacher_id)

    classes = query.offset(skip).limit(limit).all()

    # Add teacher name
    result = []
    for c in classes:
        teacher = db.query(User).filter(User.id == c.teacher_id).first()
        resp = ClassResponse.model_validate(c)
        resp.teacher_name = teacher.full_name if teacher else None
        result.append(resp)

    return result


@router.get("/{class_id}", response_model=ClassResponse)
def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    # Check access
    if (
        current_user.role == UserRole.TEACHER
        and class_obj.teacher_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.STUDENT:
        enrollment = (
            db.query(Enrollment)
            .filter(
                Enrollment.student_id == current_user.id,
                Enrollment.class_id == class_id,
                Enrollment.is_active.is_(True),
            )
            .first()
        )
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this class")

    teacher = db.query(User).filter(User.id == class_obj.teacher_id).first()
    resp = ClassResponse.model_validate(class_obj)
    resp.teacher_name = teacher.full_name if teacher else None
    return resp


@router.put("/{class_id}", response_model=ClassResponse)
def update_class(
    class_id: int,
    class_update: ClassUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    update_data = class_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(class_obj, field, value)

    db.commit()
    db.refresh(class_obj)

    teacher = db.query(User).filter(User.id == class_obj.teacher_id).first()
    resp = ClassResponse.model_validate(class_obj)
    resp.teacher_name = teacher.full_name if teacher else None
    return resp


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    db.delete(class_obj)
    db.commit()


@router.post(
    "/{class_id}/enroll",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def enroll_student(
    class_id: int,
    enrollment_data: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    # Teachers can only enroll in their own classes
    if (
        current_user.role == UserRole.TEACHER
        and class_obj.teacher_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized for this class")

    student = (
        db.query(User)
        .filter(User.id == enrollment_data.student_id, User.role == UserRole.STUDENT)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check if already enrolled
    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == enrollment_data.student_id,
            Enrollment.class_id == class_id,
        )
        .first()
    )
    if existing:
        if existing.is_active:
            raise HTTPException(status_code=400, detail="Student already enrolled")
        else:
            existing.is_active = True
            db.commit()
            db.refresh(existing)
            return EnrollmentResponse.model_validate(existing)

    enrollment = Enrollment(
        student_id=enrollment_data.student_id,
        class_id=class_id,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return EnrollmentResponse.model_validate(enrollment)


@router.delete(
    "/{class_id}/enroll/{student_id}", status_code=status.HTTP_204_NO_CONTENT
)
def unenroll_student(
    class_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    if (
        current_user.role == UserRole.TEACHER
        and class_obj.teacher_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == student_id, Enrollment.class_id == class_id)
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    enrollment.is_active = False
    db.commit()


@router.get("/{class_id}/students", response_model=List[EnrollmentResponse])
def list_class_students(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    if (
        current_user.role == UserRole.TEACHER
        and class_obj.teacher_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.STUDENT:
        enrollment = (
            db.query(Enrollment)
            .filter(
                Enrollment.student_id == current_user.id,
                Enrollment.class_id == class_id,
                Enrollment.is_active.is_(True),
            )
            .first()
        )
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled")

    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.class_id == class_id, Enrollment.is_active.is_(True))
        .all()
    )

    result = []
    for e in enrollments:
        student = db.query(User).filter(User.id == e.student_id).first()
        resp = EnrollmentResponse.model_validate(e)
        resp.student_name = student.full_name if student else None
        resp.class_code = class_obj.code
        result.append(resp)

    return result
