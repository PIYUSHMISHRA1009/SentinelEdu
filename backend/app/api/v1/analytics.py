from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_teacher
from app.db.models import User
from app.services.analytics_service import analytics_service

router = APIRouter()


@router.get("/summary", summary="Analytics summary")
def get_summary(
    db: Session = Depends(get_db), current_user: User = Depends(require_teacher)
) -> Dict[str, Any]:
    """
    Get analytics summary. Scoped to assigned students for Teachers; institution-wide for Admin.
    """
    return analytics_service.get_summary(db, current_user)


@router.get("/department-performance", summary="Performance by department")
def get_department_performance(
    db: Session = Depends(get_db), current_user: User = Depends(require_teacher)
) -> List[Dict[str, Any]]:
    """
    Get average performance metrics grouped by department.
    """
    return analytics_service.get_department_performance(db, current_user)


@router.get("/class-performance", summary="Performance by class")
def get_class_performance(
    db: Session = Depends(get_db), current_user: User = Depends(require_teacher)
) -> List[Dict[str, Any]]:
    """
    Get average performance metrics grouped by class.
    """
    return analytics_service.get_class_performance(db, current_user)


@router.get("/gpa-distribution", summary="GPA buckets")
def get_gpa_distribution(
    db: Session = Depends(get_db), current_user: User = Depends(require_teacher)
) -> List[Dict[str, Any]]:
    """
    Get the distribution of students across predefined GPA buckets.
    """
    return analytics_service.get_gpa_distribution(db, current_user)


@router.get("/attendance-vs-gpa", summary="Attendance vs GPA correlation")
def get_attendance_vs_gpa(
    db: Session = Depends(get_db), current_user: User = Depends(require_teacher)
) -> List[Dict[str, Any]]:
    """
    Get data points correlating attendance rates with GPAs.
    """
    return analytics_service.get_attendance_vs_gpa(db, current_user)


@router.get("/declining-students", summary="Students with declining performance")
def get_declining_students(
    limit: int = Query(20, description="Max number of students to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
) -> List[Dict[str, Any]]:
    """
    Get a list of students whose recent grades are significantly lower than earlier grades.
    """
    return analytics_service.get_declining_students(db, current_user, limit=limit)


@router.get("/intervention-priority", summary="Ranked intervention list")
def get_intervention_priority(
    limit: int = Query(20, description="Max number of students to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
) -> List[Dict[str, Any]]:
    """
    Get a ranked list of students who most need intervention based on grades, attendance, and risk.
    """
    return analytics_service.get_intervention_priority(db, current_user, limit=limit)


@router.get("/at-risk-summary", summary="At-risk summary counts")
def get_at_risk_summary(
    db: Session = Depends(get_db), current_user: User = Depends(require_teacher)
) -> List[Dict[str, Any]]:
    """
    Get a count of students grouped by their assessed risk level.
    """
    return analytics_service.get_at_risk_summary(db, current_user)


@router.get("/semester-trends", summary="Semester GPA trends")
def get_semester_trends(
    db: Session = Depends(get_db), current_user: User = Depends(require_teacher)
) -> List[Dict[str, Any]]:
    """
    Get average GPA broken down by semester.
    """
    return analytics_service.get_semester_trends(db, current_user)


@router.get("/risk-distribution", summary="Risk level distribution")
def get_risk_distribution(
    db: Session = Depends(get_db), current_user: User = Depends(require_teacher)
) -> List[Dict[str, Any]]:
    """
    Get the distribution of students by risk level (low, medium, high, critical).
    """
    return analytics_service.get_risk_distribution(db, current_user)
