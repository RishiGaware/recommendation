const axios = require("axios");
const { ML_SERVICE_URL } = require("../config/env");

const analyzeDeviation = async (payload) => {
  const response = await axios.post(
    `${ML_SERVICE_URL}/dvms/analyze`,
    payload,
    { timeout: 60000 }, // 1 min for search
  );
  return response.data;
};

/**
 * Unified knowledge addition service.
 * Handles both a single deviation object or an array of deviations.
 */
const addKnowledge = async (data) => {
  const isArray = Array.isArray(data);
  const dataList = isArray ? data : [data];
  const BATCH_SIZE = 100;
  
  let totalIndexed = 0;
  let finalStatus = "success";
  let finalMessage = "";

  console.log(`[Backend Batching] Processing ${dataList.length} records in chunks of ${BATCH_SIZE}...`);

  for (let i = 0; i < dataList.length; i += BATCH_SIZE) {
    const chunk = dataList.slice(i, i + BATCH_SIZE);
    try {
      const response = await axios.post(
        `${ML_SERVICE_URL}/dvms/add-knowledge`,
        chunk,
        { timeout: 300000 } // 5 mins per batch
      );

      if (response.data.status !== "success") {
        finalStatus = "error";
        finalMessage += `[Batch ${Math.floor(i/BATCH_SIZE) + 1} Failed: ${response.data.message}] `;
      } else {
        // ML service returns the absolute count in its whole DB, but let's track relative progress
        totalIndexed += chunk.length;
      }
    } catch (error) {
      finalStatus = "error";
      finalMessage += `[Batch ${Math.floor(i/BATCH_SIZE) + 1} System Error: ${error.message}] `;
    }
  }

  return {
    status: finalStatus,
    message: finalMessage || `Successfully indexed ${totalIndexed} records in batches.`,
    data: { indexed: totalIndexed }
  };
};

const clearKnowledge = async () => {
  const response = await axios.post(`${ML_SERVICE_URL}/dvms/clear-knowledge`);
  return response.data;
};

const getQdrantStatus = async () => {
  const response = await axios.get(`${ML_SERVICE_URL}/dvms/qdrant-status`);
  return response.data;
};

module.exports = {
  analyzeDeviation,
  addKnowledge,
  clearKnowledge,
  getQdrantStatus,
};
