import time
from qdrant_client.models import PointStruct
from app.db.qdrant import get_qdrant_client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION
from app.core.model_manager import get_shared_model
from app.core.response_handler import standard_response
from typing import Union, List, Dict

# Shared state between API calls
shared_model = get_shared_model()

def add_to_index(data: Union[Dict, List[Dict]]):
    """
    Unified handler for single or bulk knowledge indexing.
    Strictly uses incoming IDs and text fields without fallback or generation.
    """
    qdrant_client = get_qdrant_client()
    try:
        # 1. Standardize to list format for unified processing
        is_batch_mode = isinstance(data, list)
        deviations_list = data if is_batch_mode else [data]

        if not deviations_list:
            return standard_response(
                status="error",
                message="No deviations found to index.",
                status_code=400
            )

        total_input_count = len(deviations_list)
        
        # --- 2. Check existing IDs in Qdrant ---
        target_ids = []
        for deviation in deviations_list:
            try:
                deviation_id_val = deviation.get("id")
                if deviation_id_val is not None:
                    target_ids.append(int(deviation_id_val))
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
            except Exception as retrieval_error:
                print(f"Warning: Could not retrieve existing points for dedup: {retrieval_error}")

        # --- 3. Filter for NEW items only ---
        new_deviations = []
        for deviation in deviations_list:
            try:
                deviation_id = int(deviation.get("id"))
                if deviation_id not in existing_id_set:
                    new_deviations.append(deviation)
            except Exception as e:
                # If ID is missing or invalid, we skip as per requirement (must have ID)
                print(f"Skipping record due to invalid ID: {e}")
        
        total_skipped_count = total_input_count - len(new_deviations)
        
        if not new_deviations:
            current_vector_count = qdrant_client.count(DVMS_DESC_COLLECTION).count
            return standard_response(
                status="success",
                message=f"All {total_input_count} items already exist in index or had invalid IDs. Skipped.",
                data={"indexed": 0, "skipped": total_skipped_count, "total_vectors": current_vector_count}
            )

        # --- 4. Vectorization & Upsert (Safety Batching) ---
        CHUNK_SIZE = 50
        total_indexed_count = 0
        
        for i in range(0, len(new_deviations), CHUNK_SIZE):
            chunk = new_deviations[i : i + CHUNK_SIZE]
            
            # Prepare texts for this chunk
            description_texts = [str(d.get("description", "") or "") for d in chunk]
            root_cause_texts = [str(d.get("rootCauses", "") or "") for d in chunk]
            
            try:
                # High-performance AI embedding (in chunks)
                description_vectors = shared_model.encode(description_texts).tolist()
                root_cause_vectors = shared_model.encode(root_cause_texts).tolist()
            except Exception as ai_error:
                return standard_response(
                    status="error",
                    message=f"AI Vectorization Error (Chunk {i//CHUNK_SIZE + 1}): {str(ai_error)}",
                    status_code=500
                )

            # Prepare Point Structures
            description_points = []
            root_cause_points = []

            for deviation, desc_vector, rc_vector in zip(chunk, description_vectors, root_cause_vectors):
                current_point_id = int(deviation.get("id"))
                description_points.append(PointStruct(id=current_point_id, vector=desc_vector, payload=deviation))
                root_cause_points.append(PointStruct(id=current_point_id, vector=rc_vector, payload=deviation))

            try:
                # Perform chunked bulk upserts
                qdrant_client.upsert(collection_name=DVMS_DESC_COLLECTION, points=description_points)
                qdrant_client.upsert(collection_name=DVMS_ROOT_COLLECTION, points=root_cause_points)
                total_indexed_count += len(chunk)
            except Exception as upsert_error:
                return standard_response(
                    status="error",
                    message=f"Database Upsert Error (Chunk {i//CHUNK_SIZE + 1}): {str(upsert_error)}",
                    status_code=500
                )

        current_vector_count = qdrant_client.count(DVMS_DESC_COLLECTION).count
        
        # --- 6. Standardized Response ---
        summary_message = f"Processed {total_input_count} items. Indexed: {total_indexed_count}, Skipped: {total_skipped_count}."
        if not is_batch_mode:
            deviation_no = data.get('deviation_no', 'item')
            summary_message = f"Deviation '{deviation_no}' indexed successfully."

        return standard_response(
            status="success",
            message=summary_message,
            data={
                "indexed": total_indexed_count,
                "skipped": total_skipped_count,
                "total_vectors": current_vector_count
            },
            status_code=201 if total_indexed_count > 0 else 200
        )

    except Exception as pipeline_error:
        import traceback
        traceback.print_exc()
        return standard_response(
            status="error",
            message=f"Internal Indexing Pipeline Error: {str(pipeline_error)}",
            status_code=500
        )
