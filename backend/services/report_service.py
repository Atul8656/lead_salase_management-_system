from sqlalchemy.orm import Session
from sqlalchemy import func
from models.lead import Lead, LeadStatus
from models.user import User
from models.followup import FollowUp
from datetime import datetime, timedelta

def get_dashboard_summary(db: Session):
    total_leads = db.query(Lead).count()
    leads_by_status = db.query(Lead.status, func.count(Lead.id)).group_by(Lead.status).all()
    leads_by_status_dict = {status.value: count for status, count in leads_by_status}
    
    # Fill in zeros for missing statuses
    for status in LeadStatus:
        if status.value not in leads_by_status_dict:
            leads_by_status_dict[status.value] = 0

    pending_followups = db.query(FollowUp).filter(
        FollowUp.is_completed == False,
        FollowUp.scheduled_at <= datetime.utcnow()
    ).count()

    # Active agents count
    active_agents = db.query(User).filter(User.is_active == True).count()

    won = leads_by_status_dict.get(LeadStatus.CONVERTED.value, 0)
    lost = leads_by_status_dict.get(LeadStatus.LOST.value, 0)
    total_closed = won + lost
    conversion_rate = (won / total_closed * 100) if total_closed > 0 else 0

    return {
        "total_leads": total_leads,
        "status_summary": leads_by_status_dict,
        "pending_followups": pending_followups,
        "active_agents": active_agents,
        "conversion_rate": round(conversion_rate, 2)
    }

def get_agent_performance(db: Session):
    # Performance by user
    performance = db.query(
        User.full_name,
        func.count(Lead.id).label("total_assigned"),
        func.sum(func.case((Lead.status == LeadStatus.CONVERTED, 1), else_=0)).label("won_leads")
    ).join(Lead, User.id == Lead.assigned_to).group_by(User.id).all()

    return [
        {
            "agent_name": p.full_name,
            "total_assigned": p.total_assigned,
            "won_leads": p.won_leads or 0,
            "win_rate": round((p.won_leads or 0) / p.total_assigned * 100, 2) if p.total_assigned > 0 else 0
        }
        for p in performance
    ]
