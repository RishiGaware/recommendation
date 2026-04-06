# Qdrant Integration Guide — DVMS Recommendation System

## Overview

Replace the current **FAISS + pickle** setup with **Qdrant** as the vector store.
The ML service architecture stays identical — only the storage layer changes.

```
Current:  deviation → SentenceTransformer → FAISS (.index + .pkl files)
Target:   deviation → SentenceTransformer → Qdrant (local HTTP API, Docker)
```

---

## Prerequisites

### 1. Run Qdrant Locally (Docker)

```bash
docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
```

Verify: open **http://localhost:6333** in your browser.

### 2. Install Python Client

```bash
pip install qdrant-client
```

---

## New File Structure

```
ml-service/
  app/
    db/
      __init__.py            ← empty file
      qdrant_client.py       ← shared client singleton
      setup_qdrant.py        ← run once to create collections
    domains/
      DVMS/
        model/
          train.py           ← replace FAISS write → Qdrant upsert
          analyze.py         ← replace FAISS search → Qdrant search
          add_knowledge.py   ← replace FAISS add → Qdrant upsert
          vector_store.py    ← DELETE (Qdrant manages state)
```

---

## Step 1 — Shared Client

**`app/db/qdrant_client.py`**

```python
from qdrant_client import QdrantClient

client = QdrantClient("http://localhost:6333")

# Two collections: one per index dimension
DVMS_DESC_COLLECTION = "dvms_desc"    # indexed by description
DVMS_ROOT_COLLECTION  = "dvms_root"   # indexed by rootCauses
```

---

## Step 2 — Create Collections (run once)

**`app/db/setup_qdrant.py`**

```python
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance

client = QdrantClient("http://localhost:6333")

# 384 = dimension of all-MiniLM-L6-v2 embeddings
for name in ["dvms_desc", "dvms_root"]:
    client.recreate_collection(
        collection_name=name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )
    print(f"Collection '{name}' created.")
```

```bash
# Run once before starting the server
python app/db/setup_qdrant.py
```

---

## Step 3 — Training (`train.py`)

Replace the FAISS write block with Qdrant upsert:

```python
from qdrant_client.models import PointStruct
from app.db.qdrant_client import client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION

def train_model():
    # Load all_deviations from deviations.json  (same as current)
    all_deviations = [...]

    desc_points = []
    root_points = []

    for idx, dev in enumerate(all_deviations):
        desc_text = dev.get("description", "")
        root_text = dev.get("rootCauses", "") or desc_text

        desc_vec = model.encode([desc_text])[0].tolist()
        root_vec = model.encode([root_text])[0].tolist()

        desc_points.append(PointStruct(id=idx, vector=desc_vec, payload=dev))
        root_points.append(PointStruct(id=idx, vector=root_vec, payload=dev))

    client.upsert(collection_name=DVMS_DESC_COLLECTION, points=desc_points)
    client.upsert(collection_name=DVMS_ROOT_COLLECTION, points=root_points)

    return {"message": f"Indexed {len(all_deviations)} deviations into Qdrant."}
```

**What disappears:**
| Removed | Replaced by |
|:---|:---|
| `faiss.write_index(index, path)` | `client.upsert(collection, points)` |
| `pickle.dump(deviations, f)` | Payload stored inside each Qdrant point |
| `reload_index()` | Not needed — Qdrant is always live |

---

## Step 4 — Add Knowledge (`add_knowledge.py`)

```python
import time
from qdrant_client.models import PointStruct
from app.db.qdrant_client import client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION

def add_to_index(data: dict):
    point_id = int(data.get("id") or time.time() * 1000)

    desc_text = data.get("description", "")
    root_text  = data.get("rootCauses", "") or desc_text

    desc_vec = model.encode([desc_text])[0].tolist()
    root_vec = model.encode([root_text])[0].tolist()

    client.upsert(DVMS_DESC_COLLECTION, [PointStruct(id=point_id, vector=desc_vec, payload=data)])
    client.upsert(DVMS_ROOT_COLLECTION, [PointStruct(id=point_id, vector=root_vec, payload=data)])

    return {
        "status": "success",
        "message": f"Deviation '{data.get('deviation_no')}' added to Qdrant.",
        "total_vectors": point_id
    }
```

---

## Step 5 — Analyze (`analyze.py`)

```python
from app.db.qdrant_client import client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION

def analyze_text(data: dict):
    description = str(data.get("description", "") or "").strip()
    root_causes  = str(data.get("rootCauses", "") or "").strip()

    if not description and not root_causes:
        return {"error": "Provide at least description or rootCauses."}

    # Weighting
    if description and root_causes:
        desc_w, root_w = 0.7, 0.3
    elif description:
        desc_w, root_w = 1.0, 0.0
    else:
        desc_w, root_w = 0.0, 1.0

    def search(collection, text, limit=10):
        vec = model.encode([text])[0].tolist()
        return client.search(collection_name=collection, query_vector=vec,
                             limit=limit, with_payload=True)

    # Collect scores per point ID
    scores = {}
    if description:
        for r in search(DVMS_DESC_COLLECTION, description):
            scores[r.id] = {"desc": r.score, "payload": r.payload}
    if root_causes:
        for r in search(DVMS_ROOT_COLLECTION, root_causes):
            if r.id not in scores:
                scores[r.id] = {"desc": 0.0, "payload": r.payload}
            scores[r.id]["root"] = r.score

    results = []
    for pid, s in scores.items():
        combined = (s.get("desc", 0.0) * desc_w) + (s.get("root", 0.0) * root_w)
        if combined > 0.1:
            results.append({
                **s["payload"],
                "matchScore": round(combined * 100, 1)
            })

    return {
        "similarDeviations": sorted(results, key=lambda x: x["matchScore"], reverse=True),
        "totalMatched": len(results)
    }
```

---

## Bonus — Filter by Classification

This is **impossible with FAISS** — free with Qdrant:

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

results = client.search(
    collection_name=DVMS_DESC_COLLECTION,
    query_vector=vec,
    query_filter=Filter(
        must=[
            FieldCondition(
                key="deviationClassification",
                match=MatchValue(value="Critical")
            )
        ]
    ),
    limit=10,
    with_payload=True
)
```

---

## FAISS → Qdrant Mapping

| Current (FAISS) | Replacement (Qdrant) |
|:---|:---|
| `faiss.write_index(index, path)` | `client.upsert(collection, points)` |
| `faiss.read_index(path)` | Automatic — Qdrant persists to disk |
| `pickle.dump(deviations, f)` | Payload stored inside each point |
| `store.index.search(vec, k)` | `client.search(collection, vec, limit=k)` |
| `reload_index()` | Not needed |
| `vector_store.py` module globals | Not needed |
| Manual ID → metadata mapping | `r.id` + `r.payload` returned together |

---

## Files to Delete After Migration

```
ml-service/app/domains/DVMS/
  ml-data/
    desc.index      ← delete
    root.index      ← delete
    embeddings.pkl  ← delete
  model/
    vector_store.py ← delete
```

---

## Key Notes

- **Collection `size=384`** matches the `all-MiniLM-L6-v2` embedding dimensions.
- **Point IDs must be integers or UUIDs** — use `dev["id"]` (already `int` in your JSON).
- **Qdrant persists data** in `qdrant_storage/` on the Docker host — survives restarts.
- **No retraining on server start** — once indexed, Qdrant is always ready.
- **Cosine distance** in Qdrant = same as `IndexFlatIP` + `normalize_L2` in FAISS.
