# Local Deployment Guide: Universal ML Service

This guide explains how to deploy the AI Similarity Engine (FastAPI + Qdrant) as a production-grade service on your local Windows server.

## 📋 Prerequisites
- **Python 3.8 or higher** installed on the server.
- **Git** (optional, for cloning).
- **Network**: Ensure port `8001` is open on the server’s firewall if other machines need to access the AI.

---

## 🚀 1. Environment Setup

1.  **Navigate to the ML Service directory**:
    ```powershell
    cd path/to/dvms_recommendation/ml-service
    ```

2.  **Create a virtual environment**:
    ```powershell
    python -m venv .venv
    ```

3.  **Activate the environment**:
    ```powershell
    .venv\Scripts\activate
    ```

4.  **Install dependencies**:
    ```powershell
    pip install -r requirements.txt
    ```

---

## ⚙️ 2. Configuration

### Storage Persistence
The database (Qdrant) is file-based and is stored in:
`app/domains/DVMS/qdrant_storage/`

> [!IMPORTANT]
> **Backup Tip**: Periodically back up the `qdrant_storage` folder. If you move the service to a new server, simply copy this folder to maintain all your existing vectors.

---

## 🏃 3. Running the Service

### Development Mode (With Auto-Reload)
Use this only for testing changes:
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Production Mode (High Performance)
Use this for the final deployment. It is much faster and uses fewer resources:
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

---

## ✅ 4. Deployment Verification

Once the service is running, perform these checks from a browser or via `curl`:

1.  **Check Service Health**:
    -   **URL**: `http://localhost:8001/health`
    -   **Expected**: `{"status": "Universal ML Service is online"}`

2.  **Check Database Status**:
    -   **URL**: `http://localhost:8001/api/DVMS/qdrant-status`
    -   **Expected**: `{"status": "connected to local qdrant", ...}`

3.  **Interactive API Docs**:
    You can test every endpoint visually by visiting:
    `http://localhost:8001/docs`

---

## 🛡️ 5. Running as a Windows Service (Optional)

To ensure the ML service starts automatically when the server reboots, it is recommended to use **NSSM (Non-Sucking Service Manager)**:

1.  Download NSSM.
2.  Run `nssm install ML_Service`.
3.  Set the **Path** to: `path\to\.venv\Scripts\python.exe`
4.  Set the **Arguments** to: `-m uvicorn app.main:app --host 0.0.0.0 --port 8001`
5.  Start the service.

---

## 🔍 Troubleshooting
- **Port Conflict**: If port `8001` is already in use, find the process with `netstat -ano | findstr :8001` and kill it, or change the port in the startup command.
- **Missing Dependencies**: If you see `ModuleNotFoundError`, ensure you have activated the `.venv` before running `pip install`.
