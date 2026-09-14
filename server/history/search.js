import { query, dbAvailable } from '../lib/db.js';
import { wikidataEvents, wikidataSameDay } from '../sources/wikidata.js';
import { nearbyMedia } from '../sources/wikimedia.js';
import { europeanaSearch } from '../sources/europeana.js';
import { normalizeEvent, scoreEvent } from './normalize.js';
import { fallbackEvents } from './seed-events.js';

function kmToMeters(km){return Number(km||15)*1000}

export async function searchEvents(input){
  const lat=Number(input.lat),lng=Number(input.lng),radius=Number(input.radius||15);
  let events=[];let scope='local';let used='fallback';
  if(await dbAvailable()){
    const r=await query(`
      SELECT id,title,short_description,full_description,date_start,date_end,date_precision,date_confidence,
        ST_Y(location::geometry) latitude,ST_X(location::geometry) longitude,location_precision,location_confidence,
        historical_place_name,modern_place_name,country,region,city,categories,importance_score,confidence_score,
        media,sources,significance
      FROM historical_events
      WHERE location IS NOT NULL
        AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $3)
        AND (date_start IS NULL OR date_start <= $5::date)
        AND (date_end IS NULL OR date_end >= $4::date)
      ORDER BY importance_score DESC NULLS LAST LIMIT 250
    `,[lng,lat,kmToMeters(radius),input.start,input.end||input.start]);
    events=(r?.rows||[]).map(normalizeEvent);used='database';
  }
  if(!events.length){
    try{events=await wikidataEvents({lat,lng,radiusKm:radius,start:input.start,end:input.end||input.start,limit:120});used='wikidata'}catch{}
  }
  if(!events.length){
    const targetYear=Number(String(input.start||'').slice(0,4));
    events=fallbackEvents.filter(e=>Math.abs(e.latitude-lat)<8&&Math.abs(e.longitude-lng)<12&&Math.abs(Number(e.date_start.slice(0,4))-targetYear)<=8).map(normalizeEvent);
    used='embedded-demo';scope='expanded';
  }
  const cats=(input.categories||'').split(',').filter(Boolean);
  if(cats.length)events=events.filter(e=>!e.categories.length||e.categories.some(c=>cats.includes(c)));
  events=events.map(e=>({...e,_score:scoreEvent(e,input)})).sort((a,b)=>b._score-a._score).slice(0,150);
  let media=[];try{media=await nearbyMedia({lat,lng,radius:Math.min(radius*1000,10000),limit:20})}catch{}
  return {events,scope,source:used,media_count:media.length,confidence:events.length?events.reduce((s,e)=>s+e.confidence_score,0)/events.length:.45};
}

export async function eventById(id){
  if(await dbAvailable()){
    const r=await query(`SELECT *,ST_Y(location::geometry) latitude,ST_X(location::geometry) longitude FROM historical_events WHERE id=$1 LIMIT 1`,[id]);
    if(r?.rows?.[0])return normalizeEvent(r.rows[0]);
  }
  const f=fallbackEvents.find(e=>String(e.id)===String(id));if(f)return normalizeEvent(f);
  if(String(id).startsWith('wd:')){
    const qid=String(id).slice(3);
    try{
      const r=await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
      if(r.ok){
        const j=await r.json();const ent=j.entities?.[qid];const title=ent?.labels?.en?.value||qid;
        return normalizeEvent({id,title,short_description:ent?.descriptions?.en?.value||'',latitude:0,longitude:0,confidence_score:.65,sources:[{title:'Wikidata',url:`https://www.wikidata.org/wiki/${qid}`}]});
      }
    }catch{}
  }
  return null;
}

export async function sameDay(date){
  let events=[];try{events=await wikidataSameDay(date)}catch{}
  if(!events.length)events=fallbackEvents.filter(e=>e.date_start===date).map(normalizeEvent);
  return {events:events.slice(0,150),scope:'global',source:events.length?'wikidata':'embedded-demo',confidence:.7,media_count:0};
}

export async function mediaFor(input){
  const items=[];try{items.push(...await nearbyMedia(input))}catch{}
  const q=input.query||input.place||'history';try{items.push(...await europeanaSearch({query:q,rows:20}))}catch{}
  return items;
}
