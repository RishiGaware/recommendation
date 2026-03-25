from fastapi import FastAPI
from app.model.predictor import analyze_text

app = FastAPI()

@app.post("/api/analyze")
def analyze(data: dict):
    text = data.get("text", "")
    return analyze_text(text)
