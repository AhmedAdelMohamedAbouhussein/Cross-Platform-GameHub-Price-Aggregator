// run using: node generate-swagger.js
// This script generates the Swagger specification file (swagger.json) by scanning the API route files for JSDoc comments.

const dotenv = require("dotenv");
dotenv.config(); // load env variables

const swaggerJsdoc = require("swagger-jsdoc");
const fs = require("fs");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My Gamehub API",
      version: "1.0.0",
      description: "API documentation for the My Gamehub backend",
    },
    //servers: [{ url: process.env.BACKEND_URL }],
  },
  apis: ["./backend/src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

fs.writeFileSync("./docs/swagger.json", JSON.stringify(swaggerSpec, null, 2));
console.log("✅ Swagger spec generated at ./docs/swagger.json");
