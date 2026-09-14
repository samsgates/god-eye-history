import { fetchJson } from '../lib/http.js';
import { cached } from '../lib/cache.js';

export async function nearbyMedia({lat,lng,radius=5000,limit=20}){
  const key=`commons:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius}`;
  return cached(key,86400,async()=>{
    const u=new URL('https://commons.wikimedia.org/w/api.php');
    u.search=new URLSearchParams({
      action:'query',format:'json',generator:'geosearch',ggsprimary:'all',ggsnamespace:'6',
      ggsradius:String(Math.min(10000,radius)),ggscoord:`${lat}|${lng}`,ggslimit:String(Math.min(50,limit)),
      prop:'imageinfo|coordinates',iiprop:'url|extmetadata',iiurlwidth:'640',origin:'*'
    });
    const json=await fetchJson(u.href);
    return Object.values(json.query?.pages||{}).map(p=>({
      id:`commons:${p.pageid}`,title:p.title?.replace(/^File:/,''),url:p.imageinfo?.[0]?.descriptionurl,
      thumbnail:p.imageinfo?.[0]?.thumburl||p.imageinfo?.[0]?.url,
      latitude:p.coordinates?.[0]?.lat,longitude:p.coordinates?.[0]?.lon,
      date:p.imageinfo?.[0]?.extmetadata?.DateTimeOriginal?.value||null,
      license:p.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value||null,
      source:'Wikimedia Commons'
    }));
  });
}
