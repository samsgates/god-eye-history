import { config } from '../../config.js';
function toClaudeTools(tools){return tools.map(t=>({name:t.name,description:t.description,input_schema:t.input_schema}))}
export async function claudeGenerate({system,input,tools=[],model=config.claude.fast}){
  if(!config.claude.key)throw new Error('Claude API key not configured');
  const body={model,max_tokens:1600,system,messages:[{role:'user',content:input}]};
  if(tools.length)body.tools=toClaudeTools(tools);
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':config.claude.key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json();if(!r.ok)throw new Error(j.error?.message||`Claude ${r.status}`);
  return {text:(j.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n'),calls:(j.content||[]).filter(x=>x.type==='tool_use').map(x=>({id:x.id,name:x.name,args:x.input||{}})),raw:j,provider:'claude'};
}
