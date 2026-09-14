import { config } from '../../config.js';
function toGeminiTools(tools){return [{functionDeclarations:tools.map(t=>({name:t.name,description:t.description,parameters:t.input_schema}))}]}
export async function geminiGenerate({system,input,tools=[],model=config.gemini.fast}){
  if(!config.gemini.key)throw new Error('Gemini API key not configured');
  const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.gemini.key)}`;
  const body={systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:input}]}],generationConfig:{maxOutputTokens:1600}};
  if(tools.length)body.tools=toGeminiTools(tools);
  const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await r.json();
  if(!r.ok)throw new Error(j.error?.message||`Gemini ${r.status}`);
  const parts=j.candidates?.[0]?.content?.parts||[];
  return {text:parts.filter(p=>p.text).map(p=>p.text).join('\n'),calls:parts.filter(p=>p.functionCall).map((p,i)=>({id:p.functionCall.id||`g${i}`,name:p.functionCall.name,args:p.functionCall.args||{}})),raw:j,provider:'gemini'};
}
