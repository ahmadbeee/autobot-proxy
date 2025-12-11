export const config = {
  runtime: 'nodejs'
};

export default async function handler(req) {
  const centersUrl =
    "http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/centers_with_systems";

  try {
    const res = await fetch(centersUrl);
    const centers = await res.json();

    const examRequests = centers.map(c =>
      fetch(
        `http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/center_last_exam?ref=${c.Ref}`
      )
        .then(r => r.json())
        .catch(() => ({ error: "failed", ref: c.Ref }))
    );

    const examResults = await Promise.all(examRequests);

    return new Response(JSON.stringify(examResults), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}

