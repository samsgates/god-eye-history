import { fetchJson } from '../lib/http.js';
import { cached } from '../lib/cache.js';
import { normalizeEvent } from '../history/normalize.js';

const WDQS='https://query.wikidata.org/sparql';

export async function wikidataEvents({lat,lng,radiusKm=15,start,end,limit=80}){
  const radius=Math.min(100,Math.max(.1,Number(radiusKm)||15));
  const startDate=(start||'1900-01-01').replace(/[^\d-]/g,'');
  const endDate=(end||startDate).replace(/[^\d-]/g,'');
  const query=`
SELECT ?item ?itemLabel ?date ?coord ?article WHERE {
  SERVICE wikibase:around {
    ?item wdt:P625 ?coord.
    bd:serviceParam wikibase:center "Point(${Number(lng)} ${Number(lat)})"^^geo:wktLiteral.
    bd:serviceParam wikibase:radius "${radius}".
  }
  { ?item wdt:P585 ?date. } UNION { ?item wdt:P580 ?date. } UNION { ?item wdt:P571 ?date. }
  FILTER(?date >= "${startDate}T00:00:00Z"^^xsd:dateTime && ?date <= "${endDate}T23:59:59Z"^^xsd:dateTime)
  OPTIONAL { ?article schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT ${Math.min(200,limit)}
`;
  const key=`wd:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius}:${startDate}:${endDate}`;
  return cached(key,86400,async()=>{
    const url=`${WDQS}?format=json&query=${encodeURIComponent(query)}`;
    const json=await fetchJson(url,{timeout:15000,headers:{'user-agent':'god-eye-history/1.0 (historical research viewer)'}});
    return (json.results?.bindings||[]).map(b=>{
      const m=/Point\(([-\d.]+) ([-\d.]+)\)/.exec(b.coord?.value||'');
      const qid=(b.item?.value||'').split('/').pop();
      const title=b.itemLabel?.value||qid;
      return normalizeEvent({
        id:`wd:${qid}`,title,date_start:(b.date?.value||'').slice(0,10),
        latitude:m?Number(m[2]):lat,longitude:m?Number(m[1]):lng,
        location_precision:'city',confidence_score:.72,importance_score:.55,
        sources:[{title:'Wikidata',publisher:'Wikimedia Foundation',url:b.item?.value},{title:'Wikipedia',url:b.article?.value}].filter(x=>x.url),
        categories:['events']
      });
    });
  });
}

export async function wikidataSameDay(date,limit=120){
  const md=date.slice(5);const year=Number(date.slice(0,4));
  const query=`
SELECT ?item ?itemLabel ?date ?coord WHERE {
  ?item wdt:P625 ?coord.
  { ?item wdt:P585 ?date. } UNION { ?item wdt:P580 ?date. } UNION { ?item wdt:P571 ?date. }
  FILTER(MONTH(?date)=${Number(md.slice(0,2))} && DAY(?date)=${Number(md.slice(3,5))} && YEAR(?date)=${year})
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT ${Math.min(300,limit)}
`;
  return cached(`wdday:${date}`,86400,async()=>{
    const json=await fetchJson(`${WDQS}?format=json&query=${encodeURIComponent(query)}`,{timeout:18000});
    return (json.results?.bindings||[]).map(b=>{
      const m=/Point\(([-\d.]+) ([-\d.]+)\)/.exec(b.coord?.value||'');if(!m)return null;
      const qid=(b.item?.value||'').split('/').pop();
      return normalizeEvent({id:`wd:${qid}`,title:b.itemLabel?.value||qid,date_start:(b.date?.value||'').slice(0,10),latitude:Number(m[2]),longitude:Number(m[1]),location_precision:'city',confidence_score:.7,importance_score:.6,sources:[{title:'Wikidata',url:b.item?.value}],categories:['events']});
    }).filter(Boolean);
  });
}
