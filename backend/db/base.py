from db.connection import Base
# Import all models here to ensure they are registered for migrations
from models.user import User
from models.lead import Lead
from models.followup import FollowUp
from models.activity import Activity
from models.lead_remark import LeadRemark  # noqa: F401
