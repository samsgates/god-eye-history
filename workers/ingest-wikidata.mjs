import pg from 'pg';
import { wikidataSameDay } from '../server/sources/wikidata.js';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL required');
const date=process.argv[2]||'1947-08-15';
const events=await wikidataSameDay(date,250);
const db=new pg.Client({connectionString:process.env.DATABASE_URL});await db.connect();
for(const e of events){
  await db.query(`INSERT INTO historical_events(id,title,short_description,date_start,date_end,date_precision,date_confidence,location,location_precision,location_confidence,categories,importance_score,confidence_score,sources)
  VALUES($1,$2,$3,$4,$5,$6,$7,ST_SetSRID(ST_MakePoint($8,$9),4326)::geography,$10,$11,$12,$13,$14,$15)
  ON CONFLICT(id) DO UPDATE SET title=excluded.title,date_start=excluded.date_start,location=excluded.location,sources=excluded.sources,updated_at=now()`,
  [e.id,e.title,e.short_description,e.date_start,e.date_end,e.date_precision,e.date_confidence,e.longitude,e.latitude,e.location_precision,e.location_confidence,e.categories,e.importance_score,e.confidence_score,JSON.stringify(e.sources)])
}
await db.end();console.log(`Imported ${events.length} Wikidata events for ${date}`);
