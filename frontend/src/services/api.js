import axios from "axios";

const API_URL = "http://localhost:5000/api/deviation";

export const analyzeDeviation = (data) =>
  axios.post(`${API_URL}/analyze`, data);
export const getCustomDeviations = () => axios.get(API_URL);
export const addCustomDeviation = (data) => axios.post(API_URL, data);
export const clearKnowledge = () => axios.post(`${API_URL}/clear-knowledge`);
export const getQdrantStatus = () => axios.get(`${API_URL}/qdrant-status`);

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
