from fastapi import FastAPI

from app.api.routes.chat import router as chat_router
from app.api.routes.health import router as health_router
from app.core.config import get_settings
from os import getenv
from fastapi.middleware.cors import CORSMiddleware

settings = get_settings()

app = FastAPI(
    title="Main Backend Service",
    version="0.1.0",
)

# CORS middleware
# Configure CORS (reads MAIN_BACKEND_CORS_ORIGINS, defaults to localhost:5173)
cors_origins = [
    o.strip()
    for o in getenv("MAIN_BACKEND_CORS_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["health"])
async def root() -> dict:
    """Simple root endpoint to verify the service is running."""
    return {"service": "main-backend", "status": "ok"}


@app.get("/health", tags=["health"])
async def service_health() -> dict:
    """Top-level health endpoint for load balancer checks."""
    return {"status": "ok"}


# Mount routers
app.include_router(health_router, prefix="/api")
app.include_router(chat_router)
