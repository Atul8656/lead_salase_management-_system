from sqlalchemy.orm import Session
from models.followup import FollowUp
from schemas.followup_schema import FollowUpCreate, FollowUpUpdate
from datetime import datetime
from services import activity_service


def create_followup(db: Session, followup: FollowUpCreate, user_id: int):
    db_followup = FollowUp(**followup.model_dump(), user_id=user_id)
    db.add(db_followup)
    db.commit()
    db.refresh(db_followup)
    activity_service.log_activity(
        db,
        lead_id=followup.lead_id,
        user_id=user_id,
        action="Follow-up scheduled",
        details=f"Scheduled at {db_followup.scheduled_at} | {db_followup.notes or ''}"[:500],
    )
    return db_followup

def get_user_followups(db: Session, user_id: int):
    return db.query(FollowUp).filter(FollowUp.user_id == user_id).all()

def complete_followup(db: Session, followup_id: int):
    db_followup = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
    if db_followup:
        db_followup.is_completed = True
        db.commit()
        db.refresh(db_followup)
    return db_followup
