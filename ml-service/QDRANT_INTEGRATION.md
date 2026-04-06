# Qdrant Integration Guide — DVMS Recommendation System

## Overview

This guide explains how to replace the current **FAISS + pickle** setup with **Qdrant**
as the vector store. The goal is to keep the ML service architecture identical — only
the storage layer changes.

```
Current:  description → SentenceTransformer → FAISS (.index + .pkl files)
Target:   description → SentenceTransformer → Qdrant (local HTTP API)
```

---

## Prerequisites

### 1. Run Qdrant Locally (Docker)

```bash
docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
```

Verify it's running: http://localhost:6333

### 2. Install Python Client

```bash
pip install qdrant-client
```

---

## File Structure to Create

```
ml-service/
  app/
    db/
      __init__.py
      qdrant_client.py      ← shared client singleton
      setup_qdrant.py       ← run once to create collection
    domains/
      DVMS/
        model/
          train.py          ← replace FAISS write with Qdrant upsert
          analyze.py        ← replace FAISS search with Qdrant search
          add_knowledge.py  ← replace FAISS add with Qdrant upsert
          vector_store.py   ← can be deleted (Qdrant manages state)
```

---

## Step 1 — Shared Client (`app/db/qdrant_client.py`)

```python
from qdrant_client import QdrantClient

client = QdrantClient("http://localhost:6333")

# One collection per domain
DVMS_COLLECTION = "dvms_deviations"
```

---

## Step 2 — Create Collections (`app/db/setup_qdrant.py`)

> Run this **once** before starting the server.

```python
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance

client = QdrantClient("http://localhost:6333")

# Two collections: one for description, one for rootCauses
for name in ["dvms_desc", "dvms_root"]:
    client.recreate_collection(
        collection_name=name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )
    print(f"Collection '{name}' created.")
```

```bash
python app/db/setup_qdrant.py
```

---

## Step 3 — Training (`train.py` replacement)

Replace the FAISS index-building block with this:

```python
from qdrant_client.models import PointStruct
from app.db.qdrant_client import client

def train_model():
    # ... load all_deviations from deviations.json (same as current) ...

    desc_points = []
    root_points = []

    for idx, dev in enumerate(all_deviations):
        desc_text = dev.get("description", "")
        root_text = dev.get("rootCauses", "") or desc_text

        desc_vec = model.encode([desc_text])[0].tolist()
        root_vec = model.encode([root_text])[0].tolist()

        desc_points.append(PointStruct(id=idx, vector=desc_vec, payload=dev))
        root_points.append(PointStruct(id=idx, vector=root_vec, payload=dev))

    client.upsert(collection_name="dvms_desc", points=desc_points)
    client.upsert(collection_name="dvms_root", points=root_points)

    return {"message": f"Indexed {len(all_deviations)} deviations into Qdrant."}
```

**What was removed:**
- `faiss.write_index(...)` → replaced by `client.upsert(...)`
- `pickle.dump(...)` → Qdrant stores the full payload internally
- `reload_index()` → not needed, Qdrant is always live

---

## Step 4 — Add Knowledge (`add_knowledge.py` replacement)

```python
from qdrant_client.models import PointStruct
from app.db.qdrant_client import client

def add_to_index(data: dict):
    # Use timestamp as unique ID (same as backend)
    point_id = data.get("id") or int(time.time() * 1000)

    desc_text = data.get("description", "")
    root_text  = data.get("rootCauses", "") or desc_text

    desc_vec = model.encode([desc_text])[0].tolist()
    root_vec = model.encode([root_text])[0].tolist()

    client.upsert("dvms_desc", [PointStruct(id=point_id, vector=desc_vec, payload=data)])
    client.upsert("dvms_root", [PointStruct(id=point_id, vector=root_vec, payload=data)])

    return {
        "status": "success",
        "message": f"Deviation '{data.get('deviation_no')}' added to Qdrant.",
        "id": point_id
    }
```

**What was removed:**
- `store.index.add(vec)` → replaced by `client.upsert(...)`
- `store.deviations.append(data)` → Qdrant stores payload internally
- `faiss.write_index(...)` + `pickle.dump(...)` → automatic in Qdrant

---

## Step 5 — Analyze (`analyze.py` replacement)

```python
from app.db.qdrant_client import client

def analyze_text(data: dict):
    description = str(data.get("description", "") or "").strip()
    root_causes = str(data.get("rootCauses", "") or "").strip()

    if not description and not root_causes:
        return {"error": "Provide at least description or rootCauses."}

    def search(collection, text, limit=10):
        vec = model.encode([text])[0].tolist()
        return client.search(collection_name=collection, query_vector=vec, limit=limit, with_payload=True)

    # Determine weights
    if description and root_causes:
        desc_w, root_w = 0.7, 0.3
    elif description:
        desc_w, root_w = 1.0, 0.0
    else:
        desc_w, root_w = 0.0, 1.0

    # Collect scores per point ID
    scores = {}
    if description:
        for r in search("dvms_desc", description):
            scores[r.id] = {"desc": r.score, "payload": r.payload}
    if root_causes:
        for r in search("dvms_root", root_causes):
            if r.id not in scores:
                scores[r.id] = {"desc": 0.0, "payload": r.payload}
            scores[r.id]["root"] = r.score

    results = []
    for pid, s in scores.items():
        combined = (s.get("desc", 0.0) * desc_w) + (s.get("root", 0.0) * root_w)
        if combined > 0.1:
            dev = s["payload"]
            results.append({
                **dev,
                "matchScore": round(combined * 100, 1)
            })

    return {
        "similarDeviations": sorted(results, key=lambda x: x["matchScore"], reverse=True),
        "totalMatched": len(results)
    }
```

---

## Bonus — Filter by Classification (Zero FAISS equivalent)

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

results = client.search(
    collection_name="dvms_desc",
    query_vector=vec,
    query_filter=Filter(
        must=[
            FieldCondition(key="deviationClassification", match=MatchValue(value="Critical"))
        ]
    ),
    limit=10,
    with_payload=True
)
```

This is **impossible** with FAISS — Qdrant makes filtered vector search trivial.

---

## FAISS vs Qdrant — Mapping Table

| Current (FAISS) | Replacement (Qdrant) |
|:---|:---|
| `faiss.write_index(index, path)` | `client.upsert(collection, points)` |
| `faiss.read_index(path)` | Automatic — Qdrant persists to disk |
| `pickle.dump(deviations, f)` | Payload stored inside each point |
| `store.index.search(vec, k)` | `client.search(collection, vec, limit=k)` |
| `reload_index()` | Not needed |
| `vector_store.py` globals | Not needed |
| Manual ID mapping | `r.id` + `r.payload` returned together |

---

## What You Can Delete After Migration

```
ml-service/app/domains/DVMS/
  ml-data/
    desc.index     ← delete
    root.index     ← delete
    embeddings.pkl ← delete
  model/
    vector_store.py ← delete
```

---

## Notes

- **Qdrant persists data** to `qdrant_storage/` on the Docker host — data survives restarts.
- **No retraining on server start** — once indexed, Qdrant is always ready.
- **Point IDs must be integers or UUIDs** — use `dev["id"]` (already `int` in your JSON).
- Collection `size=384` matches `all-MiniLM-L6-v2` embedding dimensions.
