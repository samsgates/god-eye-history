import fs from 'node:fs/promises';import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const db=new pg.Client({connectionString:process.env.DATABASE_URL});await db.connect();
await db.query(await fs.readFile(new URL('../database/seed.sql',import.meta.url),'utf8'));await db.end();console.log('Seed complete');
