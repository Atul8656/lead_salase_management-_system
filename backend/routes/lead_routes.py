import csv
from io import StringIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from db.connection import get_db
from models.lead import Lead, LeadStatus
from schemas import lead_schema
from schemas import activity_schema
from services import lead_service
from services import activity_service
from middleware.auth_middleware import get_current_user
from models.user import User

router = APIRouter()


def _serialize_csv_val(v):
    if v is None:
        return ""
    if hasattr(v, "value"):
        return v.value
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return v


@router.get("/stats/summary")
def leads_stats_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Lead).count()
    by_status = db.query(Lead.status, func.count(Lead.id)).group_by(Lead.status).all()
    status_summary = {s.value: 0 for s in LeadStatus}
    for st, cnt in by_status:
        status_summary[st.value] = cnt
    converted = status_summary.get(LeadStatus.CONVERTED.value, 0)
    return {
        "total_leads": total,
        "status_summary": status_summary,
        "converted": converted,
    }


@router.get("/export/csv")
def export_leads_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    leads = lead_service.get_leads(db, skip=0, limit=10000)
    buf = StringIO()
    fieldnames = [
        "id",
        "name",
        "email",
        "phone",
        "company_name",
        "website_url",
        "linkedin_url",
        "location",
        "source",
        "source_detail",
        "lead_type",
        "status",
        "assigned_to",
        "interest",
        "budget",
        "timeline",
        "follow_up_date",
        "last_contacted",
        "follow_up_count",
        "notes",
        "payment_amount",
        "payment_method",
        "converted_at",
        "created_at",
    ]
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for L in leads:
        row = {k: _serialize_csv_val(getattr(L, k, None)) for k in fieldnames}
        writer.writerow(row)

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="leads_export.csv"',
        },
    )


@router.get("/overdue", response_model=List[lead_schema.Lead])
def overdue_followups(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return lead_service.get_overdue_leads(db, skip=skip, limit=limit)


@router.post("", response_model=lead_schema.Lead)
@router.post("/", response_model=lead_schema.Lead)
def create_lead(
    lead: lead_schema.LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return lead_service.create_lead(db=db, lead=lead, user_id=current_user.id)


@router.get("", response_model=List[lead_schema.Lead])
@router.get("/", response_model=List[lead_schema.Lead])
def read_leads(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return lead_service.get_leads(db, skip=skip, limit=limit)


@router.patch("/{lead_id}", response_model=lead_schema.Lead)
def patch_lead(
    lead_id: int,
    lead_update: lead_schema.LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = lead_service.update_lead(db, lead_id, lead_update, current_user.id)
    if updated is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return updated


@router.delete("/{lead_id}")
def remove_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ok = lead_service.delete_lead(db, lead_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"ok": True}


@router.patch("/{lead_id}/pipeline", response_model=lead_schema.Lead)
def pipeline_move(
    lead_id: int,
    move: lead_schema.PipelineMove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = lead_service.move_lead_pipeline(db, lead_id, move, current_user.id)
    if result is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return result


@router.get("/{lead_id}/activities", response_model=List[activity_schema.ActivityRead])
def lead_activities(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if lead_service.get_lead(db, lead_id) is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return activity_service.get_lead_activities(db, lead_id)


@router.get("/{lead_id}", response_model=lead_schema.Lead)
def read_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_lead = lead_service.get_lead(db, lead_id=lead_id)
    if db_lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return db_lead
