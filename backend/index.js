require("dotenv").config();
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const { DB_HOST, DB_NAME, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DEPLOYMENT } =
  process.env;

// only use rootCertPath for managed deployments
const rootCertPath =
  DB_DEPLOYMENT === "managed" && path.join(__dirname, "../certs/root.crt");

const { Pool } = require("@yugabytedb/pg");
const dbConfig = {
  database: DB_NAME,
  host: DB_HOST,
  user: DB_USERNAME,
  port: DB_PORT,
  password: DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 0,
};

// managed deployments require SSL certificate
if (DB_DEPLOYMENT === "managed") {
  dbConfig["ssl"] = {
    rejectUnauthorized: true,
    ca: fs.readFileSync(rootCertPath).toString(),
    servername: DB_HOST,
  };
}
const pool = new Pool(dbConfig);

const express = require("express");
const callPredict = require(path.resolve(__dirname, "vertex/vertexService.js"));

const App = express();
App.use(cors());

const getEmbeddings = async function (req, res, next) {
  try {
    const text = req?.query?.searchText;
    console.log("search text:", text);

    if (!text) {
      throw "no searchText supplied to /embeddings";
    }

    const decodedSearchText = atob(text);
    const embeddings = await callPredict(decodedSearchText);
    req.embeddings = `[${embeddings}]`;
    next();
  } catch (err) {
    next(err);
  }
};

App.get("/api/recommendations", getEmbeddings, async (req, res) => {
  try {
    const embeddings = req?.embeddings;

    if (!embeddings) throw "No embeddings supplied.";

    const dbRes = await pool.query(
      "SELECT name, description, price, 1 - (description_embedding <=> $1) as similarity " +
        "FROM airbnb_listing WHERE 1 - (description_embedding <=> $1) > 0.7 ORDER BY similarity DESC LIMIT 5",
      [embeddings]
    );
    // const dbRes = await pool.query(
    //   "SELECT description, price from airbnb_listing order by description_embedding <=> $1 LIMIT 5",
    //   [embeddings]
    // );

    const recommendations = dbRes?.rows;

    res.status(200).send(recommendations);
  } catch (err) {
    console.log(`Error in /recommendations: ${err}`);
    res.status(400).send(`Error in /recommendations`);
  }
});

App.get("/api/embeddings", async (req, res) => {
  try {
    const text = req?.query?.searchText;
    console.log("search text:", text);

    if (!text) {
      throw "no searchText supplied to /embeddings";
    }

    const decodedSearchText = atob(text);
    const embeddings = await callPredict(decodedSearchText);

    res.status(200).send(embeddings);
  } catch (e) {
    res.status(400).send(e);
  }
});

App.use((err, req, res, next) => {
  console.log(err); // Log error for debugging

  // Set the response status code
  res.status(500); // Internal Server Error

  // Send the error message back to the client
  res.send(`Error: ${err}`);
});

App.listen(8080, () => {
  console.log("App listening on port 8080");
});
