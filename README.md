# Deviation AI System

A multi-service deviation analyzer using Machine Learning (TF-IDF + Cosine Similarity).

## Architecture

- **Frontend**: React (Vite) - Port 5173
- **ML Service**: Python (FastAPI) - Port 8000

## Getting Started

### 1. ML Service (Python)
```bash
cd ml-service
# Install dependencies
pip install -r requirements.txt
# Run service
uvicorn app.main:app --reload
```

### 2. Frontend Service (React)
```bash
cd frontend
# Install dependencies
npm install
# Run service
npm run dev
```

## How it Works
1. Frontend sends deviation title and description directly to the Python ML service.
2. Python ML service uses TF-IDF vectorization and Cosine Similarity to compare the input with historical deviations.
3. probable root causes and similar deviations are returned to the frontend.
