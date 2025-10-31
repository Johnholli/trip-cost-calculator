export async function handler(event) {
  try {
    const { q } = JSON.parse(event.body || "{}");
    if (!q) return { statusCode: 400, body: "Missing q" };

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const r = await fetch(url.toString(), {
      headers: {
        "User-Agent": "trip-cost-calculator-jh/1.0 (contact: johnholli@example.com)",
        "Accept": "application/json"
      }
    });
    if (!r.ok) return { statusCode: r.status, body: `Nominatim error: ${await r.text()}` };

    const json = await r.json();
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(json) };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
}
