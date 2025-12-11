export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint");
  const ref = searchParams.get("ref");

  let url = null;

  if (endpoint === "centers") {
    url = "http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/centers_with_systems";
  } else if (endpoint === "center_last_exam") {
    if (!ref)
      return new Response(JSON.stringify({ error: "Missing ref" }), {
        headers: { "Content-Type": "application/json" }
      });

    url = `http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/center_last_exam?ref=${ref}`;
  } else {
    return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    return new Response(text, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
