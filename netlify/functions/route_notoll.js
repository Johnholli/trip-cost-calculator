export async function handler(event){
  try{
    const { coords } = JSON.parse(event.body||"{}");
    if(!Array.isArray(coords) || coords.length < 2) return json({ error:"coords required" }, 400);
    const key = process.env.ORS_API_KEY;
    if(!key) return json({ error:"ORS_API_KEY not set" }, 400);

    const body = {
      coordinates: coords.map(c => [c.lon, c.lat]),
      profile: "driving-car",
      avoid_features: ["tollways"],
      instructions: false,
      geometry: false
    };

    const r = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method:"POST",
      headers:{ "Authorization": key, "Content-Type":"application/json" },
      body:JSON.stringify(body)
    });
    if(!r.ok) return json({ error:"ors failed" }, r.status);
    const data = await r.json();
    const route = data?.routes?.[0];
    if(!route) return json({ error:"no alt route" }, 404);

    return json({ meters: route.summary.distance, seconds: route.summary.duration, provider:"ors" });
  }catch(e){ return json({ error:e.message }, 500); }
}
function json(obj, code=200){ return { statusCode:code, headers:{ "content-type":"application/json" }, body:JSON.stringify(obj) }; }
