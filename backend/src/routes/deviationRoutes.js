const express = require("express");
const { analyze, getDeviations, createDeviation, trainModel } = require("../controllers/deviationController");

const router = express.Router();

router.post("/analyze", analyze);
router.get("/", getDeviations);
router.post("/", createDeviation);
router.post("/train", trainModel);

module.exports = router;
