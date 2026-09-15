import { fetchJson } from './lib/http.js';
import { cached } from './lib/cache.js';

export function parseDateIntent(q){
  const months={january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'};
  let m=q.match(/\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/i);
  if(m){const date=`${m[3]}-${months[m[2].toLowerCase()]}-${String(m[1]).padStart(2,'0')}`;return {date,start:date,end:date}}
  m=q.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if(m){const date=`${m[3]}-${months[m[1].toLowerCase()]}-${String(m[2]).padStart(2,'0')}`;return {date,start:date,end:date}}
  m=q.match(/\b(\d{1,4})\s*(?:AD|CE)\b/i)||q.match(/\b(\d{3,4})\b/);
  if(m){const year=String(Number(m[1])).padStart(4,'0');return {date:`${year}-01-01`,start:`${year}-01-01`,end:`${year}-12-31`}}
  return {date:null,start:null,end:null};
}
export function stripDate(q){
  const month='January|February|March|April|May|June|July|August|September|October|November|December';
  return q
    .replace(new RegExp(`\\b\\d{1,2}\\s+(${month})\\s+\\d{4}\\b`,'ig'),'')
    .replace(new RegExp(`\\b(${month})\\s+\\d{1,2},?\\s+\\d{4}\\b`,'ig'),'')
    .replace(/\b\d{1,4}\s*(?:AD|CE)\b/ig,'')
    .replace(/\b\d{3,4}\b/g,'')
    .replace(/\b(on|in|during)\b$/i,'').trim();
}

export async function searchPlaces(q){
  const dateIntent=parseDateIntent(q);const placeQ=stripDate(q)||q;
  const places=await cached(`place:v2:${placeQ.toLowerCase()}`,3600,async()=>{
    const u=new URL('https://nominatim.openstreetmap.org/search');u.search=new URLSearchParams({q:placeQ,format:'jsonv2',limit:'6',addressdetails:'1'});
    let list=[];try{list=await fetchJson(u.href,{headers:{'user-agent':'god-eye-history/1.0'}})}catch{}
    return list.map(x=>({id:`osm:${x.osm_type}:${x.osm_id}`,name:x.display_name?.split(',')[0]||x.name,display_name:x.display_name,lat:Number(x.lat),lng:Number(x.lon),country:x.address?.country,region:x.address?.state||x.address?.region,type:x.type||x.addresstype,bbox:x.boundingbox}));
  });
  return {places,intent:{...dateIntent,query:q,placeQuery:placeQ}};
}
export async function reversePlace(lat,lng){
  const u=new URL('https://nominatim.openstreetmap.org/reverse');u.search=new URLSearchParams({lat:String(lat),lon:String(lng),format:'jsonv2',zoom:'14',addressdetails:'1'});
  const x=await fetchJson(u.href,{headers:{'user-agent':'god-eye-history/1.0'}});
  return {place:{id:`osm:${x.osm_type}:${x.osm_id}`,name:x.name||x.display_name?.split(',')[0]||'Selected location',display_name:x.display_name,lat:Number(lat),lng:Number(lng),country:x.address?.country,region:x.address?.state||x.address?.region,type:x.type||x.addresstype}};
}
