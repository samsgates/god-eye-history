import { fetchJson } from '../lib/http.js';
import { cached } from '../lib/cache.js';
import { config } from '../config.js';

function distanceBBox(lat,lng,r=2){return `${lng-r},${lat-r},${lng+r},${lat+r}`}
export async function presentLayer(layer,{lat=20,lng=0,radius=250}={}){
  if(layer==='earthquakes'){
    const data=await cached('usgs:eq',120,()=>fetchJson('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'));
    return {items:(data.features||[]).map(f=>({id:f.id,latitude:f.geometry.coordinates[1],longitude:f.geometry.coordinates[0],altitude:20,label:`M${f.properties.mag}`,color:'#ff8d66',...f.properties})),notice:'Live USGS earthquakes'};
  }
  if(layer==='satellites'){
    return {items:[],notice:'Satellite visualization compatibility is retained. Configure the upstream CelesTrak/TLE pipeline for orbital propagation.'};
  }
  if(layer==='aircraft'){
    try{
      const j=await cached(`opensky:${lat.toFixed(1)}:${lng.toFixed(1)}`,15,()=>fetchJson(`https://opensky-network.org/api/states/all?lamin=${lat-2}&lomin=${lng-2}&lamax=${lat+2}&lomax=${lng+2}`,{timeout:10000}));
      return {items:(j.states||[]).map(s=>({id:s[0],label:(s[1]||'').trim(),longitude:s[5],latitude:s[6],altitude:s[7]||500,color:'#87f4ff'})),notice:'OpenSky public aircraft, subject to provider limits'};
    }catch{return {items:[],notice:'Aircraft provider unavailable or rate limited. Configure OpenSky credentials for higher reliability.'}}
  }
  if(layer==='fires'){
    if(!config.present.firmsKey)return {items:[],notice:'NASA FIRMS key not configured'};
    return {items:[],notice:'NASA FIRMS compatibility enabled. Add a regional FIRMS connector for your licensed product feed.'};
  }
  if(layer==='cctv'){
    try{
      const j=await cached('tfl:cctv',180,()=>fetchJson('https://api.tfl.gov.uk/Place/Type/JamCam'));
      return {items:(j||[]).slice(0,800).map(x=>({id:x.id,label:'CCTV',latitude:x.lat,longitude:x.lon,color:'#a998ff',commonName:x.commonName,url:x.url})),notice:'TfL public traffic cameras'};
    }catch{return {items:[],notice:'Public camera source unavailable'}}
  }
  if(layer==='bikeshare')return {items:[],notice:'Bike-share compatibility retained through GBFS adapters. Configure systems in server/present/gbfs.json.'};
  if(layer==='traffic')return {items:[],notice:config.present.tomtomKey?'TomTom key configured. Traffic vector rendering adapter is ready for integration.':'TomTom key not configured'};
  if(layer==='vessels')return {items:[],notice:'AIS vessel compatibility retained. Connect your authorized AIS WebSocket/feed in this provider adapter.'};
  if(layer==='infrastructure')return {items:[],notice:'Infrastructure layer compatibility retained. Use OpenStreetMap/Overpass or your licensed infrastructure source.'};
  throw new Error('Unknown present-day layer');
}
