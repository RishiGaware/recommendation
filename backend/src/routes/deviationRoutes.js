const express = require("express");
const { analyze, getDeviations, createDeviation, trainModel, getStatus } = require("../controllers/deviationController");

const router = express.Router();

router.post("/analyze", analyze);
router.get("/", getDeviations);
router.post("/", createDeviation);
router.post("/train", trainModel);
router.get("/status", getStatus);

module.exports = router;
