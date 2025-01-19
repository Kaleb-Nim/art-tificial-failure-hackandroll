from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.config import Settings, get_settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FastAPI OpenAI Service")

# Validate settings on startup
@app.on_event("startup")
async def validate_config():
    try:
        settings = get_settings()
        logger.info("Configuration validated successfully")
    except Exception as e:
        logger.error(f"Configuration validation failed: {str(e)}")
        raise

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    try:
        settings = get_settings()
        return {
            "status": "healthy",
            "environment": settings.ENV,
            "config_validated": True
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Application configuration error"
        )