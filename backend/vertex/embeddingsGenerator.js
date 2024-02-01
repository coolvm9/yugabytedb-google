const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { DB_HOST, DB_NAME, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DEPLOYMENT } =
  process.env;
// only use rootCertPath for managed deployments
const rootCertPath =
  DB_DEPLOYMENT === "managed" && path.join(__dirname, "../certs/root.crt");
const callPredict = require("./vertexService");

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
async function main() {
  console.log("Connected to YugabyteDB");

  let id = 0;
  let length = 0;
  let totalCnt = 0;

  do {
    console.log(`Processing rows starting from ${id}`);

    const res = await pool.query(
      "SELECT id, description FROM airbnb_listing " +
        "WHERE id >= $1 and description IS NOT NULL ORDER BY id LIMIT 200",
      [id]
    );
    length = res.rows.length;
    let rows = res.rows;

    if (length > 0) {
      for (let i = 0; i < length; i++) {
        const description = rows[i].description.replace(/\*|\n/g, " ");

        id = rows[i].id;

        const embeddingResp = await callPredict(description);

        const res = await pool.query(
          "UPDATE airbnb_listing SET description_embedding = $1 WHERE id = $2",
          ["[" + embeddingResp + "]", id]
        );

        totalCnt++;
      }

      id++;

      console.log(`Processed ${totalCnt} rows`);
    }
  } while (length != 0);

  console.log(`Finished generating embeddings for ${totalCnt} rows`);
  process.exit(0);
}

main();
