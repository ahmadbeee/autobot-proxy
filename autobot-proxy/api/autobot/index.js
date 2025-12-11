export const config = {
  runtime: 'nodejs'
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint");
  const ref = searchParams.get("ref");

  let apiUrl;

  if (endpoint === "centers") {
    apiUrl =
      "http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/centers_with_systems";

  } else if (endpoint === "center_last_exam") {
    if (!ref) {
      return new Response(JSON.stringify({ error: "Missing ref parameter" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    apiUrl =
      `http://autobot.multilentjmb.com:8080/autobotmonitor/cms/545975484454/api/centers/center_last_exam?ref=${ref}`;

  } else {
    return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.text();
    return new Response(data, {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}

