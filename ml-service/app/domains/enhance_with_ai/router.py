from fastapi import APIRouter

from app.domains.enhance_with_ai.api.v1.router import router as v1_router


router = APIRouter()

# Expose a stable, scalable API surface for this domain.
# We intentionally do not include "/v1" yet to preserve existing base paths.
router.include_router(v1_router)
