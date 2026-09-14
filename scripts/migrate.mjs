import fs from 'node:fs/promises';
import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const db=new pg.Client({connectionString:process.env.DATABASE_URL});await db.connect();
const files=(await fs.readdir(new URL('../database/migrations/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort();
for(const file of files){console.log('Applying',file);await db.query(await fs.readFile(new URL(`../database/migrations/${file}`,import.meta.url),'utf8'))}
await db.end();console.log('Migrations complete');
