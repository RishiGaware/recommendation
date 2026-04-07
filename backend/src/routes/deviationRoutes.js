const express = require("express");
const { 
  analyze, 
  getDeviations, 
  createDeviation, 
  syncKnowledge, 
  clearAllKnowledge, 
  getStatus 
} = require("../controllers/deviationController");

const router = express.Router();

router.post("/analyze", analyze);
router.get("/", getDeviations);
router.post("/", createDeviation);
router.post("/add-knowledge", syncKnowledge);
router.post("/clear-knowledge", clearAllKnowledge);
router.get("/qdrant-status", getStatus);

module.exports = router;
