from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.connection import get_db
from middleware.auth_middleware import get_current_user
from models.user import User, UserRole
from services import report_service

router = APIRouter()

@router.get("/summary")
def get_report_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Only Admin and Managers can see global summary
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized to view global reports")
    return report_service.get_dashboard_summary(db)

@router.get("/performance")
def get_performance_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized to view performance reports")
    return report_service.get_agent_performance(db)
