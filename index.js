const express = require("express");
const fetch = require("node-fetch");

const app = express();
const cache = new Map();

async function safeFetch(url, retries = 3, timeout = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === retries - 1) throw e;
    }
  }
}

app.get("/api/autobot", async (req, res) => {
  const endpoint = req.query.endpoint;
  const ref = req.query.ref;

  try {
    // ========= BULK MODE =========
    if (endpoint === "bulk") {
      if (cache.has("bulk")) return res.json(cache.get("bulk"));

      const centersUrl =
        "http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/centers_with_systems";

      const centers = JSON.parse(await safeFetch(centersUrl));

      const examPromises = centers.map(async (c) => {
        const url =
          "http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/center_last_exam?ref=" +
          c.referenceNumber;
        try {
          const data = JSON.parse(await safeFetch(url));
          return { ref: c.referenceNumber, data };
        } catch {
          return { ref: c.referenceNumber, data: null };
        }
      });

      const exams = await Promise.all(examPromises);
      const result = { centers, exams };

      cache.set("bulk", result);
      setTimeout(() => cache.delete("bulk"), 300000);

      return res.json(result);
    }

    // ========= CENTERS =========
    if (endpoint === "centers") {
      const url =
        "http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/centers_with_systems";
      const data = JSON.parse(await safeFetch(url));
      return res.json(data);
    }

    // ========= SINGLE CENTER =========
    if (endpoint === "center_last_exam") {
      if (!ref) return res.status(400).json({ error: "Missing ref" });
      const url =
        "http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/center_last_exam?ref=" +
        ref;
      const data = JSON.parse(await safeFetch(url));
      return res.json(data);
    }

    return res.status(400).json({ error: "Invalid endpoint" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
