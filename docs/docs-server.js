const dotenv = require("dotenv");
dotenv.config(); // load env variables

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const app = express();

// Serve Swagger UI
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`📘 Swagger Docs running at http://localhost:${PORT}`);
});
