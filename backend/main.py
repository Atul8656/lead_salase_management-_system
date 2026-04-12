from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routes import auth_routes, lead_routes, user_routes, followup_routes, report_routes

# redirect_slashes=False avoids 307 /api/leads → /api/leads/ where clients drop Authorization
app = FastAPI(title="Lead & Sales Management API", redirect_slashes=False)

_cors = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
if not _cors:
    _cors = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth_routes.router, prefix="/api/auth", tags=["auth"])
app.include_router(user_routes.router, prefix="/api/users", tags=["users"])
app.include_router(lead_routes.router, prefix="/api/leads", tags=["leads"])
app.include_router(followup_routes.router, prefix="/api/followups", tags=["followups"])
app.include_router(report_routes.router, prefix="/api/reports", tags=["reports"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Lead & Sales Management API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
