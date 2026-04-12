from sqlalchemy.orm import Session
from models.activity import Activity

def log_activity(db: Session, lead_id: int, user_id: int, action: str, details: str = None):
    activity = Activity(
        lead_id=lead_id,
        user_id=user_id,
        action=action,
        details=details
    )
    db.add(activity)
    db.commit()
    return activity

def get_lead_activities(db: Session, lead_id: int):
    return db.query(Activity).filter(Activity.lead_id == lead_id).order_by(Activity.created_at.desc()).all()
