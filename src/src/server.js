
const express = require("express");
require("dotenv").config();

const { scanTokens } = require("./scanner");

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "6LAPIS",
    status: "ONLINE",
    mode: "SIMULATION",
    trading: false
  });
});

app.get("/health", (req, res) => {
  res.json({
    healthy: true,
    scanner: "READY",
    trading: false
  });
});

app.post("/scan", (req, res) => {
  const tokens = req.body.tokens;

  if (!Array.isArray(tokens) || tokens.length > 100) {
    return res.status(400).json({
      error: "Invalid token list"
    });
  }

  res.json({
    system: "6LAPIS",
    mode: "SIMULATION",
    results: scanTokens(tokens)
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`6LAPIS running on port ${PORT}`);
});
      
