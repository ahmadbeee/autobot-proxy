export const config = { runtime: "nodejs" }; // use "nodejs" for serverless

import fetch from "node-fetch";

// Retry helper
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  return null;
}

// Batch fetch helper
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
  const centersUrl =
    "http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/centers_with_systems";

  try {
    const centers = await fetchWithRetry(centersUrl);
    if (!centers) throw new Error("Failed to fetch centers");

    const exams = await fetchInBatches(centers, 20);

    return res.status(200).json({ centers, exams });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
