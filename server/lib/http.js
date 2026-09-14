export async function fetchJson(url,{timeout=12000,headers={},...opts}={}){
  const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),timeout);
  try{
    const r=await fetch(url,{...opts,headers:{'user-agent':'god-eye-history/1.0',accept:'application/json',...headers},signal:ctl.signal});
    if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);
    return await r.json();
  }finally{clearTimeout(timer)}
}
export function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
export function safeUrl(u){try{const x=new URL(u);return ['http:','https:'].includes(x.protocol)?x.href:null}catch{return null}}
