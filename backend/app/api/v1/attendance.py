from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, require_teacher
from app.db.models import (
    Attendance,
    AttendanceStatus,
    Class,
    Enrollment,
    User,
    UserRole,
)
from app.schemas import AttendanceCreate, AttendanceResponse, AttendanceUpdate

router = APIRouter()


class BulkAttendanceRequest(BaseModel):
    class_id: int
    date: date
    records: List[AttendanceCreate]


@router.post("", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def record_attendance(
    attendance_data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    class_obj = db.query(Class).filter(Class.id == attendance_data.class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    if (
        current_user.role == UserRole.TEACHER
        and class_obj.teacher_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    student = (
        db.query(User)
        .filter(User.id == attendance_data.student_id, User.role == UserRole.STUDENT)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == attendance_data.student_id,
            Enrollment.class_id == attendance_data.class_id,
            Enrollment.is_active.is_(True),
        )
        .first()
    )
    if not enrollment:
        raise HTTPException(
            status_code=400, detail="Student not enrolled in this class"
        )

    # Check if already exists
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == attendance_data.student_id,
            Attendance.class_id == attendance_data.class_id,
            Attendance.date == attendance_data.date,
        )
        .first()
    )
    if existing:
        existing.status = attendance_data.status
        db.commit()
        db.refresh(existing)
        return AttendanceResponse.model_validate(existing)

    attendance = Attendance(**attendance_data.model_dump())
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return AttendanceResponse.model_validate(attendance)


@router.post("/bulk", response_model=List[AttendanceResponse])
def record_bulk_attendance(
    bulk_data: BulkAttendanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    class_obj = db.query(Class).filter(Class.id == bulk_data.class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    if (
        current_user.role == UserRole.TEACHER
        and class_obj.teacher_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    results = []
    for record in bulk_data.records:
        record.class_id = bulk_data.class_id
        record.date = datetime.combine(bulk_data.date, datetime.min.time())

        enrollment = (
            db.query(Enrollment)
            .filter(
                Enrollment.student_id == record.student_id,
                Enrollment.class_id == bulk_data.class_id,
                Enrollment.is_active.is_(True),
            )
            .first()
        )
        if not enrollment:
            continue

        existing = (
            db.query(Attendance)
            .filter(
                Attendance.student_id == record.student_id,
                Attendance.class_id == bulk_data.class_id,
                Attendance.date == record.date,
            )
            .first()
        )

        if existing:
            existing.status = record.status
            results.append(AttendanceResponse.model_validate(existing))
        else:
            attendance = Attendance(**record.model_dump())
            db.add(attendance)
            results.append(attendance)  # Will be validated after commit

    db.commit()
    # Refresh all
    for r in results:
        if isinstance(r, Attendance):
            db.refresh(r)

    return [AttendanceResponse.model_validate(r) for r in results]


@router.get("", response_model=List[AttendanceResponse])
def list_attendance(
    student_id: Optional[int] = None,
    class_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Attendance)

    # RBAC
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Attendance.student_id == current_user.id)
        if student_id and student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.TEACHER:
        teacher_class_ids = (
            db.query(Class.id).filter(Class.teacher_id == current_user.id).subquery()
        )
        query = query.filter(Attendance.class_id.in_(teacher_class_ids))
        if student_id:
            query = query.filter(Attendance.student_id == student_id)
    else:  # Admin
        if student_id:
            query = query.filter(Attendance.student_id == student_id)

    if class_id:
        query = query.filter(Attendance.class_id == class_id)
    if start_date:
        query = query.filter(
            Attendance.date >= datetime.combine(start_date, datetime.min.time())
        )
    if end_date:
        query = query.filter(
            Attendance.date <= datetime.combine(end_date, datetime.max.time())
        )

    records = query.order_by(Attendance.date.desc()).offset(skip).limit(limit).all()

    result = []
    for a in records:
        student = db.query(User).filter(User.id == a.student_id).first()
        class_obj = db.query(Class).filter(Class.id == a.class_id).first()
        resp = AttendanceResponse.model_validate(a)
        resp.student_name = student.full_name if student else None
        resp.class_code = class_obj.code if class_obj else None
        result.append(resp)

    return result


@router.get("/student/{student_id}/class/{class_id}/summary")
def get_attendance_summary(
    student_id: int,
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
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

    records = (
        db.query(Attendance)
        .filter(Attendance.student_id == student_id, Attendance.class_id == class_id)
        .all()
    )

    total = len(records)
    present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
    late = sum(1 for r in records if r.status == AttendanceStatus.LATE)
    excused = sum(1 for r in records if r.status == AttendanceStatus.EXCUSED)
    absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)

    # Present + Late + Excused count as "attended" for rate calculation
    attended = present + late + excused
    rate = round((attended / total * 100), 2) if total > 0 else 0

    return {
        "student_id": student_id,
        "class_id": class_id,
        "total_sessions": total,
        "present": present,
        "late": late,
        "excused": excused,
        "absent": absent,
        "attendance_rate": rate,
    }


@router.get("/class/{class_id}/summary")
def get_class_attendance_summary(
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

    # Get all enrollments
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.class_id == class_id, Enrollment.is_active.is_(True))
        .all()
    )

    summary = []
    for e in enrollments:
        student = db.query(User).filter(User.id == e.student_id).first()
        records = (
            db.query(Attendance)
            .filter(
                Attendance.student_id == e.student_id, Attendance.class_id == class_id
            )
            .all()
        )

        total = len(records)
        present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        late = sum(1 for r in records if r.status == AttendanceStatus.LATE)
        excused = sum(1 for r in records if r.status == AttendanceStatus.EXCUSED)
        absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        attended = present + late + excused
        rate = round((attended / total * 100), 2) if total > 0 else 0

        summary.append(
            {
                "student_id": e.student_id,
                "student_name": student.full_name if student else None,
                "total_sessions": total,
                "present": present,
                "late": late,
                "excused": excused,
                "absent": absent,
                "attendance_rate": rate,
            }
        )

    return {
        "class_id": class_id,
        "class_code": class_obj.code,
        "class_name": class_obj.name,
        "students": summary,
    }


@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int,
    attendance_update: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    class_obj = db.query(Class).filter(Class.id == attendance.class_id).first()
    if (
        current_user.role == UserRole.TEACHER
        and class_obj.teacher_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    if attendance_update.status is not None:
        attendance.status = attendance_update.status

    db.commit()
    db.refresh(attendance)
    return AttendanceResponse.model_validate(attendance)


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    class_obj = db.query(Class).filter(Class.id == attendance.class_id).first()
    if (
        current_user.role == UserRole.TEACHER
        and class_obj.teacher_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(attendance)
    db.commit()
