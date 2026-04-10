import axios from "axios";

const API_URL = "http://localhost:5000/api/deviation";

export const analyzeDeviation = (data) =>
  axios.post(`${API_URL}/analyze`, data);
export const getCustomDeviations = () => axios.get(API_URL);
export const addCustomDeviation = (data) => axios.post(API_URL, data);
export const clearKnowledge = () => axios.post(`${API_URL}/clear-knowledge`);
export const getQdrantStatus = () => axios.get(`${API_URL}/qdrant-status`);

// ML service (FastAPI)
// NOTE: This repo's ML service default is commonly run on 8001.
const ML_API_URL = "http://localhost:8001/ml-service/common";
export const extractText = (content) =>
  axios.post(`${ML_API_URL}/extract-text`, { content });

const ENHANCE_AI_URL =
  "http://localhost:8001/ml-service/enhance_with_ai/dvms/ai/refine";
export const refineWithAI = ({ fieldType, userInput, userPrompt }) =>
  axios.post(`${ENHANCE_AI_URL}`, { fieldType, userInput, userPrompt });
