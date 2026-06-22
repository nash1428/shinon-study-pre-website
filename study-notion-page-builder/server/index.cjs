require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const pagesRouter = require("./routes/pages.cjs");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/pages", pagesRouter);

// TODO: add real AI assist endpoint that proxies to OpenAI or uses the existing wrapper
app.post("/api/ai/assist", async (req, res) => {
  const { prompt } = req.body;
  // Placeholder response for demo
  res.json({ response: `Mock AI response to: "${prompt}"` });
});

// Serve example JSON files
app.use("/examples", express.static(path.join(__dirname, "../examples")));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
