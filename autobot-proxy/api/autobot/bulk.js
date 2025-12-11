export const config = {
  runtime: "edge"
};

// Simple retry function
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return res.json();
    } catch (e) {}
    await new Promise(r => setTimeout(r, 300));
  }
  return null;
}

export default async function handler(req) {
  const centersUrl =
    "http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/centers_with_systems";

  // Cache key
  const cacheKey = "autobot_bulk_cache";
  const cache = caches.default;

  // Check cache first
  const cached = await cache.match(cacheKey);
  if (cached) {
    return new Response(await cached.text(), {
      headers: { "Content-Type": "application/json", "X-Cache": "HIT" }
    });
  }

  try {
    // Fetch all centers
    const centers = await fetchWithRetry(centersUrl, 3);
    if (!centers) throw new Error("Failed to fetch centers");

    // Fetch exams in parallel
    const exams = await Promise.all(
      centers.map(center =>
        fetchWithRetry(
          `http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/center_last_exam?ref=${center.referenceNumber}`,
          3
        ).then(res => ({
          ref: center.referenceNumber,
          data: res
        }))
      )
    );

    const responseBody = JSON.stringify({ centers, exams });

    // Put into cache for 1 minute
    await cache.put(
      cacheKey,
      new Response(responseBody, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60"
        }
      })
    );

    return new Response(responseBody, {
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MISS"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
