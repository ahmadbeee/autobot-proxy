export const config = { runtime: "nodejs" };

import fetch from "node-fetch";

// Simple in-memory cache
let cache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  return null;
}

async function fetchInBatches(items, batchSize = 20) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(center =>
        fetchWithRetry(
          `http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/center_last_exam?ref=${center.referenceNumber}`
        ).then(data => ({ ref: center.referenceNumber, data }))
      )
    );
    results.push(...batchResults);
  }
  return results;
}

export default async function handler(req, res) {
  const now = Date.now();

  // Serve from cache if still valid
  if (cache && now - cacheTimestamp < CACHE_DURATION) {
    return res.status(200).json(cache);
  }

  const centersUrl =
    "http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/centers_with_systems";

  try {
    // Fetch centers
    const centers = await fetchWithRetry(centersUrl);
    if (!centers) throw new Error("Failed to fetch centers");

    // Fetch exams in batches
    const exams = await fetchInBatches(centers, 20);

    const responseData = { centers, exams };

    // Save to cache
    cache = responseData;
    cacheTimestamp = now;

    return res.status(200).json(responseData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
