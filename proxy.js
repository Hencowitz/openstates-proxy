import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/people", async (req, res) => {
  try {
    const { lat, lng, key } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing lat/lng" });
    }

    const url = `https://v3.openstates.org/people.geo?lat=${lat}&lng=${lng}&apikey=${key}`;
    console.log("Proxying to:", url);

    const r = await fetch(url);
    const data = await r.json();

    if (!data.results || data.results.length === 0) {
      console.log("No results from OpenStates");
    }

    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Proxy running on port ${port}`));
