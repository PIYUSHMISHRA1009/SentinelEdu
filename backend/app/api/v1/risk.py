from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.deps import get_db, get_current_active_user, require_teacher
from app.core.audit_logger import audit_logger
from app.db.models import User, UserRole, Class, Enrollment, RiskAssessment, Grade, Attendance, AttendanceStatus
from app.schemas import RiskAssessmentResponse, RiskLevel, StudentRiskSummary, StudentTrends, TrendPoint, ClassResponse
from app.services.risk_scorer import risk_scorer


router = APIRouter()


@router.post("/assess", response_model=List[RiskAssessmentResponse])
def assess_all_students(
    request: Request,
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """Run risk assessment for all students (or for a specific class)."""
    if class_id:
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        if current_user.role == UserRole.TEACHER and class_obj.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    results = risk_scorer.assess_all_students(db, class_id)
    
    audit_logger.risk_assessment(
        user_id=current_user.id,
        student_id=None,  # batch assessment
        class_id=class_id,
        risk_score=None,  # batch
        risk_level=None,
        request=request,
        details={"students_assessed": len(results), "class_id": class_id}
    )
    
    # Return the saved assessments from DB
    response_list = []
    for r in results:
        # Get the latest assessment from DB
        latest_assessment = db.query(RiskAssessment).filter(
            RiskAssessment.student_id == r["student_id"]
        )
        if class_id:
            latest_assessment = latest_assessment.filter(RiskAssessment.class_id == class_id)
        latest_assessment = latest_assessment.order_by(RiskAssessment.assessed_at.desc()).first()
        
        if latest_assessment:
            student = db.query(User).filter(User.id == r["student_id"]).first()
            class_obj = db.query(Class).filter(Class.id == class_id).first() if class_id else None
            resp = RiskAssessmentResponse.model_validate(latest_assessment)
            resp.student_name = student.full_name if student else None
            resp.class_code = class_obj.code if class_obj else None
            response_list.append(resp)
    
    return response_list


@router.get("/student/{student_id}", response_model=RiskAssessmentResponse)
def get_student_risk(
    student_id: int,
    request: Request,
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get risk assessment for a specific student."""
    # Check access
    if current_user.role == UserRole.STUDENT and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student = db.query(User).filter(User.id == student_id, User.role == UserRole.STUDENT).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if class_id:
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(status_code=404, detail="Class not found")
        if current_user.role == UserRole.TEACHER and class_obj.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Check enrollment
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.class_id == class_id,
            Enrollment.is_active == True
        ).first()
        if not enrollment and current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Student not enrolled in this class")
    
    risk = risk_scorer.predict_risk(db, student_id, class_id)
    
    # Save assessment
    assessment = RiskAssessment(
        student_id=student_id,
        class_id=class_id,
        risk_score=risk["risk_score"],
        risk_level=risk["risk_level"],
        gpa_trend=risk["gpa_trend"],
        attendance_trend=risk["attendance_trend"],
        factors=str(risk["factors"]),
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return RiskAssessmentResponse(
        id=assessment.id,
        student_id=student_id,
        student_name=student.full_name,
        class_id=class_id,
        class_code=class_obj.code if class_obj else None,
        **risk,
        assessed_at=assessment.assessed_at,
    )


@router.get("/student/{student_id}/history", response_model=List[RiskAssessmentResponse])
def get_student_risk_history(
    student_id: int,
    class_id: Optional[int] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get risk assessment history for a student."""
    if current_user.role == UserRole.STUDENT and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = db.query(RiskAssessment).filter(RiskAssessment.student_id == student_id)
    if class_id:
        query = query.filter(RiskAssessment.class_id == class_id)
    
    assessments = query.order_by(RiskAssessment.assessed_at.desc()).limit(limit).all()
    
    result = []
    for a in assessments:
        student = db.query(User).filter(User.id == a.student_id).first()
        class_obj = db.query(Class).filter(Class.id == a.class_id).first() if a.class_id else None
        resp = RiskAssessmentResponse.model_validate(a)
        resp.student_name = student.full_name if student else None
        resp.class_code = class_obj.code if class_obj else None
        result.append(resp)
    
    return result


@router.get("/dashboard/summary", response_model=List[StudentRiskSummary])
def get_risk_dashboard(
    class_id: Optional[int] = None,
    department: Optional[str] = None,
    risk_level: Optional[RiskLevel] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get risk summary for dashboard - list of students with risk scores."""
    # Base query: get students
    query = db.query(User).filter(User.role == UserRole.STUDENT)
    
    if department:
        query = query.filter(User.department == department)
    
    # RBAC filtering
    if current_user.role == UserRole.TEACHER:
        # Teacher sees only students in their classes
        if class_id:
            class_obj = db.query(Class).filter(Class.id == class_id).first()
            if not class_obj or class_obj.teacher_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized")
            student_ids = db.query(Enrollment.student_id).filter(
                Enrollment.class_id == class_id,
                Enrollment.is_active == True
            ).subquery()
            query = query.filter(User.id.in_(student_ids))
        else:
            # All classes taught by this teacher
            teacher_class_ids = db.query(Class.id).filter(Class.teacher_id == current_user.id).subquery()
            student_ids = db.query(Enrollment.student_id).filter(
                Enrollment.class_id.in_(teacher_class_ids),
                Enrollment.is_active == True
            ).subquery()
            query = query.filter(User.id.in_(student_ids))
    elif current_user.role == UserRole.STUDENT:
        # Student only sees themselves
        query = query.filter(User.id == current_user.id)
    
    students = query.all()
    
    results = []
    for student in students:
        # Get latest risk assessment
        risk_query = db.query(RiskAssessment).filter(RiskAssessment.student_id == student.id)
        if class_id:
            risk_query = risk_query.filter(RiskAssessment.class_id == class_id)
        latest_risk = risk_query.order_by(RiskAssessment.assessed_at.desc()).first()
        
        # If no assessment exists, generate one
        if not latest_risk:
            risk_data = risk_scorer.predict_risk(db, student.id, class_id)
            risk_score = risk_data["risk_score"]
            risk_lvl = risk_data["risk_level"]
            gpa_trend = risk_data["gpa_trend"]
            att_trend = risk_data["attendance_trend"]
        else:
            risk_score = latest_risk.risk_score
            risk_lvl = latest_risk.risk_level
            gpa_trend = latest_risk.gpa_trend
            att_trend = latest_risk.attendance_trend
        
        # Filter by risk level if specified
        if risk_level and risk_lvl != risk_level.value:
            continue
        
        # Get GPA and attendance summary
        from app.api.v1.grades import get_student_grade_summary
        from app.api.v1.attendance import get_attendance_summary
        
        # Simple GPA calc
        grade_query = db.query(Grade).filter(Grade.student_id == student.id)
        if class_id:
            grade_query = grade_query.filter(Grade.class_id == class_id)
        grades = grade_query.all()
        
        current_gpa = None
        if grades:
            avg_pct = sum(g.percentage for g in grades) / len(grades)
            current_gpa = round(avg_pct / 25, 2)
        
        # Attendance rate
        att_query = db.query(Attendance).filter(Attendance.student_id == student.id)
        if class_id:
            att_query = att_query.filter(Attendance.class_id == class_id)
        attendance = att_query.all()
        
        attendance_rate = None
        if attendance:
            total = len(attendance)
            attended = sum(1 for a in attendance if a.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.EXCUSED])
            attendance_rate = round(attended / total * 100, 2)
        
        # Get enrolled classes
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == student.id,
            Enrollment.is_active == True
        ).all()
        class_list = []
        for e in enrollments:
            c = db.query(Class).filter(Class.id == e.class_id).first()
            if c:
                class_list.append(ClassResponse.model_validate(c))
        
        results.append(StudentRiskSummary(
            student_id=student.id,
            student_name=student.full_name,
            email=student.email,
            department=student.department or "",
            semester=student.semester if hasattr(student, 'semester') else 1,
            current_gpa=current_gpa,
            attendance_rate=attendance_rate,
            risk_score=risk_score,
            risk_level=RiskLevel(risk_lvl),
            gpa_trend=gpa_trend,
            attendance_trend=att_trend,
            classes=class_list,
        ))
    
    # Sort by risk score descending
    results.sort(key=lambda x: x.risk_score or 0, reverse=True)
    return results


@router.get("/student/{student_id}/trends", response_model=StudentTrends)
def get_student_trends(
    student_id: int,
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get GPA and attendance trends over time for charts."""
    if current_user.role == UserRole.STUDENT and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # GPA trend - by assignment date
    grade_query = db.query(Grade).filter(Grade.student_id == student_id)
    if class_id:
        grade_query = grade_query.filter(Grade.class_id == class_id)
    grades = grade_query.order_by(Grade.graded_at.asc()).all()
    
    gpa_trend = []
    for g in grades:
        gpa_trend.append(TrendPoint(
            date=g.graded_at.isoformat(),
            value=round(g.percentage / 25, 2)  # Convert to 4.0 scale
        ))
    
    # Attendance trend - by month
    att_query = db.query(Attendance).filter(Attendance.student_id == student_id)
    if class_id:
        att_query = att_query.filter(Attendance.class_id == class_id)
    attendance = att_query.order_by(Attendance.date.asc()).all()
    
    # Group by month
    monthly = {}
    for a in attendance:
        month_key = a.date.strftime("%Y-%m")
        if month_key not in monthly:
            monthly[month_key] = {"total": 0, "attended": 0}
        monthly[month_key]["total"] += 1
        if a.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.EXCUSED]:
            monthly[month_key]["attended"] += 1
    
    attendance_trend = []
    for month, data in sorted(monthly.items()):
        rate = round(data["attended"] / data["total"] * 100, 2) if data["total"] > 0 else 0
        attendance_trend.append(TrendPoint(
            date=f"{month}-01",
            value=rate
        ))
    
    return StudentTrends(
        student_id=student_id,
        gpa_trend=gpa_trend,
        attendance_trend=attendance_trend,
    )