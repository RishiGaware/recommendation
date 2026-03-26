const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { analyzeDeviation } = require("../services/mlService");

const DATA_FILE = path.join(__dirname, "../../data/custom_deviations.json");
const TRAIN_SCRIPT = path.join(__dirname, "../../../ml-service/app/model/train.py");

const analyze = async (req, res) => {
  try {
    const { description, correctionAction, deviationType, deviationClassification } = req.body;
    
    // Pass the structured object directly to the ML service service
    // The ML service now handles concatenation internally
    const result = await analyzeDeviation({ 
      description, 
      correctionAction, 
      deviationType, 
      deviationClassification 
    });
    
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

const getDeviations = (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.json([]);
    }
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: "Failed to read deviations" });
  }
};

const createDeviation = (req, res) => {
  try {
    const { deviation_no, description, remarks } = req.body;
    
    let deviations = [];
    if (fs.existsSync(DATA_FILE)) {
      deviations = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }

    const newDeviation = {
      id: Date.now(),
      deviation_no,
      description,
      remarks,
      created_at: new Date().toISOString()
    };

    deviations.push(newDeviation);
    fs.writeFileSync(DATA_FILE, JSON.stringify(deviations, null, 2));
    
    res.status(201).json(newDeviation);
  } catch (error) {
    res.status(500).json({ error: "Failed to save deviation" });
  }
};

const trainModel = (req, res) => {
  const ML_SERVICE_DIR = path.join(__dirname, "../../../ml-service");
  
  exec(`python -m app.model.train`, { cwd: ML_SERVICE_DIR }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Exec error: ${error}`);
      return res.status(500).json({ error: "Training failed", details: stderr || error.message });
    }
    console.log(`Training stdout: ${stdout}`);
    if (stderr) console.error(`Training stderr: ${stderr}`);
    
    // Trigger uvicorn reload by touching main.py
    try {
      const mainPy = path.join(ML_SERVICE_DIR, "app/main.py");
      const now = new Date();
      fs.utimesSync(mainPy, now, now);
      console.log("Touched main.py to trigger reload");
    } catch (e) {
      console.error("Failed to touch main.py:", e);
    }

    res.json({ message: "Training completed successfully", output: stdout });
  });
};

module.exports = { analyze, getDeviations, createDeviation, trainModel };
