import axios from "axios";

export const analyzeDeviation = (data) =>
  axios.post(`${ML_SERVICE_BASE_URL}/dvms/analyze`, data);

export const getQdrantStatus = () =>
  axios.get(`${ML_SERVICE_BASE_URL}/dvms/qdrant-status`);

// ML service (FastAPI)
// Default runs on 8001. You can override via Vite env: VITE_ML_SERVICE_BASE_URL
const ML_SERVICE_BASE_URL =
  import.meta.env.VITE_ML_SERVICE_BASE_URL ??
  "http://localhost:8000/ml-service";

export const extractText = (content) =>
  axios.post(`${ML_SERVICE_BASE_URL}/common/extract-text`, { content });

export const refineWithAI = ({ fieldType, userInput, userPrompt }) =>
  axios.post(`${ML_SERVICE_BASE_URL}/ai_enhancement/dvms/ai/refine`, {
    fieldType,
    userInput,
    userPrompt,
  });

export const getDvmsVectorsByIds = ({ ids, includeVectors = true }) =>
  axios.post(`${ML_SERVICE_BASE_URL}/dvms/vectors`, { ids, includeVectors });

export const clearMlKnowledge = () =>
  axios.post(`${ML_SERVICE_BASE_URL}/dvms/clear-knowledge`);

export const addMlKnowledge = (data) =>
  axios.post(`${ML_SERVICE_BASE_URL}/dvms/add-knowledge`, data);
