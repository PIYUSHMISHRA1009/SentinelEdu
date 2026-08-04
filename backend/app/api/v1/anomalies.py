from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.deps import get_db, get_current_active_user, require_teacher
from app.core.audit_logger import audit_logger
from app.db.models import User, UserRole, AuditLog
from app.services.anomaly_detector import anomaly_detector

router = APIRouter()


@router.get("/anomalies", response_model=List[dict])
def get_anomalies(
    request: Request,
    hours_back: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """Get detected anomalies from audit logs."""
    anomalies = anomaly_detector.detect_anomalies(db, hours_back=hours_back)
    
    audit_logger.data_access(
        user_id=current_user.id,
        user_email=current_user.email,
        resource="security/anomalies",
        action="read",
        request=request,
        details={"hours_back": hours_back, "anomalies_found": len(anomalies)}
    )
    
    return anomalies


@router.get("/impossible-travel", response_model=List[dict])
def get_impossible_travel(
    request: Request,
    hours_back: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """Detect impossible travel patterns."""
    alerts = anomaly_detector.detect_impossible_travel(db, hours_back=hours_back)
    
    audit_logger.data_access(
        user_id=current_user.id,
        user_email=current_user.email,
        resource="security/impossible-travel",
        action="read",
        request=request,
        details={"hours_back": hours_back, "alerts_found": len(alerts)}
    )
    
    return alerts


@router.get("/privilege-escalation", response_model=List[dict])
def get_privilege_escalation(
    request: Request,
    hours_back: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """Detect privilege escalation attempts."""
    alerts = anomaly_detector.detect_privilege_escalation(db, hours_back=hours_back)
    
    audit_logger.data_access(
        user_id=current_user.id,
        user_email=current_user.email,
        resource="security/privilege-escalation",
        action="read",
        request=request,
        details={"hours_back": hours_back, "alerts_found": len(alerts)}
    )
    
    return alerts


@router.get("/brute-force", response_model=List[dict])
def get_brute_force(
    request: Request,
    hours_back: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """Detect brute force login attempts."""
    alerts = anomaly_detector.detect_brute_force(db, hours_back=hours_back)
    
    audit_logger.data_access(
        user_id=current_user.id,
        user_email=current_user.email,
        resource="security/brute-force",
        action="read",
        request=request,
        details={"hours_back": hours_back, "alerts_found": len(alerts)}
    )
    
    return alerts


@router.get("/full-detection", response_model=dict)
def run_full_detection(
    request: Request,
    hours_back: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    """Run all detection algorithms."""
    results = anomaly_detector.run_full_detection(db, hours_back=hours_back)
    
    audit_logger.data_access(
        user_id=current_user.id,
        user_email=current_user.email,
        resource="security/full-detection",
        action="read",
        request=request,
        details={"hours_back": hours_back, "total_alerts": results.get("total_alerts", 0)}
    )
    
    return results