const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const crypto = require("crypto");

const dbPath = path.join(__dirname, "../data/pages.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

/* TODO: replace with real JWT verification */
router.use((req, res, next) => {
  // const token = req.headers.authorization?.split(" ")[1];
  // if (!verify(token)) return res.sendStatus(401);
  next();
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM pages WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Page not found" });
    }
    try {
      const content = JSON.parse(row.content);
      res.json({ id: row.id, content, created_at: row.created_at, updated_at: row.updated_at });
    } catch {
      res.status(500).json({ error: "Invalid page content" });
    }
  });
});

router.post("/", (req, res) => {
  const { page } = req.body;
  const id = crypto.randomUUID();
  const content = JSON.stringify(page || []);
  db.run(
    "INSERT INTO pages (id, content) VALUES (?, ?)",
    [id, content],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id });
    }
  );
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { page } = req.body;
  const content = JSON.stringify(page || []);
  db.run(
    "UPDATE pages SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [content, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Page not found" });
      }
      res.sendStatus(204);
    }
  );
});

module.exports = router;
