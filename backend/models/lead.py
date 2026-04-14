from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, TypeDecorator, Float, cast, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
import enum
from datetime import datetime, timezone
from db.connection import Base


class LeadStatus(enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    INTERESTED = "interested"
    FOLLOW_UP = "follow-up"
    CONVERTED = "converted"
    LOST = "lost"


class LeadType(enum.Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class LeadTypeColumn(TypeDecorator):
    """Normalize DB leadtype (INBOUND/OUTBOUND vs inbound/outbound) for PostgreSQL enums."""

    impl = String(32)
    cache_ok = True

    def bind_expression(self, bindvalue):
        return cast(bindvalue, PG_ENUM(name="leadtype", create_type=False))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, LeadType):
            return value.value.upper()
        return str(value).strip().replace("-", "_").upper()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, LeadType):
            return value
        s = str(value).strip()
        sl = s.lower()
        try:
            return LeadType(sl)
        except ValueError:
            pass
        legacy = {"INBOUND": LeadType.INBOUND, "OUTBOUND": LeadType.OUTBOUND}
        if s in legacy:
            return legacy[s]
        raise ValueError(f"Unknown lead_type in database: {value!r}")


class LeadStatusColumn(TypeDecorator):
    """Normalize DB leadstatus (uppercase labels vs lowercase values, follow_up vs follow-up)."""

    impl = String(32)
    cache_ok = True

    def bind_expression(self, bindvalue):
        return cast(bindvalue, PG_ENUM(name="leadstatus", create_type=False))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, LeadStatus):
            normalized = value.value
        else:
            normalized = str(value).strip().lower().replace("_", "-").replace(" ", "-")

        if normalized == "lost":
            return "NOT_INTERESTED"
        if normalized == "follow-up":
            return "FOLLOW_UP"
        return normalized.upper()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, LeadStatus):
            return value
        s = str(value).strip()
        norm = s.lower().replace("_", "-")
        try:
            return LeadStatus(norm)
        except ValueError:
            pass
        legacy = {
            "NEW": LeadStatus.NEW,
            "CONTACTED": LeadStatus.CONTACTED,
            "INTERESTED": LeadStatus.INTERESTED,
            "FOLLOW_UP": LeadStatus.FOLLOW_UP,
            "FOLLOW-UP": LeadStatus.FOLLOW_UP,
            "CONVERTED": LeadStatus.CONVERTED,
            "LOST": LeadStatus.LOST,
            "NOT_INTERESTED": LeadStatus.LOST,
            "NOT-INTERESTED": LeadStatus.LOST,
        }
        if s in legacy:
            return legacy[s]
        raise ValueError(f"Unknown lead status in database: {value!r}")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, index=True)
    phone = Column(String)
    company_name = Column(String)
    website_url = Column(String)
    linkedin_url = Column(String)
    location = Column(String)

    source = Column(String)  # e.g., Facebook, Google, Referral
    source_detail = Column(String)
    lead_type = Column(LeadTypeColumn(), default=LeadType.INBOUND, index=True)
    status = Column(LeadStatusColumn(), default=LeadStatus.NEW, index=True)

    assigned_to = Column(Integer, ForeignKey("users.id"), index=True)
    
    interest = Column(String)
    budget = Column(String)
    timeline = Column(String)
    description = Column(Text, nullable=True)
    notes = Column(String)
    priority = Column(String(16), nullable=True)  # hot | warm | cold
    category = Column(String)
    industry = Column(String)
    
    # Financials for "Converted" status
    payment_amount = Column(Float, default=0.0)
    payment_method = Column(String)
    
    # Dates
    follow_up_date = Column(DateTime(timezone=True))
    last_contacted = Column(DateTime(timezone=True))
    follow_up_count = Column(Integer, default=0)
    converted_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    is_deleted = Column(Boolean, default=False, index=True)

    assignee = relationship("User", back_populates="leads")
    followups = relationship("FollowUp", back_populates="lead")
    activities = relationship("Activity", back_populates="lead")
    remarks = relationship(
        "LeadRemark",
        back_populates="lead",
        cascade="all, delete-orphan",
    )
