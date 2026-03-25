const express = require("express");
const cors = require("cors");

const deviationRoutes = require("./routes/deviationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/deviation", deviationRoutes);

module.exports = app;
