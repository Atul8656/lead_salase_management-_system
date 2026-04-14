from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routes import auth_routes, lead_routes, user_routes, followup_routes, todo_routes

# redirect_slashes=False avoids 307 /api/leads → /api/leads/ where clients drop Authorization
app = FastAPI(title="SALENLO API", redirect_slashes=False)

# Explicit dev origins + any from .env. Quick tunnels (*.trycloudflare.com) match via regex
# so you do not need to edit .env every time the tunnel hostname changes.
_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
_env_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
_cors = list(dict.fromkeys([*_default_origins, *_env_origins]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/")
async def root():
    return {"message": "SALENLO API", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
