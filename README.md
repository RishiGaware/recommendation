# Deviation AI System

A multi-service deviation analyzer using Machine Learning (TF-IDF + Cosine Similarity).

## Architecture

- **Frontend**: React (Vite) - Port 5173
- **Backend**: Node.js (Express) - Port 5000
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

### 2. Backend Service (Node.js)
```bash
cd backend
# Install dependencies
npm install
# Run service
npm run dev
```

### 3. Frontend Service (React)
```bash
cd frontend
# Install dependencies
npm install
# Run service
npm run dev
```

## How it Works
1. Frontend sends deviation title and description to Node.js backend.
2. Node.js backend calls the Python ML service.
3. Python ML service uses TF-IDF vectorization and Cosine Similarity to compare the input with historical deviations.
4. probable root causes and similar deviations are returned to the frontend.
