import { config } from '../../config.js';

function toOpenAITools(tools){return tools.map(t=>({type:'function',name:t.name,description:t.description,parameters:t.input_schema,strict:false}))}
function extractText(json){
  if(json.output_text)return json.output_text;
  return (json.output||[]).flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n');
}
function extractCalls(json){
  return (json.output||[]).filter(x=>x.type==='function_call').map(x=>({id:x.call_id||x.id,name:x.name,args:typeof x.arguments==='string'?JSON.parse(x.arguments||'{}'):x.arguments||{}}));
}
export async function openaiGenerate({system,input,tools=[],model=config.openai.fast}){
  if(!config.openai.key)throw new Error('OpenAI API key not configured');
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{authorization:`Bearer ${config.openai.key}`,'content-type':'application/json'},body:JSON.stringify({model,instructions:system,input,tools:toOpenAITools(tools),tool_choice:tools.length?'auto':undefined})});
  const j=await r.json();if(!r.ok)throw new Error(j.error?.message||`OpenAI ${r.status}`);
  return {text:extractText(j),calls:extractCalls(j),raw:j,provider:'openai'};
}
