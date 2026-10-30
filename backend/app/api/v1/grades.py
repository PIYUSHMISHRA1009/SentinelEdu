from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, require_teacher
from app.db.models import Class, Enrollment, Grade, User, UserRole
from app.schemas import GradeCreate, GradeResponse, GradeUpdate

router = APIRouter()


@router.post("", response_model=GradeResponse, status_code=status.HTTP_201_CREATED)
def create_grade(
    grade_data: GradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    # Verify student and class
    student = (
        db.query(User)
        .filter(User.id == grade_data.student_id, User.role == UserRole.STUDENT)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    class_obj = db.query(Class).filter(Class.id == grade_data.class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    # Check enrollment
    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == grade_data.student_id,
            Enrollment.class_id == grade_data.class_id,
            Enrollment.is_active.is_(True),
        )
        .first()
    )
    if not enrollment:
        raise HTTPException(
            status_code=400, detail="Student not enrolled in this class"
        )

    # Teachers can only grade their own classes
    if (
        current_user.role == UserRole.TEACHER
        and class_obj.teacher_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized for this class")

    percentage = (grade_data.score / grade_data.max_score) * 100

    grade = Grade(
        student_id=grade_data.student_id,
        class_id=grade_data.class_id,
        assignment_name=grade_data.assignment_name,
        score=grade_data.score,
        max_score=grade_data.max_score,
        percentage=percentage,
        weight=grade_data.weight,
        graded_at=datetime.utcnow(),
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return GradeResponse.model_validate(grade)


@router.get("", response_model=List[GradeResponse])
def list_grades(
    student_id: Optional[int] = None,
    class_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Grade)

    # RBAC
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Grade.student_id == current_user.id)
        if student_id and student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.TEACHER:
        # Teacher can only see grades for their classes
        teacher_class_ids = (
            db.query(Class.id).filter(Class.teacher_id == current_user.id).subquery()
        )
        query = query.filter(Grade.class_id.in_(teacher_class_ids))
        if student_id:
            query = query.filter(Grade.student_id == student_id)
    else:  # Admin
        if student_id:
            query = query.filter(Grade.student_id == student_id)

    if class_id:
        query = query.filter(Grade.class_id == class_id)

    grades = query.order_by(Grade.graded_at.desc()).offset(skip).limit(limit).all()

    result = []
    for g in grades:
        student = db.query(User).filter(User.id == g.student_id).first()
        class_obj = db.query(Class).filter(Class.id == g.class_id).first()
        resp = GradeResponse.model_validate(g)
        resp.student_name = student.full_name if student else None
        resp.class_code = class_obj.code if class_obj else None
        result.append(resp)

    return result


@router.get(
    "/student/{student_id}/class/{class_id}", response_model=List[GradeResponse]
)
def get_student_class_grades(
    student_id: int,
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Check access
    if current_user.role == UserRole.STUDENT and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    class_obj = db.query(Class).filter(Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    if (
        current_user.role == UserRole.TEACHER
        and class_obj.teacher_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    grades = (
        db.query(Grade)
        .filter(Grade.student_id == student_id, Grade.class_id == class_id)
        .order_by(Grade.graded_at.asc())
        .all()
    )

    student = db.query(User).filter(User.id == student_id).first()
    result = []
    for g in grades:
        resp = GradeResponse.model_validate(g)
        resp.student_name = student.full_name if student else None
        resp.class_code = class_obj.code
        result.append(resp)

    return result


@router.get("/student/{student_id}/summary")
def get_student_grade_summary(
    student_id: int,
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role == UserRole.STUDENT and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    query = db.query(Grade).filter(Grade.student_id == student_id)

    if class_id:
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        if (
            current_user.role == UserRole.TEACHER
            and class_obj.teacher_id != current_user.id
        ):
            raise HTTPException(status_code=403, detail="Not authorized")
        query = query.filter(Grade.class_id == class_id)
    elif current_user.role == UserRole.TEACHER:
        teacher_class_ids = (
            db.query(Class.id).filter(Class.teacher_id == current_user.id).subquery()
        )
        query = query.filter(Grade.class_id.in_(teacher_class_ids))

    grades = query.all()

    if not grades:
        return {
            "student_id": student_id,
            "overall_gpa": None,
            "class_gpas": {},
            "total_assignments": 0,
        }

    # Calculate weighted GPA per class
    class_gpas = {}
    for g in grades:
        if g.class_id not in class_gpas:
            class_gpas[g.class_id] = {
                "total_weighted": 0,
                "total_weight": 0,
                "assignments": [],
            }
        class_gpas[g.class_id]["total_weighted"] += g.percentage * g.weight
        class_gpas[g.class_id]["total_weight"] += g.weight
        class_gpas[g.class_id]["assignments"].append(g.percentage)

    # Convert to GPA (4.0 scale)
    for cid, data in class_gpas.items():
        if data["total_weight"] > 0:
            avg_pct = data["total_weighted"] / data["total_weight"]
            data["gpa"] = round(avg_pct / 25, 2)  # Convert percentage to 4.0 scale
            data["class"] = db.query(Class).filter(Class.id == cid).first()
        else:
            data["gpa"] = 0

    overall_weighted = sum(d["total_weighted"] for d in class_gpas.values())
    overall_weight = sum(d["total_weight"] for d in class_gpas.values())
    overall_gpa = (
        round((overall_weighted / overall_weight) / 25, 2) if overall_weight > 0 else 0
    )

    return {
        "student_id": student_id,
        "overall_gpa": overall_gpa,
        "class_gpas": {
            str(cid): {
                "gpa": data["gpa"],
                "class_code": data["class"].code if data.get("class") else None,
                "class_name": data["class"].name if data.get("class") else None,
                "assignment_count": len(data["assignments"]),
            }
            for cid, data in class_gpas.items()
        },
        "total_assignments": len(grades),
    }


@router.put("/{grade_id}", response_model=GradeResponse)
def update_grade(
    grade_id: int,
    grade_update: GradeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")

    class_obj = db.query(Class).filter(Class.id == grade.class_id).first()
    if (
        current_user.role == UserRole.TEACHER
        and class_obj.teacher_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = grade_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(grade, field, value)

    # Recalculate percentage if score or max_score changed
    if "score" in update_data or "max_score" in update_data:
        grade.percentage = (grade.score / grade.max_score) * 100

    db.commit()
    db.refresh(grade)
    return GradeResponse.model_validate(grade)


@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grade(
    grade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")

    class_obj = db.query(Class).filter(Class.id == grade.class_id).first()
    if (
        current_user.role == UserRole.TEACHER
        and class_obj.teacher_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(grade)
    db.commit()
