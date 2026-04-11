# ML Service API Reference

This document provides a comprehensive guide to the API endpoints available in the **Universal ML Service Core**. All responses follow a standardized JSON format: `{ "status": "...", "message": "...", "data": { ... } }`.

## Base URL
Default: `http://localhost:8000` (or as configured in your environment).

---

## 1. Domain: DVMS (Deviation Management System)

### 1.1 Similarity Analysis
Performs semantic search against indexed deviations using description and root causes.

- **Endpoint**: `POST /ml-service/dvms/analyze`
- **Description**: Compares input text against two vector collections (description and root causes) and returns a weighted similarity score.

**Sample Request Payload**:
```json
{
  "description": "Temperature in the cold storage area exceeded 8°C for 2 hours.",
  "rootCauses": "Sensor malfunction due to icing on the probe.",
  "threshold": 35.0,
  "limit": 5
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

- **Endpoint**: `POST /ml-service/dvms/add-knowledge`
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

- **Endpoint**: `POST /ml-service/dvms/clear-knowledge`

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

- **Endpoint**: `POST /ml-service/dvms/setup-db`
- **Description**: Ensures the required collections existence with the correct dimensions (384 for All-MiniLM-L6-v2).

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

### 1.5 System Status
Check the connectivity and statistics of the vector database.

- **Endpoint**: `GET /ml-service/dvms/qdrant-status`

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
      "description": "Sample description text mengenai temperature drift.",
      "rootCauses": "Sensor calibration was overdue."
    }
  }
}
```

---

## 2. Domain: AI Enhancement

### 2.1 Content Refinement
Uses LLM logic to transform notes into professional GMP-compliant documentation.

- **Endpoint**: `POST /ml-service/ai_enhancement/dvms/ai/refine`
- **Description**: Refines specific QMS fields (description, investigationFindings, impact) using few-shot prompting.

**Sample Request Payload**:
```json
{
  "fieldType": "description",
  "userInput": "freezer was open for 30 mins",
  "userPrompt": "make it professional and 10 words"
}
```

**Sample Response**:
```json
{
  "success": true,
  "generatedText": "Freezer door left unsecured for 30 minutes, requiring impact assessment."
}
```

---

## 3. Global Services

### 3.1 Text Extraction
Extracts plain text from raw HTML/XML content (optimized for Word exports).

- **Endpoint**: `POST /ml-service/common/extract-text`

**Sample Request Payload**:
```json
{
  "content": "<p>Example <b>HTML</b> content.</p>"
}
```

**Sample Response**:
```json
{
  "status": "success",
  "message": "Text extracted successfully using robust ordering",
  "data": {
    "text": "Example HTML content.",
    "original_length": 34,
    "extracted_length": 21
  }
}
```

---

### 3.2 Health Check
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
