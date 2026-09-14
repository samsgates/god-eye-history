import { api } from '../core/api.js';
import { state, update, setDate } from '../core/state.js';
import { fmtDate, escapeHtml, toast } from '../core/utils.js';

export class HistoryController{
  constructor(globe){
    this.globe=globe;
    this.eventList=document.getElementById('eventList');
    this.summary=document.getElementById('historySummary');
    this.title=document.getElementById('placeTitle');
    this.subtitle=document.getElementById('placeSubtitle');
    this.scope=document.getElementById('scopeLabel');
    this.detail=document.getElementById('eventDetail');
  }
  async selectPlace(place,{fly=true,load=true}={}){
    update({place});
    this.title.textContent=place.name||'Selected place';
    this.subtitle.textContent=[place.region,place.country].filter(Boolean).join(', ') || `${place.lat?.toFixed?.(4)}, ${place.lng?.toFixed?.(4)}`;
    this.scope.textContent='PLACE HISTORY';
    if(fly) this.globe.flyTo({lat:place.lat,lng:place.lng,height:place.type==='country'?1200000:32000});
    if(load) await this.loadEvents();
  }
  async mapClick({lat,lng}){
    try{
      const result=await api.reverse(lat,lng);
      const place=result.place||{name:`${lat.toFixed(3)}, ${lng.toFixed(3)}`,lat,lng,type:'point'};
      place.lat=lat; place.lng=lng;
      await this.selectPlace(place,{fly:false});
    }catch(e){
      await this.selectPlace({name:'Selected location',lat,lng,type:'point'},{fly:false});
    }
  }
  async loadEvents(extra={}){
    const p=state.place;
    if(!p)return;
    this.eventList.innerHTML='<div class="event-card">Searching historical records…</div>';
    const params={
      lat:p.lat,lng:p.lng,radius:state.radiusKm,start:state.selectedDate,end:state.selectedDate,
      categories:state.filters.categories.join(','),importance:state.filters.importance,...extra
    };
    try{
      const res=await api.events(params);
      update({events:res.events||[]});
      this.globe.renderEvents(state.events);
      this.renderEvents(res);
    }catch(e){
      this.eventList.innerHTML=`<div class="event-card"><h3>Could not load history</h3><p>${escapeHtml(e.message)}</p></div>`;
      toast('History source unavailable');
    }
  }
  renderEvents(res){
    const events=res.events||[];
    document.getElementById('hudEvents').textContent=events.length;
    document.getElementById('hudScope').textContent=(res.scope||'LOCAL').toUpperCase();
    this.summary.innerHTML=`
      <div class="summary-stat"><b>${events.length}</b><span>Events</span></div>
      <div class="summary-stat"><b>${res.media_count||0}</b><span>Media</span></div>
      <div class="summary-stat"><b>${Math.round((res.confidence||.65)*100)}%</b><span>Confidence</span></div>`;
    if(!events.length){
      this.eventList.innerHTML=`<div class="event-card"><h3>No exact records found</h3><p>Try a wider radius, broader year, or “Same day worldwide”. The system never invents missing events.</p></div>`;
      return;
    }
    this.eventList.innerHTML=events.map(e=>`
      <button class="event-card" data-event="${escapeHtml(e.id)}">
        <div class="meta"><span class="pill">${escapeHtml(e.date_precision||'year')}</span><span class="pill">${escapeHtml(e.location_precision||'city')}</span><span class="pill high">${Math.round((e.confidence_score||.6)*100)}% confidence</span></div>
        <h3>${escapeHtml(e.title)}</h3>
        <p>${escapeHtml(e.short_description||'')}</p>
      </button>`).join('');
    this.eventList.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>this.openEvent(b.dataset.event));
  }
  async openEvent(id){
    try{
      const data=await api.event(id); const e=data.event;
      update({selectedEvent:e}); this.globe.flyToEvent(e);
      this.detail.innerHTML=`
        <div class="event-hero">
          <div class="eyebrow">${escapeHtml((e.categories||[]).join(' · ')||'HISTORICAL EVENT')}</div>
          <h1>${escapeHtml(e.title)}</h1>
          <div class="muted">${escapeHtml(e.display_date||e.date_start||'Unknown date')} · ${escapeHtml(e.historical_place_name||e.modern_place_name||'')}</div>
          <p>${escapeHtml(e.full_description||e.short_description||'')}</p>
        </div>
        <div class="event-section"><h3>Why it matters</h3><p>${escapeHtml(e.significance||'Historical significance is derived from source coverage and context.')}</p></div>
        <div class="event-section"><h3>Confidence</h3><p>Date: ${escapeHtml(e.date_precision||'unknown')} · Location: ${escapeHtml(e.location_precision||'unknown')} · Overall: ${Math.round((e.confidence_score||.6)*100)}%</p></div>
        <div class="event-section"><h3>Sources</h3>${(e.sources||[]).map(s=>`<a class="source-link" target="_blank" rel="noopener" href="${escapeHtml(s.url)}">${escapeHtml(s.title||s.publisher||'Source')}</a>`).join('')||'<p class="muted">No source URL available.</p>'}</div>
        <div class="event-section"><button id="askAboutEvent" class="accent-btn">Ask about this</button></div>`;
      document.getElementById('eventDrawer').classList.add('open');
      document.getElementById('askAboutEvent').onclick=()=>{
        document.getElementById('askPanel').classList.add('open');
        document.getElementById('askInput').value=`Why is "${e.title}" historically important, and what happened next?`;
      };
    }catch(e){toast(e.message)}
  }
  async sameDayWorldwide(){
    try{
      const res=await api.day(state.selectedDate);
      update({events:res.events||[]}); this.globe.renderEvents(state.events); this.renderEvents({...res,scope:'global'});
      this.globe.flyTo({lat:20,lng:0,height:17500000});
      this.title.textContent=`World · ${fmtDate(state.selectedDate)}`; this.subtitle.textContent='Same day around the world';
    }catch(e){toast(e.message)}
  }
}
