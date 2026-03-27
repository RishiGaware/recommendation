const axios = require("axios");
const { ML_SERVICE_URL } = require("../config/env");

const analyzeDeviation = async (payload) => {
  const response = await axios.post(ML_SERVICE_URL, payload);
  return response.data;
};

module.exports = { analyzeDeviation };
