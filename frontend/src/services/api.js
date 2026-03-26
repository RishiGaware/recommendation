import axios from "axios";

const API_URL = "http://localhost:5000/api/deviation";

export const analyzeDeviation = (data) => axios.post(`${API_URL}/analyze`, data);
export const getCustomDeviations = () => axios.get(API_URL);
export const addCustomDeviation = (data) => axios.post(API_URL, data);
export const trainModel = () => axios.post(`${API_URL}/train`);
