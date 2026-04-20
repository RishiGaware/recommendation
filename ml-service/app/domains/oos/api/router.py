from typing import Union, List, Dict, Optional
from fastapi import APIRouter, Request, Body, Query
from app.domains.oos.services.oos_service import (
    analyze_text, 
    add_to_index, 
    clear_oos_knowledge, 
    get_oos_status,
    get_oos_vectors_by_ids,
)
from app.domains.oos.ai.router import router as oos_ai_router
from app.domains.oos.schemas.models import AnalysisRequest
from app.core.response_handler import standard_response

router = APIRouter()
router.include_router(oos_ai_router, prefix="/ai", tags=["oos_ai"])

@router.post("/analyze")
def analyze(payload: AnalysisRequest):
    """
    Performs similarity analysis against phased OOS records.
    """
    try:
        return analyze_text(payload.dict())
    except Exception as e:
        return standard_response(status="error", message=str(e), status_code=500)

@router.post("/add-knowledge")
async def add_knowledge(payload: Union[Dict, List[Dict]] = Body(...)):
    """
    Adds new OOS records to the vector search index (supports phase 1 or 2).
    """
    return add_to_index(payload)

@router.post("/clear-knowledge")
def clear_knowledge_call(phase: Optional[int] = Query(None, description="Clear only specific phase (1 or 2)")):
    """Wipes the OOS index."""
    return clear_oos_knowledge(phase)

@router.get("/qdrant-status")
def get_qdrant_status():
    """Returns statistics of OOS collections."""
    return get_oos_status()

@router.post("/vectors")
def get_vectors(payload: dict = Body(...)):
    """
    Returns stored vectors for provided OOS IDs.
    Body: { "ids": [1,2,3], "phase": 1, "includeVectors": false }
    """
    return get_oos_vectors_by_ids(payload)
