from fastapi import FastAPI

from app.api.routes.chat import router as chat_router
from app.api.routes.health import router as health_router
from app.core.config import get_settings


settings = get_settings()

app = FastAPI(
    title="Main Backend Service",
    version="0.1.0",
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
