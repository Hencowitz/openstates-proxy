// proxy.js — OpenStates proxy for Squarespace use
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// health check at /
app.get("/", (req, res) => {
  res.send("✅ Proxy is running");
});

// main route
app.get("/people", async (req, res) => {
  const { id, key } = req.query;
  if (!id || !key) {
    return res.status(400).json({ error: "Missing id or key" });
  }
  try {
    const response = await fetch(`https://v3.openstates.org/people/${id}?apikey=${key}`);
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `OpenStates returned ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch data", details: err.toString() });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy running on port ${port}`));
