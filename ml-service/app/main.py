import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from ml-service/.env (if present)
load_dotenv()

# Explicit imports for routing
from app.domains.common.router import router as common_router
from app.domains.dvms.api.router import router as dvms_router
from app.domains.oos.api.router import router as oos_router
from app.core.response_handler import standard_response

app = FastAPI(title="Universal ML Service Core")

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. Change in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Explicit Router Registration ---
# Mounting Common Domain
app.include_router(
    common_router,
    prefix="/ml-service/common",
    tags=["common"],
)

# Mounting DVMS Domain
app.include_router(
    dvms_router, 
    prefix="/ml-service/dvms", 
    tags=["dvms"]
)

# Mounting OOS Domain (Phased)
app.include_router(
    oos_router, 
    prefix="/ml-service/oos", 
    tags=["oos"]
)

# --- Global Endpoints ---
@app.get("/health")
def health_check():
    return standard_response(
        status="success",
        message="Universal ML Service is online"
    )

@app.get("/")
def root():
    return standard_response(
        status="success",
        message="DVMS Recommendation System ML-Service API",
        data={"version": "1.0.0"}
    )
