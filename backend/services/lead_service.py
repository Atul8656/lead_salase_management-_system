from sqlalchemy.orm import Session
from models.lead import Lead, LeadStatus
from models.user import User
from schemas.lead_schema import LeadCreate, LeadUpdate, PipelineMove
from services import activity_service
from datetime import datetime
from fastapi import HTTPException


def _payment_ok(amount: float | None, method: str | None) -> bool:
    if amount is None or (isinstance(amount, (int, float)) and float(amount) <= 0):
        return False
    if not method or not str(method).strip():
        return False
    return True


def get_lead(db: Session, lead_id: int):
    return db.query(Lead).filter(Lead.id == lead_id).first()


def get_leads(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Lead).order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()


def get_overdue_leads(db: Session, skip: int = 0, limit: int = 200):
    now = datetime.utcnow()
    terminal = (LeadStatus.CONVERTED, LeadStatus.NOT_INTERESTED)
    return (
        db.query(Lead)
        .filter(
            Lead.follow_up_date.isnot(None),
            Lead.follow_up_date < now,
            Lead.status.notin_(terminal),
        )
        .order_by(Lead.follow_up_date.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_lead(db: Session, lead: LeadCreate, user_id: int):
    if lead.status == LeadStatus.INTERESTED and not lead.follow_up_date:
        raise HTTPException(
            status_code=400,
            detail="Follow-up date is required for 'Interested' leads",
        )

    if lead.status == LeadStatus.CONVERTED:
        if not _payment_ok(lead.payment_amount, lead.payment_method):
            raise HTTPException(
                status_code=400,
                detail="Payment amount and payment method are required for 'Converted' leads",
            )

    data = lead.model_dump()
    assignee_id = data.pop("assigned_to", None)
    if assignee_id is None:
        assignee_id = user_id
    target = db.query(User).filter(User.id == assignee_id).first()
    if not target:
        raise HTTPException(status_code=400, detail="Assigned user does not exist")
    data["assigned_to"] = assignee_id

    if lead.status == LeadStatus.CONVERTED:
        data["converted_at"] = datetime.utcnow()

    db_lead = Lead(**data)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)

    activity_service.log_activity(
        db,
        lead_id=db_lead.id,
        user_id=user_id,
        action="Lead Created",
        details=f"Lead {db_lead.name} added to the system.",
    )

    return db_lead


def update_lead(db: Session, lead_id: int, lead_update: LeadUpdate, user_id: int):
    db_lead = get_lead(db, lead_id)
    if not db_lead:
        return None

    update_data = lead_update.model_dump(exclude_unset=True)

    new_status = update_data.get("status")
    if new_status is not None:
        ns = (
            new_status.value
            if isinstance(new_status, LeadStatus)
            else str(new_status)
        )
        if ns == LeadStatus.INTERESTED.value:
            fu = update_data.get("follow_up_date")
            if fu is None and db_lead.follow_up_date is None:
                raise HTTPException(
                    status_code=400,
                    detail="Follow-up date is required for 'Interested' leads",
                )
        if ns == LeadStatus.CONVERTED.value:
            amt = update_data.get("payment_amount", db_lead.payment_amount)
            meth = update_data.get("payment_method", db_lead.payment_method)
            if not _payment_ok(amt, meth):
                raise HTTPException(
                    status_code=400,
                    detail="Payment amount and payment method are required for 'Converted' leads",
                )
            db_lead.converted_at = datetime.utcnow()

    changes = []
    for key, value in update_data.items():
        old_val = getattr(db_lead, key)
        if old_val != value:
            setattr(db_lead, key, value)
            changes.append(f"{key}: {old_val} -> {value}")

    if changes:
        db.commit()
        db.refresh(db_lead)
        activity_service.log_activity(
            db,
            lead_id=db_lead.id,
            user_id=user_id,
            action="Lead Updated",
            details=" | ".join(changes[:20]),
        )

    return db_lead


def delete_lead(db: Session, lead_id: int) -> bool:
    db_lead = get_lead(db, lead_id)
    if not db_lead:
        return False
    db.delete(db_lead)
    db.commit()
    return True


def move_lead_pipeline(
    db: Session, lead_id: int, move: PipelineMove, user_id: int
):
    db_lead = get_lead(db, lead_id)
    if not db_lead:
        return None

    new_status = move.status
    if new_status == LeadStatus.INTERESTED:
        fu = move.follow_up_date or db_lead.follow_up_date
        if fu is None:
            raise HTTPException(
                status_code=400,
                detail="Follow-up date is required when moving to 'Interested'",
            )

    if new_status == LeadStatus.CONVERTED:
        amt = move.payment_amount if move.payment_amount is not None else db_lead.payment_amount
        meth = move.payment_method if move.payment_method is not None else db_lead.payment_method
        if not _payment_ok(amt, meth):
            raise HTTPException(
                status_code=400,
                detail="Payment amount and payment method are required for 'Converted'",
            )
        db_lead.payment_amount = float(amt) if amt is not None else db_lead.payment_amount
        db_lead.payment_method = meth
        db_lead.converted_at = datetime.utcnow()

    old_status = db_lead.status
    db_lead.status = new_status
    if move.follow_up_date is not None:
        db_lead.follow_up_date = move.follow_up_date

    db.commit()
    db.refresh(db_lead)

    activity_service.log_activity(
        db,
        lead_id=db_lead.id,
        user_id=user_id,
        action="Pipeline Move",
        details=f"Moved from {old_status.value} to {new_status.value}",
    )
    return db_lead
