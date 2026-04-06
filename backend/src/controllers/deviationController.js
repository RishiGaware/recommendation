const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { analyzeDeviation, addKnowledge } = require("../services/mlService");

const DATA_FILE = path.join(__dirname, "../../data/custom_deviations.json");
const TRAIN_SCRIPT = path.join(__dirname, "../../../ml-service/app/model/train.py");

/**
 * @openapi
 * /api/deviation/analyze:
 *   post:
 *     summary: Analyze a deviation using AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               correctionAction:
 *                 type: string
 *               deviationType:
 *                 type: string
 *               deviationClassification:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI analysis results
 */
const analyze = async (req, res) => {
  try {
    const { description, correctionAction, rootCauses, deviationType, deviationClassification } = req.body;
    
    const result = await analyzeDeviation({ 
      description, 
      correctionAction, 
      rootCauses,
      deviationType, 
      deviationClassification 
    });
    
    res.json(result);
  } catch (error) {
    if (error.response) {
      console.error("ML Service Error Data:", error.response.data);
    }
    res.status(500).json({ 
      error: "Failed to analyze deviation", 
      details: error.message
    });
  }
};

/**
 * @openapi
 * /api/deviation:
 *   get:
 *     summary: Get all custom deviations
 *     responses:
 *       200:
 *         description: List of deviations
 */
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

/**
 * @openapi
 * /api/deviation:
 *   post:
 *     summary: Add new knowledge (custom deviation)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviation_no:
 *                 type: string
 *               description:
 *                 type: string
 *               remarks:
 *                 type: string
 *               correctionAction:
 *                 type: string
 *               deviationType:
 *                 type: string
 *               deviationClassification:
 *                 type: string
 *     responses:
 *       201:
 *         description: Deviation saved
 */
const createDeviation = async (req, res) => {
  try {
    const { 
      deviation_no, 
      description, 
      remarks, 
      correctionAction, 
      deviationType, 
      deviationClassification 
    } = req.body;
    
    let deviations = [];
    if (fs.existsSync(DATA_FILE)) {
      deviations = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }

    const newDeviation = {
      id: Date.now(),
      deviation_no,
      description,
      remarks, // This maps to rootCause in the ML model
      correctionAction,
      deviationType,
      deviationClassification,
      created_at: new Date().toISOString()
    };

    deviations.push(newDeviation);
    fs.writeFileSync(DATA_FILE, JSON.stringify(deviations, null, 2));
    
    // LIVE VECTORIZATION: Add to FAISS index immediately
    try {
      await addKnowledge(newDeviation);
      console.log(`Live Vectorization successful for ${deviation_no}`);
    } catch (mlError) {
      console.error("Live Vectorization failed, but JSON was saved:", mlError.message);
      // We don't fail the whole request because the data IS saved to JSON for future training
    }
    
    res.status(201).json(newDeviation);
  } catch (error) {
    res.status(500).json({ error: "Failed to save deviation" });
  }
};

/**
 * @openapi
 * /api/deviation/train:
 *   post:
 *     summary: Trigger model retraining
 *     responses:
 *       200:
 *         description: Retraining completed
 */
const trainModel = (req, res) => {
  const ML_SERVICE_DIR = path.join(__dirname, "../../../ml-service");
  
  exec(`python -m app.model.train`, { cwd: ML_SERVICE_DIR }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Exec error: ${error}`);
      return res.status(500).json({ error: "Training failed", details: stderr || error.message });
    }
    
    try {
      const mainPy = path.join(ML_SERVICE_DIR, "app/main.py");
      const now = new Date();
      fs.utimesSync(mainPy, now, now);
    } catch (e) {
      console.error("Failed to touch main.py:", e);
    }

    res.json({ message: "Training completed successfully", output: stdout });
  });
};

module.exports = { analyze, getDeviations, createDeviation, trainModel };
