import csv
from datetime import datetime
from io import StringIO
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from db.connection import get_db
from middleware.auth_middleware import get_current_user
from models.lead import LeadStatus, LeadType
from models.user import User
from schemas import activity_schema
from schemas import lead_schema
from services import activity_service
from services import lead_service

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
    return lead_service.stats_for_user(db, current_user)


@router.get("/export/csv")
def export_leads_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    leads = lead_service.get_leads(db, skip=0, limit=10000, user=current_user)
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


@router.get("/import/sample")
def download_import_sample():
    return Response(
        content=lead_service.SAMPLE_CSV,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="leads_import_sample.csv"',
        },
    )


@router.post("/import")
async def import_leads(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    rows = lead_service.parse_import_file(content, file.filename or "upload.csv")
    if not rows:
        raise HTTPException(status_code=400, detail="No data rows found in file")
    return lead_service.import_leads_from_rows(db, rows, current_user.id)


@router.get("/overdue", response_model=List[lead_schema.Lead])
def overdue_followups(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return lead_service.get_overdue_leads(db, current_user, skip=skip, limit=limit)


@router.post("", response_model=lead_schema.Lead)
@router.post("/", response_model=lead_schema.Lead)
def create_lead(
    lead: lead_schema.LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return lead_service.create_lead(db=db, lead=lead, user_id=current_user.id)


@router.get("", response_model=lead_schema.LeadListOut)
@router.get("/", response_model=lead_schema.LeadListOut)
def read_leads(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    q: Optional[str] = None,
    status: Optional[LeadStatus] = None,
    assigned_to: Optional[int] = None,
    lead_type: Optional[LeadType] = None,
    created_from: Optional[datetime] = None,
    created_to: Optional[datetime] = None,
    overdue_only: bool = False,
    follow_up_today: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = lead_service.search_leads(
        db,
        current_user,
        skip=skip,
        limit=limit,
        q=q,
        status=status,
        assigned_to=assigned_to,
        lead_type=lead_type,
        created_from=created_from,
        created_to=created_to,
        overdue_only=overdue_only,
        follow_up_today=follow_up_today,
    )
    return lead_schema.LeadListOut(items=items, total=total)


@router.patch("/{lead_id}", response_model=lead_schema.Lead)
def patch_lead(
    lead_id: int,
    lead_update: lead_schema.LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead_service.get_lead_for_user(db, lead_id, current_user)
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
    lead_service.get_lead_for_user(db, lead_id, current_user)
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
    lead_service.get_lead_for_user(db, lead_id, current_user)
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
    lead_service.get_lead_for_user(db, lead_id, current_user)
    rows = activity_service.get_lead_activities(db, lead_id, limit=20)
    return [
        activity_schema.ActivityRead(
            id=a.id,
            lead_id=a.lead_id,
            user_id=a.user_id,
            user_name=(a.user.full_name or a.user.email) if a.user else None,
            action=a.action,
            details=a.details,
            created_at=a.created_at,
        )
        for a in rows
    ]


@router.get("/{lead_id}", response_model=lead_schema.Lead)
def read_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return lead_service.get_lead_for_user(db, lead_id, current_user)
