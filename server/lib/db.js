import pg from 'pg';
import { config } from '../config.js';
const {Pool}=pg;
export const pool=config.databaseUrl?new Pool({connectionString:config.databaseUrl,max:10,idleTimeoutMillis:30000}):null;
export async function query(text,params=[]){
  if(!pool)return null;
  return pool.query(text,params);
}
export async function dbAvailable(){
  if(!pool)return false;
  try{await pool.query('select 1');return true}catch{return false}
}
