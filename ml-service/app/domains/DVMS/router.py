from fastapi import APIRouter, Request
from app.domains.DVMS.model.analyze import analyze_text
from app.domains.DVMS.model.add_knowledge import add_to_index
from app.domains.DVMS.model.clear_knowledge import clear_knowledge
from app.domains.DVMS.service import initialize_database_collections, fetch_qdrant_status
from app.core.response_handler import standard_response

router = APIRouter()

@router.post("/analyze")
def analyze(data: dict):
    try:
        return analyze_text(data)
    except Exception as e:
        return standard_response(
            status="error",
            message=str(e),
            status_code=500
        )

@router.post("/add-knowledge")
async def add_knowledge(request: Request):
    data = await request.json()
    return add_to_index(data)

@router.post("/clear-knowledge")
def clear_knowledge_call():
    """Wipes the index for a clean slate."""
    return clear_knowledge()

@router.post("/setup-db")
def setup_db():
    return initialize_database_collections()

@router.get("/qdrant-status")
def get_qdrant_status():
    try:
        return fetch_qdrant_status()
    except Exception as e:
        return standard_response(
            status="error", 
            message=f"Collections not set up. Error: {str(e)}",
            status_code=500
        )
