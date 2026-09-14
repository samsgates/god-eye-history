import { fetchJson } from '../lib/http.js';
import { cached } from '../lib/cache.js';

export async function wikipediaSummary(title){
  if(!title)return null;
  return cached(`wiki:${title}`,86400,async()=>{
    try{
      const x=await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      return {title:x.title,extract:x.extract,url:x.content_urls?.desktop?.page,thumbnail:x.thumbnail?.source};
    }catch{return null}
  });
}
