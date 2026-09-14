import 'node:process';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { dbAvailable, query } from './lib/db.js';
import { searchPlaces, reversePlace } from './places.js';
import { searchEvents, eventById, sameDay, mediaFor } from './history/search.js';
import { askHistory } from './ai/orchestrator.js';
import { presentLayer } from './present/providers.js';
import { stories } from './stories.js';
import { register, login, signUser, authMiddleware } from './auth.js';

const app=express();
app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false}));
app.use(cors({origin:true,credentials:true}));
app.use(express.json({limit:'1mb'}));

app.get('/health',async(req,res)=>res.json({ok:true,service:'god-eye-history',database:await dbAvailable(),time:new Date().toISOString()}));
app.get('/api/config',(req,res)=>res.json({
  cesiumIonToken:config.cesiumIonToken||undefined,
  google3dConfigured:!!config.googleMapsApiKey,
  googleMapsApiKey:config.googleMapsApiKey||undefined,
  ai:{openai:!!config.openai.key,gemini:!!config.gemini.key,claude:!!config.claude.key,default:config.defaultAiProvider},
  features:{history:true,present:true,stories:true,annotations:true,compare:true}
}));

app.get('/api/places/search',async(req,res,next)=>{try{res.json(await searchPlaces(String(req.query.q||'')))}catch(e){next(e)}});
app.get('/api/places/reverse',async(req,res,next)=>{try{res.json(await reversePlace(Number(req.query.lat),Number(req.query.lng)))}catch(e){next(e)}});

app.get('/api/history/events',async(req,res,next)=>{try{res.json(await searchEvents(req.query))}catch(e){next(e)}});
app.get('/api/history/events/:id',async(req,res,next)=>{try{const event=await eventById(req.params.id);if(!event)return res.status(404).json({error:'Event not found'});res.json({event})}catch(e){next(e)}});
app.get('/api/history/day/:date',async(req,res,next)=>{try{res.json(await sameDay(req.params.date))}catch(e){next(e)}});
app.get('/api/history/media',async(req,res,next)=>{try{res.json({items:await mediaFor(req.query)})}catch(e){next(e)}});
app.get('/api/history/what-was-here',async(req,res,next)=>{try{
  const years=['1000-01-01','1500-01-01','1750-01-01','1850-01-01','1900-01-01','1925-01-01','1950-01-01','1975-01-01','2000-01-01','2026-01-01'];
  const all=[];for(let i=0;i<years.length-1;i++){const r=await searchEvents({...req.query,start:years[i],end:years[i+1]});all.push(...r.events.slice(0,20))}
  const seen=new Set();const events=all.filter(e=>!seen.has(e.id)&&seen.add(e.id)).sort((a,b)=>String(a.date_start||'').localeCompare(String(b.date_start||'')));
  res.json({events,scope:'through time',confidence:events.length?.72:.4,media_count:0});
}catch(e){next(e)}});
app.get('/api/history/events/:id/related',async(req,res,next)=>{try{
  const base=await eventById(req.params.id);if(!base)return res.status(404).json({error:'Event not found'});
  const r=await searchEvents({lat:base.latitude,lng:base.longitude,radius:100,start:base.date_start||'0001-01-01',end:base.date_end||base.date_start||'2026-12-31'});
  const events=r.events.filter(e=>e.id!==base.id).slice(0,20);
  res.json({nodes:[base,...events].map(e=>({id:e.id,title:e.title,date:e.date_start,categories:e.categories,lat:e.latitude,lng:e.longitude})),edges:events.map(e=>({source:base.id,target:e.id,type:'spatiotemporal'}))});
}catch(e){next(e)}});
app.get('/api/history/people',async(req,res,next)=>{try{
  const r=await searchEvents(req.query);const map=new Map();
  for(const e of r.events)for(const p of e.persons||[]){const id=p.id||p.name;if(id&&!map.has(id))map.set(id,p)}
  res.json({people:[...map.values()]});
}catch(e){next(e)}});

app.get('/api/history/timeline',async(req,res,next)=>{
  try{
    const {lat,lng,start='1800-01-01',end='2026-12-31',radius=25}=req.query;
    const r=await searchEvents({lat,lng,start,end,radius});
    const buckets={};for(const e of r.events){const y=String(e.date_start||'').slice(0,4);if(y)buckets[y]=(buckets[y]||0)+1}
    res.json({buckets,events:r.events});
  }catch(e){next(e)}
});
app.get('/api/history/compare',async(req,res,next)=>{
  try{
    const a=await searchEvents({...req.query,start:req.query.dateA,end:req.query.dateA});
    const b=await searchEvents({...req.query,start:req.query.dateB,end:req.query.dateB});
    res.json({a,b,summary:{added:b.events.filter(x=>!a.events.some(y=>y.title===x.title)).length,removed:a.events.filter(x=>!b.events.some(y=>y.title===x.title)).length}});
  }catch(e){next(e)}
});
app.get('/api/history/place/:placeId',async(req,res)=>res.json({placeId:req.params.placeId,notice:'Use timeline endpoint with resolved place coordinates for complete place history.'}));
app.get('/api/history/this-day/:monthDay',async(req,res,next)=>{
  try{
    const md=req.params.monthDay;const years=[1666,1776,1947,1969,1989,2001,2026];let events=[];
    for(const y of years){const r=await sameDay(`${y}-${md}`);events.push(...r.events)}
    res.json({events:events.slice(0,150),scope:'global',confidence:.7});
  }catch(e){next(e)}
});

app.post('/api/ai/history',async(req,res,next)=>{try{res.json(await askHistory(req.body||{}))}catch(e){next(e)}});
app.get('/api/present/:layer',async(req,res,next)=>{try{res.json(await presentLayer(req.params.layer,req.query))}catch(e){next(e)}});
app.get('/api/stories',(req,res)=>res.json({stories:stories.map(({scenes,...x})=>({...x,scene_count:scenes.length}))}));
app.get('/api/stories/:id',(req,res)=>{const story=stories.find(x=>x.id===req.params.id);story?res.json({story}):res.status(404).json({error:'Story not found'})});

app.post('/api/auth/register',async(req,res,next)=>{try{const u=await register(req.body.email,req.body.password,req.body.name);res.json({user:u,token:signUser(u)})}catch(e){next(e)}});
app.post('/api/auth/login',async(req,res,next)=>{try{const u=await login(req.body.email,req.body.password);res.json({user:u,token:signUser(u)})}catch(e){next(e)}});
app.get('/api/me',authMiddleware,(req,res)=>res.json({user:req.user}));
app.post('/api/bookmarks',authMiddleware,async(req,res,next)=>{try{
  if(!(await dbAvailable()))throw new Error('Database required');
  const r=await query(`insert into bookmarks(user_id,title,state) values($1,$2,$3) returning *`,[req.user.sub,req.body.title||'Historical view',req.body.state||{}]);res.json({bookmark:r.rows[0]});
}catch(e){next(e)}});
app.get('/api/bookmarks',authMiddleware,async(req,res,next)=>{try{const r=await query(`select * from bookmarks where user_id=$1 order by created_at desc`,[req.user.sub]);res.json({bookmarks:r?.rows||[]})}catch(e){next(e)}});
app.post('/api/collections',authMiddleware,async(req,res,next)=>{try{
  const r=await query(`insert into collections(user_id,title,description,items) values($1,$2,$3,$4) returning *`,[req.user.sub,req.body.title||'Collection',req.body.description||'',req.body.items||[]]);res.json({collection:r.rows[0]});
}catch(e){next(e)}});
app.get('/api/collections',authMiddleware,async(req,res,next)=>{try{
  const r=await query(`select * from collections where user_id=$1 order by created_at desc`,[req.user.sub]);res.json({collections:r?.rows||[]});
}catch(e){next(e)}});
app.patch('/api/settings',authMiddleware,async(req,res,next)=>{try{
  const r=await query(`update users set settings=coalesce(settings,'{}'::jsonb)||$2::jsonb where id=$1 returning settings`,[req.user.sub,JSON.stringify(req.body||{})]);res.json({settings:r.rows[0]?.settings||{}});
}catch(e){next(e)}});
app.get('/api/admin/source-health',async(req,res)=>res.json({
  sources:[
    {name:'Wikidata',configured:true},{name:'Wikimedia Commons',configured:true},{name:'OpenHistoricalMap',configured:true},
    {name:'Europeana',configured:!!config.europeanaKey},{name:'OpenAI',configured:!!config.openai.key},{name:'Gemini',configured:!!config.gemini.key},{name:'Claude',configured:!!config.claude.key}
  ],checked_at:new Date().toISOString()
}));


app.get('/api/admin/quality',async(req,res,next)=>{try{
  if(!(await dbAvailable()))return res.json({database:false});
  const r=await query(`select count(*) total,count(*) filter(where date_precision='exact_day') exact_date,count(*) filter(where location is not null) geocoded,count(*) filter(where jsonb_array_length(coalesce(sources,'[]'::jsonb))>1) multi_source from historical_events`);
  res.json({database:true,...r.rows[0]});
}catch(e){next(e)}});

if(process.env.NODE_ENV==='production'){
  const __dirname=path.dirname(fileURLToPath(import.meta.url));const dist=path.resolve(__dirname,'../dist');
  app.use(express.static(dist,{maxAge:'1h'}));
  app.use((req,res,next)=>req.method==='GET'?res.sendFile(path.join(dist,'index.html')):next());
}

app.use((err,req,res,next)=>{
  console.error(err);res.status(500).json({error:process.env.NODE_ENV==='production'?'Request failed':err.message});
});
app.listen(config.port,'0.0.0.0',()=>console.log(`god-eye-history API on :${config.port}`));
