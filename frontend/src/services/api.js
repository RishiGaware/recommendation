import axios from "axios";

const API_URL = "http://localhost:5000/api/deviation";

export const analyzeDeviation = (data) =>
  axios.post(`${API_URL}/analyze`, data);
export const getCustomDeviations = () => axios.get(API_URL);
export const addCustomDeviation = (data) => axios.post(API_URL, data);
export const clearKnowledge = () => axios.post(`${API_URL}/clear-knowledge`);
export const getQdrantStatus = () => axios.get(`${API_URL}/qdrant-status`);

const ML_API_URL = "http://localhost:8000/ml-service/common";
export const extractText = (content) =>
  axios.post(`${ML_API_URL}/extract-text`, { content });
