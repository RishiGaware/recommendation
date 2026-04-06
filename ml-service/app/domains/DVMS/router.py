from fastapi import APIRouter
from app.domains.DVMS.model.analyze import analyze_text
from app.domains.DVMS.model.add_knowledge import add_to_index
from app.domains.DVMS.model.train import train_model

router = APIRouter()

@router.post("/analyze")
def analyze(data: dict):
    return analyze_text(data)

@router.post("/add-knowledge")
def add_knowledge(data: dict):
    return add_to_index(data)

@router.post("/train")
def train():
    return train_model()

if __name__ == "__main__":
    pass
