import axios from "axios";

export const analyzeDeviation = (data) =>
  axios.post(`${ML_SERVICE_BASE_URL}/dvms/analyze`, data);

export const analyzeOOS = (data) =>
  axios.post(`${ML_SERVICE_BASE_URL}/oos/analyze`, data);

export const getQdrantStatus = () =>
  axios.get(`${ML_SERVICE_BASE_URL}/dvms/qdrant-status`);

export const getOosStatus = () =>
  axios.get(`${ML_SERVICE_BASE_URL}/oos/qdrant-status`);

// ML service (FastAPI)
// Default runs on 8001. You can override via Vite env: VITE_ML_SERVICE_BASE_URL
const ML_SERVICE_BASE_URL =
  import.meta.env.VITE_ML_SERVICE_BASE_URL ??
  "http://localhost:8000/ml-service";

export const extractText = (content) =>
  axios.post(`${ML_SERVICE_BASE_URL}/common/extract-text`, { content });

export const refineWithAI = ({ fieldType, value, prompt, domain = "dvms" }) =>
  axios.post(`${ML_SERVICE_BASE_URL}/${domain}/ai/refine`, {
    fieldType,
    value,
    prompt,
  });

export const getDvmsVectorsByIds = ({ ids, includeVectors = true }) =>
  axios.post(`${ML_SERVICE_BASE_URL}/dvms/vectors`, { ids, includeVectors });

export const clearMlKnowledge = () =>
  axios.post(`${ML_SERVICE_BASE_URL}/dvms/clear-knowledge`);

export const addMlKnowledge = (data) =>
  axios.post(`${ML_SERVICE_BASE_URL}/dvms/add-knowledge`, data);

// --- OOS Specific Endpoints ---

export const analyzeOos = (data) =>
  axios.post(`${ML_SERVICE_BASE_URL}/oos/analyze`, data);

export const clearOosKnowledge = (phase) =>
  axios.post(
    `${ML_SERVICE_BASE_URL}/oos/clear-knowledge${phase ? `?phase=${phase}` : ""}`,
  );

export const addOosKnowledge = (data) =>
  axios.post(`${ML_SERVICE_BASE_URL}/oos/add-knowledge`, data);

export const getOosVectorsByIds = ({ ids, phase, includeVectors = true }) =>
  axios.post(`${ML_SERVICE_BASE_URL}/oos/vectors`, {
    ids,
    phase,
    includeVectors,
  });
