const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "6LAPIS",
    status: "ONLINE",
    mode: "SIMULATION",
    message: "6LAPIS backend is running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    healthy: true,
    trading: false
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`6LAPIS running on port ${PORT}`);
});
