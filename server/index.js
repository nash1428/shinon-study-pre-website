const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// TODO: Replace with real Supabase Auth JWT verification
const authMiddleware = (req, res, next) => {
  next();
};

app.use(authMiddleware);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// TODO: Wire up route handlers for /api/pages, /api/blocks, /api/ai/summarise, /api/search, /api/graph/suggest
// In production, these are handled by Next.js API routes. This Express server
// is for local development outside of Next.js.

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
