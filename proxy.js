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
// 🆕 SB1303 route
app.get("/sb1303", async (req, res) => {
  try {
    const meetingURL = "https://studies.virginiageneralassembly.gov/api/meetings?study=sb1303";
    const r = await fetch(meetingURL);
    const data = await r.json();

    const upcoming = data.find(
      m => new Date(m.meeting_date) > new Date()
    );

    const meeting = upcoming
      ? {
          date: new Date(upcoming.meeting_date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          time: upcoming.meeting_time || "TBA",
          location: upcoming.location || "TBA",
          details: upcoming.name || "Meeting details not available",
          url: `https://studies.virginiageneralassembly.gov/meetings/${upcoming.id}`,
        }
      : null;

    const bill = {
      number: "SB 1303",
      session: "2025",
      patron: "Senator Jeremy S. McPike",
      title:
        "Student Diabetes Medical Management Plans; School Health Services Committee to conduct a review.",
      status: "Chapter 339 — Enacted March 21, 2025",
      lis: "https://lis.virginia.gov/bill-details/20251/SB1303",
    };

    res.json({ bill, meeting });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load SB1303 data" });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Proxy running on port ${port}`));
