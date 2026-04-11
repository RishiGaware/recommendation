import time
import traceback
from typing import Union, List, Dict, Optional
from qdrant_client.models import PointStruct, VectorParams, Distance

from app.db.qdrant import get_qdrant_client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION
from app.core.model_manager import get_shared_model
from app.core.response_handler import standard_response
from app.domains.common.service import robust_text_extraction

# Shared state between API calls
shared_model = get_shared_model()

def _ensure_dvms_collections(client) -> None:
    """
    Ensure DVMS collections exist for embedded Qdrant.
    This prevents first-run failures like 'Collection dvms_desc not found'.
    """
    try:
        client.get_collection(DVMS_DESC_COLLECTION)
        client.get_collection(DVMS_ROOT_COLLECTION)
        return
    except Exception:
        # Create (or recreate) with the expected vector size.
        for name in [DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION]:
            client.recreate_collection(
                collection_name=name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            )

def analyze_text(payload: dict):
    """
    Analyzes input text against TWO Qdrant collections:
      1. description (Primary Context)
      2. root_causes (Precision Constraint)
    
    Returns similarity scores for Backend Hydration.
    """
    qdrant_client = get_qdrant_client()
    _ensure_dvms_collections(qdrant_client)
    
    input_description = robust_text_extraction(str(payload.get("description", "") or ""))
    input_root_causes = robust_text_extraction(str(payload.get("rootCauses", "") or ""))
    match_threshold = float(payload.get("threshold", 10.0))

    if not input_description and not input_root_causes:
        return standard_response(
            status="error",
            message="Please provide a description or root causes to analyze.",
            status_code=400
        )

    # --- 1. Intelligent Weighting Logic ---
    if input_description and input_root_causes:
        mode = "both"
        description_weight = 1.2
        root_cause_weight = 0.8
    elif input_description:
        mode = "description_only"
        description_weight = 1.0
        root_cause_weight = 0.0
    else:
        mode = "root_causes_only"
        description_weight = 0.0
        root_cause_weight = 1.0

    try:
        # --- 2. Dual-Vector Search ---
        description_results = []
        if input_description:
            description_vector = shared_model.encode(input_description).tolist()
            description_results = qdrant_client.query_points(
                collection_name=DVMS_DESC_COLLECTION,
                query=description_vector,
                limit=15,
                with_payload=False
            ).points

        root_cause_results = []
        if input_root_causes:
            root_cause_vector = shared_model.encode(input_root_causes).tolist()
            root_cause_results = qdrant_client.query_points(
                collection_name=DVMS_ROOT_COLLECTION,
                query=root_cause_vector,
                limit=15,
                with_payload=False
            ).points

        # --- 3. Score Fusion (Thin Results) ---
        match_scores = {}

        # Process description findings
        for hit in description_results:
            match_scores[hit.id] = {
                "id": hit.id,
                "description_score": hit.score * 100,
                "root_cause_score": 0.0
            }

        # Merge root cause findings
        for hit in root_cause_results:
            if hit.id in match_scores:
                match_scores[hit.id]["root_cause_score"] = hit.score * 100
            else:
                match_scores[hit.id] = {
                    "id": hit.id,
                    "description_score": 0.0,
                    "root_cause_score": hit.score * 100
                }

        # --- 4. Final Result Calculation ---
        results_list = []
        for match_id, scores in match_scores.items():
            # Calculate weighted average
            final_match_score = (
                (scores["description_score"] * description_weight) + 
                (scores["root_cause_score"] * root_cause_weight)
            ) / (description_weight + root_cause_weight)

            if final_match_score >= match_threshold:
                results_list.append({
                    "id": match_id,
                    "matchScore": round(final_match_score, 1),
                    "descriptionMatch": round(scores["description_score"], 1),
                    "rootCauseMatch": round(scores["root_cause_score"], 1)
                })

        # Sort by best match score descending
        sorted_results = sorted(results_list, key=lambda x: x["matchScore"], reverse=True)

        return standard_response(
            status="success",
            message="Analysis completed successfully",
            data={
                "similarDeviations": sorted_results[:10],
                "searchMode": mode,
                "threshold": match_threshold,
                "description_weight": description_weight,
                "root_weight": root_cause_weight,
                "hydrated_from": "ML Vector Storage (Qdrant Payload)"
            }
        )

    except Exception as analysis_error:
        traceback.print_exc()
        return standard_response(
            status="error",
            message=f"Similarity Analysis failed: {str(analysis_error)}",
            status_code=500
        )

def add_to_index(data: Union[Dict, List[Dict]]):
    """
    Unified handler for single or bulk knowledge indexing.
    """
    qdrant_client = get_qdrant_client()
    _ensure_dvms_collections(qdrant_client)
    try:
        # 1. Standardize to list format
        deviations_list = data if isinstance(data, list) else [data]

        if not deviations_list:
            return standard_response(
                status="error",
                message="No deviations found to index.",
                status_code=400
            )

        total_input_count = len(deviations_list)
        
        # --- 2. Check existing IDs in Qdrant for deduplication ---
        target_ids = []
        for deviation in deviations_list:
            try:
                if "id" in deviation:
                    target_ids.append(int(deviation["id"]))
            except (ValueError, TypeError):
                pass

        existing_id_set = set()
        if target_ids:
            try:
                existing_points = qdrant_client.retrieve(
                    collection_name=DVMS_DESC_COLLECTION,
                    ids=target_ids,
                    with_payload=False,
                    with_vectors=False
                )
                existing_id_set = {point.id for point in existing_points}
            except Exception as e:
                print(f"Warning: Could not retrieve existing points: {e}")

        # --- 3. Filter for NEW items only ---
        new_deviations = []
        for deviation in deviations_list:
            try:
                deviation_id = int(deviation.get("id"))
                if deviation_id not in existing_id_set:
                    new_deviations.append(deviation)
            except Exception:
                continue
        
        total_skipped_count = total_input_count - len(new_deviations)
        
        if not new_deviations:
            current_vector_count = qdrant_client.count(DVMS_DESC_COLLECTION).count
            return standard_response(
                status="success",
                message=f"All {total_input_count} items already exist or were invalid.",
                data={"indexed": 0, "skipped": total_skipped_count, "total_vectors": current_vector_count}
            )

        # --- 4. Vectorization & Upsert ---
        CHUNK_SIZE = 50
        total_indexed_count = 0
        
        for i in range(0, len(new_deviations), CHUNK_SIZE):
            chunk = new_deviations[i : i + CHUNK_SIZE]
            
            # Clean each description and root cause using the robust service
            clean_chunk = []
            for d in chunk:
                # Store the cleaned versions directly in the payload to keep it simple
                d["description"] = robust_text_extraction(str(d.get("description", "") or ""))
                d["rootCauses"] = robust_text_extraction(str(d.get("rootCauses", "") or ""))
                clean_chunk.append(d)

            description_texts = [d["description"] for d in clean_chunk]
            root_cause_texts = [d["rootCauses"] for d in clean_chunk]
            
            description_vectors = shared_model.encode(description_texts).tolist()
            root_cause_vectors = shared_model.encode(root_cause_texts).tolist()

            description_points = []
            root_cause_points = []

            for deviation, desc_vector, rc_vector in zip(chunk, description_vectors, root_cause_vectors):
                current_point_id = int(deviation.get("id"))
                description_points.append(PointStruct(id=current_point_id, vector=desc_vector, payload=deviation))
                root_cause_points.append(PointStruct(id=current_point_id, vector=rc_vector, payload=deviation))

            qdrant_client.upsert(collection_name=DVMS_DESC_COLLECTION, points=description_points)
            qdrant_client.upsert(collection_name=DVMS_ROOT_COLLECTION, points=root_cause_points)
            total_indexed_count += len(chunk)

        current_vector_count = qdrant_client.count(DVMS_DESC_COLLECTION).count
        
        return standard_response(
            status="success",
            message=f"Processed {total_input_count} items. Indexed: {total_indexed_count}, Skipped: {total_skipped_count}.",
            data={
                "indexed": total_indexed_count,
                "skipped": total_skipped_count,
                "total_vectors": current_vector_count
            },
            status_code=201 if total_indexed_count > 0 else 200
        )

    except Exception as e:
        traceback.print_exc()
        return standard_response(
            status="error",
            message=f"Internal Indexing Pipeline Error: {str(e)}",
            status_code=500
        )

def clear_all_knowledge():
    """
    Clears all AI knowledge by dynamically discovering all Qdrant collections
    and recreating them. Ensures a truly clean slate.
    """
    qdrant_client = get_qdrant_client()
    try:
        # Discover all current collections
        collections = qdrant_client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        # If no collections found, ensure defaults are at least rooted
        if not collection_names:
            collection_names = [DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION]

        for name in collection_names:
            try:
                # On Windows, embedded Qdrant can have file lock issues with delete_collection
                # So we delete all points instead for a robust clear.
                from qdrant_client.models import Filter
                qdrant_client.delete(
                    collection_name=name,
                    points_selector=Filter(
                        must=[] # Empty filter matches everything
                    ),
                    wait=True
                )
                time.sleep(0.5) # Extra buffer for Windows FS
            except Exception as e:
                print(f"Warning: Failed to clear points in {name}: {e}")
        
        # Force a small refresh wait for embedded storage if needed (optional)
        # Verify counts after clearing
        final_counts = {}
        for name in collection_names:
            final_counts[name] = qdrant_client.count(name).count

        return standard_response(
            status="success",
            message=f"AI Knowledge cleared successfully across {len(collection_names)} collections.",
            data={"stored_vectors": final_counts}
        )
    except Exception as error:
        return standard_response(
            status="error",
            message=f"Failed to clear knowledge: {str(error)}",
            status_code=500
        )

def get_dvms_status():
    """
    Checks connection to Qdrant and returns comprehensive collection stats.
    """
    client = get_qdrant_client()
    try:
        _ensure_dvms_collections(client)
        
        # Dynamically discover all collections and their counts
        collections = client.get_collections().collections
        stats = {}
        for c in collections:
            stats[c.name] = client.count(c.name).count
        
        # Grab a sample from the primary description collection if available
        res = client.scroll(collection_name=DVMS_DESC_COLLECTION, limit=1, with_payload=True)
        sample = res[0][0].payload if res[0] else None
        
        return standard_response(
            status="success",
            message="Connected to local qdrant", 
            data={
                "stored_vectors": stats,
                "sample_data": sample
            }
        )
    except Exception as e:
        return standard_response(
            status="error", 
            message=f"Qdrant status check failed: {str(e)}",
            status_code=500
        )

def get_dvms_vectors_by_ids(payload: dict):
    """
    Fetch stored vectors for a set of deviation IDs from both DVMS collections.
    Payload:
      - ids: list[int]
      - includeVectors: bool (default True)
    """
    try:
        ids = payload.get("ids", [])
        include_vectors = payload.get("includeVectors", True)
        
        client = get_qdrant_client()
        _ensure_dvms_collections(client)

        norm_ids = []
        is_fetch_all = False

        if not isinstance(ids, list) or not ids:
            is_fetch_all = True
        else:
            # Normalize to ints
            for x in ids:
                try:
                    norm_ids.append(int(x))
                except Exception:
                    continue
            if not norm_ids:
                is_fetch_all = True

        desc_points = []
        root_points = []

        if is_fetch_all:
            # Fetch default batch (top 100)
            res = client.scroll(
                collection_name=DVMS_DESC_COLLECTION,
                limit=100,
                with_payload=True,
                with_vectors=bool(include_vectors),
            )
            desc_points = res[0]
            norm_ids = [int(p.id) for p in desc_points]
            
            # Fetch matching root cause vectors
            if norm_ids:
                root_points = client.retrieve(
                    collection_name=DVMS_ROOT_COLLECTION,
                    ids=norm_ids,
                    with_payload=False,
                    with_vectors=bool(include_vectors),
                )
        else:
            # specific IDs
            desc_points = client.retrieve(
                collection_name=DVMS_DESC_COLLECTION,
                ids=norm_ids,
                with_payload=True,
                with_vectors=bool(include_vectors),
            )
            root_points = client.retrieve(
                collection_name=DVMS_ROOT_COLLECTION,
                ids=norm_ids,
                with_payload=False,
                with_vectors=bool(include_vectors),
            )

        desc_map = {
            int(p.id): {
                "id": int(p.id),
                "payload": p.payload,
                "vector": p.vector if include_vectors else None,
            }
            for p in desc_points
        }
        root_map = {
            int(p.id): (p.vector if include_vectors else None)
            for p in root_points
        }

        merged = []
        for i in norm_ids:
            merged.append(
                {
                    "id": i,
                    "descriptionVector": desc_map.get(i, {}).get("vector"),
                    "rootCauseVector": root_map.get(i),
                    "payload": desc_map.get(i, {}).get("payload"),
                }
            )

        return standard_response(
            status="success",
            message="Vectors retrieved successfully.",
            data={"items": merged, "count": len(merged)},
        )
    except Exception as e:
        return standard_response(
            status="error",
            message=f"Vector retrieval failed: {str(e)}",
            status_code=500,
        )
