from fastapi import APIRouter

from app.domains.ai_enhancement.api.v1.endpoints.dvms import router as dvms_router


router = APIRouter()

# Keep a clear API version boundary for future expansion.
router.include_router(dvms_router, prefix="/dvms", tags=["enhance_with_ai.dvms"])

