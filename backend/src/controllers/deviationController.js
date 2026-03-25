const { analyzeDeviation } = require("../services/mlService");

const analyze = async (req, res) => {
  try {
    const { title, description } = req.body;

    const text = `${title} ${description}`;

    const result = await analyzeDeviation(text);

    res.json(result);
  } catch (error) {
    if (error.response) {
      console.error("ML Service Error Data:", error.response.data);
      console.error("ML Service Status Code:", error.response.status);
    } else if (error.request) {
      console.error("ML Service No Response Received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    
    res.status(500).json({ 
      error: "Failed to analyze deviation", 
      details: error.message,
      mlServiceError: error.response ? error.response.data : "Unknown",
      recommendation: "Ensure the ML service is running and check ML service logs."
    });
  }
};

module.exports = { analyze };
