export async function handler() {
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ok: true,
      name: "trip-cost-calculator",
      time: new Date().toISOString()
    })
  };
}
