export function precisionFromDate(value=''){
  if(/^\d{4}-\d{2}-\d{2}/.test(value))return 'exact_day';
  if(/^\d{4}-\d{2}/.test(value))return 'month';
  if(/^\d{4}/.test(value))return 'year';
  return 'unknown';
}
export function normalizeEvent(e={}){
  const latitude=Number(e.latitude??e.lat);const longitude=Number(e.longitude??e.lng);
  return {
    id:String(e.id||e.wikidata_id||crypto.randomUUID()),slug:e.slug||'',
    title:e.title||'Untitled historical event',
    short_description:e.short_description||e.description||'',
    full_description:e.full_description||e.description||'',
    date_start:e.date_start||e.date||null,date_end:e.date_end||e.date_start||e.date||null,
    display_date:e.display_date||e.date_start||e.date||'',
    date_precision:e.date_precision||precisionFromDate(e.date_start||e.date||''),
    date_confidence:Number(e.date_confidence??.7),
    latitude:Number.isFinite(latitude)?latitude:0,longitude:Number.isFinite(longitude)?longitude:0,
    location_precision:e.location_precision||'city',location_confidence:Number(e.location_confidence??.65),
    historical_place_name:e.historical_place_name||e.place||'',modern_place_name:e.modern_place_name||e.place||'',
    country:e.country||'',region:e.region||'',city:e.city||'',
    categories:Array.isArray(e.categories)?e.categories:(e.category?[e.category]:[]),
    importance_score:Number(e.importance_score??.55),confidence_score:Number(e.confidence_score??.65),
    persons:e.persons||[],organizations:e.organizations||[],places:e.places||[],
    media:e.media||[],sources:e.sources||[],significance:e.significance||''
  };
}
export function scoreEvent(event,{lat,lng,start}={}){
  let score=Number(event.importance_score||.5)*.35+Number(event.confidence_score||.5)*.35;
  if(event.sources?.length>1)score+=.12;if(event.media?.length)score+=.05;
  if(event.date_precision==='exact_day')score+=.08;if(event.location_precision==='exact_point'||event.location_precision==='building')score+=.05;
  return Math.min(1,score);
}
