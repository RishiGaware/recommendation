# ML Service Integration Guide (API Contract)

This guide details the exact API calls required to connect your backend with the AI Similarity Engine. 

## ⚖️ Standard Response Format
All endpoints return a consistent JSON schema and use standard HTTP status codes.

### Success Response
- **HTTP 200/201**
```json
{
  "status": "success",
  "message": "Human-readable summary",
  "data": { ... payload (optional) ... }
}
```

### Error Response
- **HTTP 400/500**
```json
{
  "status": "error",
  "message": "Specific error description (e.g., 'Model not trained')",
}
```

---

## 🏥 Health & Monitoring

### 1. Global Service Health
- **URL**: `http://localhost:8001/health`
- **Method**: `GET`
- **Success Code**: `200 OK`
- **Response**:
```json
{
  "status": "success",
  "message": "Universal ML Service is online"
}
```

### 2. Qdrant Connection Status
- **URL**: `http://localhost:8001/api/DVMS/qdrant-status`
- **Method**: `GET`
- **Success Code**: `200 OK`
- **Response**:
```json
{
  "status": "success",
  "message": "Connected to local qdrant", 
  "data": {
    "stored_vectors": {"dvms_desc": 552, "dvms_root": 552},
    "sample_data": { "id": 1, "description": "...", "rootCauses": "..." }
  }
}
```

---

## 1. Knowledge Clear (Clean Slate)
Use this to wipe the entire AI vector index. **Warning**: This permanently deletes all mathematical knowledge in the engine. It does **NOT** take a payload; it is a dedicated reset command.

- **URL**: `http://localhost:8001/api/DVMS/clear-knowledge`
- **Method**: `POST`
- **Success Code**: `200 OK`
- **Request Payload**: `None (Empty Body)`
- **Response**:
```json
{ 
  "status": "success", 
  "message": "AI Collections have been successfully reset and cleared.",
  "data": { "stored_vectors": 0 }
}
```

---

## 2. Add Knowledge (Polymorphic Indexing)
A unified, high-performance endpoint to index new or historical data. 
- **Does NOT** wipe the index.
- **Automatically Skips** records that already exist by ID.
- **Full Control**: Processes the entire payload provided by the backend in a single pass.

- **URL**: `http://localhost:8001/api/DVMS/add-knowledge`
- **Method**: `POST`
- **Success Code**: `200 OK` / `201 Created`

### Payload Option A: Single Object (Manual Entry)
```json
{ "id": 101, "description": "...", "rootCauses": "..." }
```

### Payload Option B: Array (Bulk/History Sync)
```json
[
  { "id": 501, "description": "...", "rootCauses": "..." },
  { "id": 502, "description": "...", "rootCauses": "..." }
]
```

### Response
```json
{ 
  "status": "success", 
  "message": "Processed 2 items. Indexed: 1, Skipped: 1.",
  "data": { 
    "indexed": 1, 
    "skipped": 1,
    "total_vectors": 553 
  }
}
```

---

## 3. Dynamic Analysis (Thin Search)
The core search endpoint. Returns only **IDs and Match Scores** for high performance. The backend then "hydrates" these results with full SQL data.

- **URL**: `http://localhost:8001/api/DVMS/analyze`
- **Method**: `POST`
- **Success Code**: `200 OK`
- **Request Payload**: `{ "description": "...", "rootCauses": "..." }`
- **Response**:
```json
{
  "status": "success",
  "message": "Analysis completed successfully",
  "data": {
    "similarDeviations": [
      { "id": 101, "matchScore": 85.5, "descriptionMatch": 80, "rootCauseMatch": 90 }
    ],
    "searchMode": "description+rootCauses",
    "threshold": 35.0
  }
}
```

---

## 🧠 Intelligence Scoring Weights
The AI weighs field importance dynamically using the Universal Domain logic:
- **Description**: 1.2x Importance Bias (Primary Context)
- **Root Cause**: 0.8x Importance Bias (Precision Constraint)
- **Match Threshold**: 35% (Minimum similarity required for inclusion)

---

## 💧 Hydration: Merging with SQL Data
Since the AI returns "Thin Results," the Backend must perform **Hydration** to provide a full UI experience.

### Logic Blueprint (Node.js/SQL)
```javascript
// 1. Fetch AI Match IDs
const aiResponse = await mlService.analyze(payload);
const matchIds = aiResponse.data.similarDeviations.map(d => d.id);

// 2. Fetch Full Records from Production DB (SSMS)
const sqlRecords = await db.query('SELECT * FROM Deviations WHERE Id IN (?)', [matchIds]);

// 3. Reconstitute Enriched Objects for UI
const finalResults = sqlRecords.map(sqlDev => {
  const matchInfo = aiResponse.data.similarDeviations.find(m => m.id == sqlDev.Id);
  return { 
    ...sqlDev, 
    matchScore: matchInfo.matchScore 
  };
});
```
