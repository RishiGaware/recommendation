from app.db.qdrant import get_qdrant_client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION
from app.core.model_manager import get_shared_model

model = get_shared_model()

def analyze_text(data):
    """
    Computes match score using dynamic weights based on BOTH description and rootCauses.
    Uses the lazy-loaded Qdrant client.
    """
    client = get_qdrant_client()
    try:
        # Check if collections exist / are populated by requesting count
        description_count = client.count(DVMS_DESC_COLLECTION).count
        if description_count == 0:
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

    k = min(10, description_count)

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

    def calculate_dynamic_weights(desc_text, root_text):
        if desc_text and root_text:
            desc_words = len(desc_text.split())
            root_words = len(root_text.split())
            total_words = desc_words + root_words
            
            if total_words == 0:
                return 0.5, 0.5
            
            # Initial weights based on relative length
            d_weight = (desc_words / total_words) * 1.2
            r_weight = (root_words / total_words) * 0.8
            
            # Normalize to 1.0
            norm_total = d_weight + r_weight
            return d_weight / norm_total, r_weight / norm_total
        elif desc_text:
            return 1.0, 0.0
        else:
            return 0.0, 1.0

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

        # --- Determine Dynamic Weights ---
        desc_weight, root_weight = calculate_dynamic_weights(description, root_causes)

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

            # --- Behavior: prioritize meaningful matches over strict weighting ---
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
            "threshold": threshold * 100,
            "description_weight": round(desc_weight, 3),
            "root_weight": round(root_weight, 3)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Internal Analysis Error: {str(e)}"}
