from fastapi import APIRouter
from app.domains.DVMS.model.analyze import analyze_text
from app.domains.DVMS.model.add_knowledge import add_to_index
from app.domains.DVMS.model.train import train_model

router = APIRouter()

@router.post("/analyze")
def analyze(data: dict):
    try:
        return analyze_text(data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@router.post("/add-knowledge")
def add_knowledge(data: dict):
    return add_to_index(data)

@router.post("/train")
def train(data: list):
    return train_model(data)

@router.post("/setup-db")
def setup_db():
    from qdrant_client.models import VectorParams, Distance
    from app.db.qdrant import get_qdrant_client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION
    client = get_qdrant_client()
    client.recreate_collection(collection_name=DVMS_DESC_COLLECTION, vectors_config=VectorParams(size=384, distance=Distance.COSINE))
    client.recreate_collection(collection_name=DVMS_ROOT_COLLECTION, vectors_config=VectorParams(size=384, distance=Distance.COSINE))
    return {"message": "Qdrant collections correctly initialized for the app."}

@router.get("/qdrant-status")
def get_qdrant_status():
    from app.db.qdrant import get_qdrant_client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION
    try:
        client = get_qdrant_client()
        desc_c = client.count(DVMS_DESC_COLLECTION).count
        root_c = client.count(DVMS_ROOT_COLLECTION).count
        
        # Grab snippet of the first item
        res = client.scroll(
            collection_name=DVMS_DESC_COLLECTION, 
            limit=1,
            with_payload=True, 
            with_vectors=False
        )
        sample = res[0][0].payload if res[0] else None
        
        return {
            "status": "connected to local qdrant", 
            "stored_vectors": {"dvms_desc": desc_c, "dvms_root": root_c},
            "sample_data": sample
        }
    except Exception as e:
        return {"status": "error", "message": f"Collections not set up. Error: {str(e)}"}

if __name__ == "__main__":
    pass
