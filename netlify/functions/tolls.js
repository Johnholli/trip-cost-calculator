export async function handler(event){
  try{
    const { coords } = JSON.parse(event.body||"{}");
    if(!Array.isArray(coords) || coords.length < 2) return json({ provider:"none" }, 400);

    const key = process.env.ORS_API_KEY;
    if(!key) return json({ provider:"none" });

    const body = {
      coordinates: coords.map(c => [c.lon, c.lat]),
      profile: "driving-car",
      extra_info: ["tollways"],
      instructions: false,
      geometry: false
    };

    const r = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method:"POST",
      headers:{ "Authorization": key, "Content-Type":"application/json" },
      body:JSON.stringify(body)
    });
    if(!r.ok) return json({ provider:"none" });

    const data = await r.json();
    const segs = data?.routes?.[0]?.extras?.tollways?.values || [];
    const total = data?.routes?.[0]?.summary?.distance || 0;
    const idx = data?.routes?.[0]?.segments?.reduce((s,v)=>s+(v?.steps?.length||0),0)||1;

    let tollShare=0; for(const [start,end,val] of segs){ if(val===1) tollShare += Math.max(0,end-start); }
    const tollMeters = idx>0 ? (tollShare/idx)*total : 0;

    return json({ provider:"ors", toll_meters: Math.round(tollMeters) });
  }catch(e){ return json({ provider:"none" }, 500); }
}
function json(obj, code=200){ return { statusCode:code, headers:{ "content-type":"application/json" }, body:JSON.stringify(obj) }; }
