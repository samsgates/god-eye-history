import { config } from '../config.js';
import { openaiGenerate } from './providers/openai.js';
import { geminiGenerate } from './providers/gemini.js';
import { claudeGenerate } from './providers/claude.js';
import { toolDefinitions, runTool } from './tools.js';
import { searchEvents, sameDay } from '../history/search.js';

const providers={openai:openaiGenerate,gemini:geminiGenerate,claude:claudeGenerate};
const SYSTEM=`You are the grounded historical guide inside god-eye-history.
Rules:
1. Historical facts must be supported by retrieved evidence supplied to you or retrieved through tools.
2. Never invent exact dates, times, coordinates, quotations, people, or events.
3. Clearly distinguish exact, approximate, and disputed information.
4. If evidence is insufficient, say so and suggest broadening the place/date/radius.
5. Keep answers concise and spatially useful. Mention where events happened and their temporal precision.
6. Never reveal private chain-of-thought. Provide conclusions and source-grounded explanations only.`;

function providerOrder(requested){
  const configured={openai:!!config.openai.key,gemini:!!config.gemini.key,claude:!!config.claude.key};
  let first=requested&&requested!=='auto'?requested:config.defaultAiProvider;
  if(first==='auto')first=configured.openai?'openai':configured.gemini?'gemini':configured.claude?'claude':null;
  const order=[first,config.aiFallback,config.aiSecondaryFallback,'openai','gemini','claude'].filter(Boolean);
  return [...new Set(order)].filter(x=>configured[x]);
}
function evidenceSources(events=[]){
  const seen=new Set();const out=[];
  for(const e of events)for(const s of e.sources||[]){if(s.url&&!seen.has(s.url)){seen.add(s.url);out.push(s)}}
  return out.slice(0,10);
}
function heuristicConfidence(events=[]){
  if(!events.length)return .35;
  return Math.min(.98,events.reduce((s,e)=>s+Number(e.confidence_score||.6),0)/events.length);
}

export async function askHistory({question,context={},provider='auto'}){
  // Retrieval-first. This guarantees grounded fallback even without any AI key.
  let evidence={events:[]};
  if(context.place?.lat!=null){
    evidence=await searchEvents({lat:context.place.lat,lng:context.place.lng,radius:15,start:context.date,end:context.date});
  } else if(context.date) evidence=await sameDay(context.date);
  const sources=evidenceSources(evidence.events);
  const evidenceText=JSON.stringify({
    place:context.place,date:context.date,event:context.event,
    events:evidence.events.slice(0,18).map(e=>({id:e.id,title:e.title,date:e.display_date||e.date_start,description:e.short_description,precision:e.date_precision,location_precision:e.location_precision,sources:e.sources}))
  });
  const order=providerOrder(provider);
  if(!order.length){
    const top=evidence.events.slice(0,5);
    return {provider:'retrieval-only',confidence:heuristicConfidence(top),sources,
      answer:top.length?`I found ${top.length} supported historical records for this map context. ${top.map(e=>`${e.title} (${e.display_date||e.date_start||'date uncertain'})`).join('; ')}. Configure OpenAI, Gemini, or Claude to receive a synthesized explanation.`:'I could not find sufficiently supported historical records for this exact place and date. Try widening the radius or date range.'};
  }
  let lastErr;
  for(const name of order){
    try{
      const generate=providers[name];
      let res=await generate({system:SYSTEM,input:`Question: ${question}\n\nCurrent map context and retrieved evidence:\n${evidenceText}\n\nAnswer using only this evidence. If tools are needed, call them.`,tools:toolDefinitions});
      // One controlled tool round. We intentionally cap the loop to avoid runaway API cost.
      if(res.calls?.length){
        const results=[];
        for(const call of res.calls.slice(0,8)){
          try{results.push({tool:call.name,result:await runTool(call.name,call.args)})}
          catch(e){results.push({tool:call.name,error:e.message})}
        }
        res=await generate({system:SYSTEM,input:`Question: ${question}\n\nInitial evidence:\n${evidenceText}\n\nTool results:\n${JSON.stringify(results).slice(0,60000)}\n\nSynthesize a concise sourced answer. Do not claim anything not present in evidence.`,tools:[]});
      }
      return {answer:res.text||'No supported answer was generated.',provider:name,confidence:heuristicConfidence(evidence.events),sources};
    }catch(e){lastErr=e}
  }
  throw lastErr||new Error('No AI provider available');
}
