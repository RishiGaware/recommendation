from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
def get_sample_status():
    return {"message": "SampleDomain auto-discovered and mounted successfully!"}
