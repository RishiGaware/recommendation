const express = require("express");
const cors = require("cors");
const deviationRoutes = require("./routes/deviationRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const app = express();

app.use(cors());
app.use(express.json());

// Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/deviation", deviationRoutes);

module.exports = app;
