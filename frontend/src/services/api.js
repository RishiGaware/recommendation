import axios from "axios";

export const analyzeDeviation = (data) => {
  return axios.post("http://localhost:5000/api/deviation/analyze", data);
};
