import Redis from 'ioredis';
import { config } from '../config.js';
let redis=null;const memory=new Map();
if(config.redisUrl){
  try{redis=new Redis(config.redisUrl,{lazyConnect:true,maxRetriesPerRequest:1,enableOfflineQueue:false});redis.connect().catch(()=>{redis=null})}catch{}
}
export async function cached(key,ttlSec,loader){
  if(redis){try{const hit=await redis.get(key);if(hit)return JSON.parse(hit)}catch{}}
  const hit=memory.get(key);if(hit&&hit.exp>Date.now())return hit.value;
  const value=await loader();
  if(redis){try{await redis.set(key,JSON.stringify(value),'EX',ttlSec)}catch{}}
  memory.set(key,{value,exp:Date.now()+ttlSec*1000});
  if(memory.size>1000){const first=memory.keys().next().value;memory.delete(first)}
  return value;
}
