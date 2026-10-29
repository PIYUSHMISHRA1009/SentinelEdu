from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_teacher
from app.services.data_quality_service import data_quality_service

router = APIRouter()


@router.get("/report")
def get_data_quality_report(
    db: Session = Depends(get_db), current_user=Depends(require_teacher)
):
    """Full data quality report."""
    return data_quality_service.run_quality_checks(db)
