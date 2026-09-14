async function request(path, options={}){
  const response = await fetch(path, {
    ...options,
    headers: {'content-type':'application/json', ...(options.headers||{})}
  });
  const data = await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data;
}
export const api = {
  config: ()=>request('/api/config'),
  searchPlaces: q=>request(`/api/places/search?q=${encodeURIComponent(q)}`),
  reverse: (lat,lng)=>request(`/api/places/reverse?lat=${lat}&lng=${lng}`),
  events: params=>request(`/api/history/events?${new URLSearchParams(params)}`),
  event: id=>request(`/api/history/events/${encodeURIComponent(id)}`),
  day: date=>request(`/api/history/day/${encodeURIComponent(date)}`),
  timeline: params=>request(`/api/history/timeline?${new URLSearchParams(params)}`),
  compare: params=>request(`/api/history/compare?${new URLSearchParams(params)}`),
  media: params=>request(`/api/history/media?${new URLSearchParams(params)}`),
  placeHistory: id=>request(`/api/history/place/${encodeURIComponent(id)}`),
  whatWasHere: params=>request(`/api/history/what-was-here?${new URLSearchParams(params)}`),
  related: id=>request(`/api/history/events/${encodeURIComponent(id)}/related`),
  people: params=>request(`/api/history/people?${new URLSearchParams(params)}`),
  ask: body=>request('/api/ai/history',{method:'POST',body:JSON.stringify(body)}),
  present: (layer,params={})=>request(`/api/present/${layer}?${new URLSearchParams(params)}`),
  stories: ()=>request('/api/stories'),
  story: id=>request(`/api/stories/${id}`),
  thisDay: monthDay=>request(`/api/history/this-day/${monthDay}`),
  health: ()=>request('/health')
};
