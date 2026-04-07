const axios = require("axios");
const { ML_SERVICE_URL } = require("../config/env");

const analyzeDeviation = async (payload) => {
  const response = await axios.post(
    `${ML_SERVICE_URL}/DVMS/analyze`,
    payload,
  );
  return response.data;
};

const addKnowledge = async (payload) => {
  const response = await axios.post(
    `${ML_SERVICE_URL}/DVMS/add-knowledge`,
    payload,
  );
  return response.data;
};

const train = async (data) => {
  const response = await axios.post(`${ML_SERVICE_URL}/DVMS/train`, data);
  return response.data;
};

const getQdrantStatus = async () => {
  const response = await axios.get(`${ML_SERVICE_URL}/DVMS/qdrant-status`);
  return response.data;
};

module.exports = { analyzeDeviation, addKnowledge, train, getQdrantStatus };
