# ML Service API Reference

This document provides a comprehensive guide to the API endpoints available in the **Universal ML Service**. All responses follow a standardized JSON format: `{ "status": "...", "message": "...", "data": { ... } }`.

## Base URL
Default: `http://127.0.0.1:8001` (or as configured in your environment).

---

## 1. Domain: DVMS (Deviation Management System)

### 1.1 Similarity Analysis
Performs semantic search against indexed deviations using description and root causes.

- **Endpoint**: `POST /api/DVMS/analyze`
- **Description**: Compares input text against two vector collections (description and root causes) and returns a weighted similarity score.

**Sample Request Payload**:
```json
{
  "description": "Temperature in the cold storage area exceeded 8°C for 2 hours.",
  "rootCauses": "Sensor malfunction due to icing on the probe."
}
```

**Sample Response**:
```json
{
  "status": "success",
  "message": "Analysis completed successfully",
  "data": {
    "similarDeviations": [
      {
        "id": 105,
        "matchScore": 92.4,
        "descriptionMatch": 89.1,
        "rootCauseMatch": 95.7
      }
    ],
    "searchMode": "both",
    "threshold": 35.0,
    "description_weight": 1.2,
    "root_weight": 0.8
  }
}
```
*Note: searchMode can be "both", "description_only", or "root_causes_only".*

---

### 1.2 Add Knowledge (Indexing)
Adds new deviation records to the vector search index.

- **Endpoint**: `POST /api/DVMS/add-knowledge`
- **Status Code**: Returns `201 Created` if new items are added, `200 OK` if all items already exist.
- **Description**: Accepts a single object or a batch list. It automatically deduplicates by ID.

**Sample Request Payload (Batch)**:
```json
[
  {
    "id": 301,
    "description": "Pressure drop in line A-12.",
    "rootCauses": "Gasket failure in valve V-101."
  },
  {
    "id": 302,
    "description": "Power fluctuation in data center.",
    "rootCauses": "UPS battery failure."
  }
]
```

**Sample Response**:
```json
{
  "status": "success",
  "message": "Processed 2 items. Indexed: 2, Skipped: 0.",
  "data": {
    "indexed": 2,
    "skipped": 0,
    "total_vectors": 156
  }
}
```

---

### 1.3 Clear Knowledge
Wipes the vector index for a clean slate.

- **Endpoint**: `POST /api/DVMS/clear-knowledge`

**Sample Response**:
```json
{
  "status": "success",
  "message": "AI Knowledge has been successfully cleared.",
  "data": {
    "stored_vectors": 0
  }
}
```

---

### 1.4 Database Setup
Directly initializes or re-creates the Qdrant collections.

- **Endpoint**: `POST /api/DVMS/setup-db`
- **Description**: Ensures the required collections (`dvms_description`, `dvms_root_causes`) exist with the correct dimensions (384 for All-MiniLM-L6-v2).

**Sample Response**:
```json
{
  "status": "success",
  "message": "Qdrant collections correctly initialized for the app."
}
```

---

### 1.5 System Status
Check the connectivity and statistics of the vector database.

- **Endpoint**: `GET /api/DVMS/qdrant-status`

**Sample Response**:
```json
{
  "status": "success",
  "message": "Connected to local qdrant",
  "data": {
    "stored_vectors": {
      "dvms_desc": 156,
      "dvms_root": 156
    },
    "sample_data": {
      "id": 105,
      "description": "Sample description text regarding temperature drift.",
      "rootCauses": "Sensor calibration was overdue."
    }
  }
}
```

---

## 2. Global Services

### 2.1 Health Check
Verify if the FastAPI service is online and responsive.

- **Endpoint**: `GET /health`

**Sample Response**:
```json
{
  "status": "success",
  "message": "Universal ML Service is online"
}
```

---

## Error Handling Guide
When an error occurs, the API returns a relevant HTTP status code and a descriptive JSON body.

**Example Error Response (400 Bad Request)**:
```json
{
  "status": "error",
  "message": "Please provide a description or root causes to analyze."
}
```

**Example Error Response (500 Internal Server Error)**:
```json
{
  "status": "error",
  "message": "Similarity Analysis failed: [Internal Error Details]"
}
```
