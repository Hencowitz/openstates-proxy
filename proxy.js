// proxy.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

/* ============================================================
   ROUTE 1: Legislator Lookup via OpenStates People.Geo
   ============================================================ */
app.get("/people", async (req, res) => {
  const { lat, lng, key } = req.query;

  if (!lat || !lng || !key) {
    return res.status(400).json({ error: "Missing lat, lng, or API key" });
  }

  try {
    const osURL = `https://v3.openstates.org/people.geo?lat=${lat}&lng=${lng}&apikey=${key}`;
    const r = await fetch(osURL);
    const data = await r.json();

    if (!data || !data.results) {
      return res.status(404).json({ error: "No legislators found" });
    }

    // Filter to show only Virginia state-level legislators (Senate + House)
    const filtered = data.results.filter(
      (rep) =>
        rep.email &&
        (rep.email.endsWith("senate.virginia.gov") ||
          rep.email.endsWith("house.virginia.gov"))
    );

    res.json({ results: filtered });
  } catch (err) {
    console.error("OpenStates error:", err);
    res.status(500).json({ error: "Failed to fetch legislator data" });
  }
});

/* ============================================================
   ROUTE 2: SB1303 Auto-Updating Bill + Meeting Info
   ============================================================ */
app.get("/sb1303", async (req, res) => {
  try {
    // 🟢 Pull live meeting data from the Virginia Studies API
    const meetingURL =
      "https://studies.virginiageneralassembly.gov/api/meetings?study=sb1303";
    const r = await fetch(meetingURL);
    const data = await r.json();

    // Find next meeting in the future
    const upcoming = data.find((m) => new Date(m.meeting_date) > new Date());

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

    // 🟢 SB1303 bill info (can later be automated from LIS if needed)
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
    console.error("SB1303 error:", err);
    res.status(500).json({ error: "Failed to load SB1303 data" });
  }
});

/* ============================================================
   SERVER START
   ============================================================ */
const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`✅ Proxy running on port ${port}`));
