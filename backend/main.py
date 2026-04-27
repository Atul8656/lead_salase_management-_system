from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routes import auth_routes, lead_routes, user_routes, followup_routes, todo_routes
from database import init_db
from db import base as _models  # noqa: F401

# redirect_slashes=False avoids 307 /api/leads → /api/leads/ where clients drop Authorization
app = FastAPI(title="SALENLO API", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://salenlo.netlify.app",
        "http://localhost:3000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth_routes.router, prefix="/api/auth", tags=["auth"])
app.include_router(user_routes.router, prefix="/api/users", tags=["users"])
app.include_router(lead_routes.router, prefix="/api/leads", tags=["leads"])
app.include_router(followup_routes.router, prefix="/api/followups", tags=["followups"])
app.include_router(todo_routes.router, prefix="/api/todos", tags=["todos"])


@app.on_event("startup")
def startup_create_tables() -> None:
    init_db()

@app.get("/health")
async def health_check():
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "SALENLO API"
    }

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {"message": "SALENLO API", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    import os
    # Use PORT from environment (for Render) or default to 8000
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
