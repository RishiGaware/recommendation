const fs = require("fs");
const path = require("path");

const {
  analyzeDeviation,
  addKnowledge,
  train,
  getQdrantStatus,
} = require("../services/mlService");

const DATA_FILE = path.join(__dirname, "../../data/deviations.json");

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
    const { description, rootCauses, deviationType, deviationClassification } =
      req.body;

    const result = await analyzeDeviation({
      description,
      rootCauses,
      deviationType,
      deviationClassification,
    });

    res.json(result);
  } catch (error) {
    if (error.response) {
      console.error("ML Service Error Data:", error.response.data);
    }
    res.status(500).json({
      error: "Failed to analyze deviation",
      details: error.message,
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
 *               rootCauses:
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
      rootCauses,
      deviationType,
      deviationClassification,
    } = req.body;

    let deviations = [];
    if (fs.existsSync(DATA_FILE)) {
      deviations = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }

    const newDeviation = {
      id: Date.now(),
      deviation_no,
      description,
      rootCauses,
      deviationType,
      deviationClassification,
      created_at: new Date().toISOString(),
    };

    deviations.push(newDeviation);
    fs.writeFileSync(DATA_FILE, JSON.stringify(deviations, null, 2));

    // Add vector to FAISS index instantly via ML service (no full retrain needed)
    try {
      await addKnowledge(newDeviation);
      console.log(`Deviation vectorized and added to index: ${deviation_no}`);
    } catch (mlError) {
      console.error("Failed to add to ML index:", mlError.message);
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
const trainModel = async (req, res) => {
  try {
    let deviations = [];
    if (fs.existsSync(DATA_FILE)) {
      deviations = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }

    if (deviations.length === 0) {
      return res.status(400).json({ error: "No deviations found to train on." });
    }

    const result = await train(deviations);
    res.json({ message: "Training completed successfully", output: result });
  } catch (error) {
    if (error.response) {
      console.error("ML Service Error Data:", error.response.data);
    }
    res.status(500).json({
      error: "Training failed",
      details: error.message,
    });
  }
};

const getStatus = async (req, res) => {
  try {
    const result = await getQdrantStatus();
    res.json(result);
  } catch (error) {
    console.error("Backend Error in getStatus:", error.message);
    if (error.response) {
      console.error("ML Service Error response:", error.response.data);
    }
    res
      .status(500)
      .json({ error: "Failed to get Qdrant status", details: error.message });
  }
};

module.exports = {
  analyze,
  getDeviations,
  createDeviation,
  trainModel,
  getStatus,
};
