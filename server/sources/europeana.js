import { fetchJson } from '../lib/http.js';
import { cached } from '../lib/cache.js';
import { config } from '../config.js';

export async function europeanaSearch({query='history',rows=24}={}){
  if(!config.europeanaKey)return [];
  return cached(`europeana:${query}:${rows}`,3600,async()=>{
    const u=new URL('https://api.europeana.eu/record/v2/search.json');
    u.search=new URLSearchParams({wskey:config.europeanaKey,query,rows:String(Math.min(rows,50)),profile:'rich'});
    const j=await fetchJson(u.href);
    return (j.items||[]).map(x=>({
      id:x.id,title:Array.isArray(x.title)?x.title[0]:x.title,year:x.year?.[0],
      thumbnail:x.edmPreview?.[0],url:x.guid,provider:x.dataProvider?.[0]||x.provider?.[0]||'Europeana',source:'Europeana'
    }));
  });
}
