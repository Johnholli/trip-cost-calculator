export async function handler(event) {
  try {
    const { origin, dest } = JSON.parse(event.body || "{}");
    if (!origin || !dest) return { statusCode: 400, body: "Missing origin/dest" };

    const url = new URL(`https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${dest.lon},${dest.lat}`);
    url.searchParams.set("overview", "false");
    url.searchParams.set("alternatives", "false");

    const r = await fetch(url.toString());
    if (!r.ok) return { statusCode: r.status, body: `OSRM error: ${await r.text()}` };
    const data = await r.json();
    if (!data.routes?.length) return { statusCode: 404, body: "No route found" };

    const { distance, duration } = data.routes[0];
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ meters: distance, seconds: duration }) };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
}
