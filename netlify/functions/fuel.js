export async function handler(event){
  try{
    const { coords } = JSON.parse(event.body||"{}");
    if(!coords?.lat || !coords?.lon) return json({ price:null, meta:"manual", source:"none" });

    // reverse geocode -> state_code
    const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=8&lat=${coords.lat}&lon=${coords.lon}`,{
      headers:{ "User-Agent":"diesel-buddy/1.0 (contact: example@example.com)", "Accept":"application/json" }
    });
    if(!rev.ok) return json({ price:null, meta:"manual", source:"none" });
    const rjson = await rev.json();
    const country = (rjson?.address?.country_code||"").toUpperCase();
    const stateCode = (rjson?.address?.state_code||"").toUpperCase();
    if(country!=="US" || !stateCode) return json({ price:null, meta:"manual", source:"none" });

    const key = process.env.EIA_API_KEY;
    if(!key) return json({ price:null, meta:"manual", source:"none" });

    const seriesId = `PET.EMD_EPD2D_PTE_S${stateCode}_DPG.W`;
    const eiaURL = `https://api.eia.gov/series/?api_key=${key}&series_id=${seriesId}`;
    const eia = await fetch(eiaURL);
    if(!eia.ok) return json({ price:null, meta:"manual", source:"none" });
    const ejson = await eia.json();
    const latest = ejson?.series?.[0]?.data?.[0]?.[1];
    if(typeof latest !== "number") return json({ price:null, meta:"manual", source:"none" });

    return json({ price: latest, meta:`EIA ${stateCode}`, source:"EIA" });
  }catch(e){ return json({ price:null, meta:"manual", source:"none" }); }
}
function json(obj, code=200){ return { statusCode:code, headers:{ "content-type":"application/json" }, body:JSON.stringify(obj) }; }
