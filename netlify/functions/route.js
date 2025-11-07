export async function handler(event){
  try{
    const { origin, dest } = JSON.parse(event.body||"{}");
    if(!origin?.lat || !origin?.lon || !dest?.lat || !dest?.lon){
      return json({ error:"origin/dest {lat,lon} required" }, 400);
    }
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${dest.lon},${dest.lat}?overview=false`;
    const r = await fetch(url);
    if(!r.ok) return json({ error:"osrm failed" }, r.status);
    const data = await r.json();
    const leg = data?.routes?.[0];
    if(!leg) return json({ error:"no route" }, 404);
    return json({ meters: leg.distance, seconds: leg.duration });
  }catch(e){ return json({ error:e.message }, 500); }
}
function json(obj, code=200){ return { statusCode:code, headers:{ "content-type":"application/json" }, body:JSON.stringify(obj) }; }
