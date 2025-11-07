export async function handler(event){
  try{
    const { q } = JSON.parse(event.body||"{}");
    if(!q) return json({ error:"q required" }, 400);
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "3");

    const r = await fetch(url, {
      headers:{
        "User-Agent":"diesel-buddy/1.0 (contact: example@example.com)",
        "Accept":"application/json"
      }
    });
    if(!r.ok) return json({ error:"nominatim failed" }, r.status);
    const data = await r.json();
    return json(data.map(d=>({ lat:d.lat, lon:d.lon, display_name:d.display_name })));
  }catch(e){ return json({ error:e.message }, 500); }
}
function json(obj, code=200){ return { statusCode:code, headers:{ "content-type":"application/json" }, body:JSON.stringify(obj) }; }
