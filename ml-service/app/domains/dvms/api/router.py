from typing import Union, List, Dict
from fastapi import APIRouter, Request, Body
from app.domains.dvms.services.dvms_service import (
    analyze_text, 
    add_to_index, 
    clear_all_knowledge, 
    get_dvms_status
)
from app.domains.dvms.schemas.models import AnalysisRequest, AddKnowledgeRequest
from app.core.response_handler import standard_response

router = APIRouter()

@router.post("/analyze")
def analyze(payload: AnalysisRequest):
    """
    Performs similarity analysis against indexed deviations.
    """
    try:
        return analyze_text(payload.dict())
    except Exception as e:
        return standard_response(
            status="error",
            message=str(e),
            status_code=500
        )

@router.post("/add-knowledge")
async def add_knowledge(payload: Union[Dict, List[Dict]] = Body(...)):
    """
    Adds new deviation records to the vector search index.
    Supports single object or batch list.
    """
    # Note: We use dynamic Body for flexibility with current backend batching
    return add_to_index(payload)

@router.post("/clear-knowledge")
def clear_knowledge_call():
    """Wipes the index for a clean slate."""
    return clear_all_knowledge()

@router.get("/qdrant-status")
def get_qdrant_status():
    """Returns the current status and statistics of the vector database."""
    return get_dvms_status()

# For backward compatibility with some documentation/scripts that might use /setup-db
@router.post("/setup-db")
def setup_db():
    from app.domains.dvms.services.dvms_service import clear_all_knowledge
    return clear_all_knowledge()
