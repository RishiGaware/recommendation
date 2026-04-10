const fs = require("fs");
const path = require("path");

const {
  analyzeDeviation,
  addKnowledge,
  clearKnowledge,
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

    console.log("Analyzing Deviation Path Triggered...");
    // 1. Get THIN matches from ML Service (Standardized structure)
    const mlResponse = await analyzeDeviation({
      description,
      rootCauses,
      deviationType,
      deviationClassification,
    });

    console.log("ML Service Response Status:", mlResponse?.status);
    console.log("ML Service Response Data Count:", mlResponse?.data?.similarDeviations?.length || 0);

    if (
      !mlResponse.data ||
      !mlResponse.data.similarDeviations ||
      mlResponse.data.similarDeviations.length === 0
    ) {
      console.log("No similar deviations found by ML Service.");
      return res.json(mlResponse);
    }

    const { similarDeviations } = mlResponse.data;

    // 2. Fetch FULL DATA from "Database" (currently the JSON file)
    let allData = [];
    if (fs.existsSync(DATA_FILE)) {
      allData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }

    // 3. HYDRATION: Merge SQL data with ML Match Scores
    console.log(`Hydrating ${similarDeviations.length} matches...`);
    const hydratedResults = similarDeviations.map((match) => {
      // Find the full record in our database by ID
      const fullRecord = allData.find((d) => d.id == match.id);

      // Combine the textual data from DB with the AI match scores
      if (fullRecord) {
        return {
          ...fullRecord,
          matchScore: match.matchScore,
          descriptionMatch: match.descriptionMatch,
          rootCauseMatch: match.rootCauseMatch,
        };
      }
      return match; // Fallback if record not found
    });

    // 4. Return the enriched objects to the Frontend
    console.log("Sending Hydrated Response to Frontend.");
    res.json({
      ...mlResponse,
      data: {
        ...mlResponse.data,
        similarDeviations: hydratedResults,
        hydrated_from: "SSMS Mock (JSON)",
      },
    });
  } catch (error) {
    console.error("Analysis/Hydration Error:", error.message);
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to analyze deviation (Hydration Phase)";
    res.status(error.response?.status || 500).json({
      status: "error",
      message: message,
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
      return res.json({
        status: "success",
        message: "No deviations found",
        data: [],
      });
    }
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    const deviations = JSON.parse(data);
    res.json({
      status: "success",
      message: "Deviations retrieved successfully",
      data: deviations,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to read deviations",
      details: error.message,
    });
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
    const data = req.body;
    const isBatch = Array.isArray(data);
    const dataList = isBatch ? data : [data];

    if (dataList.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No data provided",
      });
    }

    let existingDeviations = [];
    if (fs.existsSync(DATA_FILE)) {
      existingDeviations = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }

    const processedItems = dataList.map((item) => ({
      ...item,
      id: item.id || Date.now() + Math.floor(Math.random() * 1000),
      created_at: item.created_at || new Date().toISOString(),
    }));

    // Save to local JSON "database"
    const updatedDeviations = [...existingDeviations, ...processedItems];
    fs.writeFileSync(DATA_FILE, JSON.stringify(updatedDeviations, null, 2));

    // Sync with ML Service (Unified endpoint handles both single and batch)
    let mlMessage = "";
    try {
      const mlResponse = await addKnowledge(isBatch ? processedItems : processedItems[0]);
      mlMessage = mlResponse.message;
      console.log("ML Sync Success:", mlMessage);
    } catch (mlError) {
      console.error(
        "Failed to sync with ML service:",
        mlError.response?.data?.message || mlError.message,
      );
      mlMessage = "Warning: Saved locally but failed to sync with AI index.";
    }

    res.status(201).json({
      status: "success",
      message: isBatch 
        ? `Successfully saved ${processedItems.length} deviations.`
        : `Deviation '${processedItems[0].deviation_no}' saved successfully.`,
      data: isBatch ? processedItems : processedItems[0],
      ml_status: mlMessage
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to process deviation(s)",
      details: error.message,
    });
  }
};

/**
 * @openapi
 * /api/deviation/add-knowledge:
 *   post:
 *     summary: Trigger deep sync repositioning all historical records into AI memory
 *     responses:
 *       200:
 *         description: Sync completed
 */
const syncKnowledge = async (req, res) => {
  try {
    let deviations = [];
    if (fs.existsSync(DATA_FILE)) {
      deviations = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }

    console.log(`Deep Sync Triggered with ${deviations.length} records.`);

    if (deviations.length === 0) {
      return res.status(400).json({
        status: "error", 
        message: "No deviations found in local database to train on." 
      });
    }

    // 1. Reset AI Index (Clear Slate)
    console.log("Triggering Stage 1: AI Index Reset...");
    const clearResult = await clearKnowledge();
    if (clearResult.status !== "success") {
      throw new Error(`Knowledge clear failed: ${clearResult.message}`);
    }

    // 2. Full Sync (Re-index everything)
    console.log("Triggering Stage 2: Knowledge Re-indexing...");
    const syncResult = await addKnowledge(deviations);
    
    if (syncResult.status !== "success") {
      throw new Error(`Stage 2 (Sync) Failed: ${syncResult.message}`);
    }

    console.log("Full Rebuild Completed Successfully.");
    res.json({
      status: "success",
      message: "Full Model Rebuild Completed Successfully.",
      data: {
        clear_status: clearResult.message,
        sync_status: syncResult.message,
        total_vectors: syncResult.data.total_vectors
      }
    });
  } catch (error) {
    console.error("Full Rebuild Error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Full Model Rebuild Failed",
      details: error.message,
    });
  }
};

/**
 * @openapi
 * /api/deviation/clear-knowledge:
 *   post:
 *     summary: Clear all AI knowledge
 *     responses:
 *       200:
 *         description: AI memory cleared
 */
const clearAllKnowledge = async (req, res) => {
  try {
    console.log("Triggering isolated AI Knowledge Clear...");
    const result = await clearKnowledge();

    res.json({
      ...result,
      message: "AI Knowledge cleared successfully."
    });
  } catch (error) {
    console.error("Clear Knowledge Error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to clear AI knowledge",
      details: error.message,
    });
  }
};
/**
 * @openapi
 * /api/deviation/qdrant-status:
 *   get:
 *     summary: Get AI engine and vector index status
 *     responses:
 *       200:
 *         description: System status returned
 */
const getStatus = async (req, res) => {
  try {
    const result = await getQdrantStatus();
    res.json(result); // result already has {status, message, data}
  } catch (error) {
    console.error("Backend Error in getStatus:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to get system status",
      details: error.message,
    });
  }
};

module.exports = {
  analyze,
  getDeviations,
  createDeviation,
  syncKnowledge,
  clearAllKnowledge,
  getStatus,
};
