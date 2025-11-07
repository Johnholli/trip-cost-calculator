export async function handler(event){
  try{
    const { coords, type, limit=3 } = JSON.parse(event.body||"{}");
    if(!coords?.lat || !coords?.lon) return json({ items:[], source:'none' }, 400);
    if(!['fuel','truck_fuel','service'].includes(type)) return json({ items:[], source:'none' }, 400);

    const overpass = `https://overpass-api.de/api/interpreter`;
    const bbox = bboxFromPoint(coords.lat, coords.lon, 30);
    let q;

    if(type==='service'){
      q = `[out:json][timeout:25];
           (node["shop"="car_repair"](${bbox});node["amenity"="car_repair"](${bbox}););
           out body;`;
    } else if(type==='truck_fuel'){
      q = `[out:json][timeout:25];
           (
             node["amenity"="fuel"]["brand"~"(?i)(TA|Petro|Love's|Loves|Pilot|Flying J|Kwik)"](${bbox});
             node["amenity"="fuel"]["name"~"(?i)(TA|Petro|Love's|Loves|Pilot|Flying J|Kwik)"](${bbox});
             node["amenity"="fuel"]["hgv"~"(?i)(yes|designated)"](${bbox});
           ); out body;`;
    } else {
      q = `[out:json][timeout:25]; (node["amenity"="fuel"](${bbox});); out body;`;
    }

    const r = await fetch(overpass, { method:'POST', body:q, headers:{'content-type':'text/plain'} });
    if(!r.ok) return json({ items:[], source:'osm' });
    const data = await r.json();
    const items = (data.elements||[])
      .map(e=>{
        const name = e.tags?.name || 'Fuel / Service';
        const brand = e.tags?.brand;
        return {
          name: brand && !name.includes(brand) ? `${name} (${brand})` : name,
          rating: null,
          distance_m: haversine(coords.lat, coords.lon, e.lat, e.lon),
          address: e.tags?.addr_full || '',
          maps_url: `https://www.openstreetmap.org/node/${e.id}`,
          hints: { hgv: e.tags?.hgv || null }
        };
      })
      .sort((a,b)=>{
        if(type==='truck_fuel'){
          const ah=a.hints?.hgv?1:0, bh=b.hints?.hgv?1:0;
          if(bh!==ah) return bh-ah;
        }
        return a.distance_m - b.distance_m;
      })
      .slice(0, limit);

    return json({ items, source:'osm' });
  }catch(e){ return json({ items:[], source:'none' }, 500); }
}
function json(obj, code=200){ return { statusCode:code, headers:{ "content-type":"application/json" }, body:JSON.stringify(obj) }; }
function haversine(lat1,lon1,lat2,lon2){ const R=6371000, toRad=x=>x*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a)); }
function bboxFromPoint(lat, lon, km){ const d=km/111; return `${lat-d},${lon-d},${lat+d},${lon+d}`; }
