from app.db.qdrant import client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION
from app.core.model_manager import get_shared_model

model = get_shared_model()

def analyze_text(data):
    """
    Always computes match score based on BOTH description and rootCauses using Qdrant:
      - Searches dvms_desc  (weight: 70%)
      - Searches dvms_root  (weight: 30%)
      - Final matchScore (%) = combined weighted cosine similarity × 100
    """
    try:
        # Check if collections exist / are populated by requesting count
        desc_count = client.count(DVMS_DESC_COLLECTION).count
        if desc_count == 0:
            return {"error": "Model not trained or qdrant storage is empty. Please run training script."}
    except Exception as e:
        return {"error": f"Error connecting to Qdrant: {str(e)}"}

    description = ""
    root_causes = ""

    if isinstance(data, dict):
        description = str(data.get("description", "") or "").strip()
        root_causes = str(data.get("rootCauses", "") or "").strip()
    else:
        description = str(data).strip()

    if not description and not root_causes:
        return {"error": "Provide at least a description or rootCauses for analysis."}

    k = min(10, desc_count)

    def search_qdrant(collection, text, limit=10):
        # Generate vector for the text
        vec = model.encode([text])[0].tolist()
        
        # Determine the correct search method available on the client
        # In current qdrant-client sync mode, it should be '.search'
        if hasattr(client, "search"):
            return client.search(
                collection_name=collection,
                query_vector=vec,
                limit=limit,
                with_payload=True
            )
        elif hasattr(client, "query_points"):
            # New v1.11+ API if search is unavailable
            return client.query_points(
                collection_name=collection,
                query=vec,
                limit=limit,
                with_payload=True
            ).points
        else:
            raise AttributeError(f"QdrantClient object has neither 'search' nor 'query_points'. Available methods: {dir(client)}")

    try:
        # --- Search description collection ---
        desc_scores = {}
        if description:
            results = search_qdrant(DVMS_DESC_COLLECTION, description, limit=k)
            for r in results:
                desc_scores[r.id] = {"score": r.score, "payload": r.payload}

        # --- Search rootCauses collection ---
        root_scores = {}
        if root_causes:
            results = search_qdrant(DVMS_ROOT_COLLECTION, root_causes, limit=k)
            for r in results:
                root_scores[r.id] = {"score": r.score, "payload": r.payload}

        # --- Determine weights ---
        if description and root_causes:
            desc_weight = 0.7
            root_weight = 0.3
        elif description:
            desc_weight = 1.0
            root_weight = 0.0
        else:
            desc_weight = 0.0
            root_weight = 1.0

        # --- Combine scores across all candidate results ---
        all_indices = set(desc_scores.keys()) | set(root_scores.keys())

        results = []
        for point_id in all_indices:
            d_data = desc_scores.get(point_id, {})
            r_data = root_scores.get(point_id, {})
            
            d_score = d_data.get("score", 0.0)
            r_score = r_data.get("score", 0.0)

            # Combined weighted score
            combined = (d_score * desc_weight) + (r_score * root_weight)

            # Threshold for meaningful results
            if combined > 0.1:
                # Merge payload data (should be identical since they use the same IDs)
                payload = d_data.get("payload") or r_data.get("payload")
                
                if payload:
                    results.append({
                        "id": payload.get("id"),
                        "deviation_no": payload.get("deviation_no", ""),
                        "description": payload.get("description", ""),
                        "rootCauses": payload.get("rootCauses", ""),
                        "deviationType": payload.get("deviationType") or payload.get("deviation_type", ""),
                        "deviationClassification": payload.get("deviationClassification") or payload.get("severity", ""),
                        "matchScore": round(float(combined) * 100, 1),
                    })

        # Sort by best match score
        results = sorted(results, key=lambda x: x["matchScore"], reverse=True)

        return {
            "similarDeviations": results,
            "totalMatched": len(results),
            "searchMode": "description+rootCauses" if description and root_causes else ("description" if description else "rootCauses")
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Internal Analysis Error: {str(e)}"}
