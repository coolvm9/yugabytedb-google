const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const util = require("util");
const callPredict = require("./vertexService");

async function run() {
  const embeddings = await callPredict("beach house");

  process.stdout.write(
    `${util.inspect(embeddings, { maxArrayLength: 1000 })}\n`
  );
}

run();
