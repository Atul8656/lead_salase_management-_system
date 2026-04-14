from sqlalchemy.orm import Session
from models.followup import FollowUp
from models.lead import Lead
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
    results = (
        db.query(FollowUp, Lead.name.label("lead_name"))
        .join(Lead, FollowUp.lead_id == Lead.id)
        .filter(FollowUp.user_id == user_id, FollowUp.is_completed == False)
        .order_by(FollowUp.scheduled_at.asc())
        .all()
    )
    
    followups = []
    for f, name in results:
        f.lead_name = name
        followups.append(f)
    return followups

def complete_followup(db: Session, followup_id: int):
    db_followup = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
    if db_followup:
        db_followup.is_completed = True
        db.commit()
        db.refresh(db_followup)
        activity_service.log_activity(
            db,
            lead_id=db_followup.lead_id,
            user_id=db_followup.user_id,
            action="Follow-up completed",
            details=f"Completed follow-up scheduled for {db_followup.scheduled_at}"[:500],
        )
    return db_followup
