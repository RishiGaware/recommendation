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
        description_scores = {}
        if description:
            results = search_qdrant(DVMS_DESC_COLLECTION, description, limit=k)
            for r in results:
                description_scores[r.id] = {"score": r.score, "payload": r.payload}

        # --- Search rootCauses collection ---
        root_cause_scores = {}
        if root_causes:
            results = search_qdrant(DVMS_ROOT_COLLECTION, root_causes, limit=k)
            for r in results:
                root_cause_scores[r.id] = {"score": r.score, "payload": r.payload}

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
        all_indices = set(description_scores.keys()) | set(root_cause_scores.keys())

        results = []
        for point_id in all_indices:
            description_data = description_scores.get(point_id, {})
            root_cause_data = root_cause_scores.get(point_id, {})
            
            description_score = description_data.get("score", 0.0)
            root_cause_score = root_cause_data.get("score", 0.0)

            # Combined weighted score (still used for sorting priority)
            combined = (description_score * desc_weight) + (root_cause_score * root_weight)

            # --- NEW Logic: Include if EITHER field is a strong match (>35%) ---
            threshold = 0.35
            if description_score >= threshold or root_cause_score >= threshold or combined >= threshold:
                payload = description_data.get("payload") or root_cause_data.get("payload")
                
                if payload:
                    results.append({
                        "id": payload.get("id"),
                        "deviation_no": payload.get("deviation_no", ""),
                        "description": payload.get("description", ""),
                        "rootCauses": payload.get("rootCauses", ""),
                        "deviationType": payload.get("deviationType") or payload.get("deviation_type", ""),
                        "deviationClassification": payload.get("deviationClassification") or payload.get("severity", ""),
                        # Percentages
                        "matchScore": round(float(combined) * 100, 1),
                        "descriptionMatch": round(float(description_score) * 100, 1),
                        "rootCauseMatch": round(float(root_cause_score) * 100, 1)
                    })

        # Sort by best overall match score
        results = sorted(results, key=lambda x: x["matchScore"], reverse=True)

        return {
            "similarDeviations": results,
            "totalMatched": len(results),
            "searchMode": "description+rootCauses" if description and root_causes else ("description" if description else "rootCauses"),
            "threshold": threshold * 100
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Internal Analysis Error: {str(e)}"}
