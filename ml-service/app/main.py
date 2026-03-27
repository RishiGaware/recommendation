from fastapi import FastAPI
from app.model.predictor import analyze_text, add_to_index

app = FastAPI()

@app.post("/api/analyze")
def analyze(data: dict):
    return analyze_text(data)

@app.post("/api/add-knowledge")
def add_knowledge(data: dict):
    return add_to_index(data)
 
