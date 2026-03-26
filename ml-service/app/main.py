from fastapi import FastAPI
from app.model.predictor import analyze_text

app = FastAPI()

@app.post("/api/analyze")
def analyze(data: dict):
    return analyze_text(data)
 
