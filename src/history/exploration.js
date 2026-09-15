import { api } from '../core/api.js';
import { state, update } from '../core/state.js';
import { escapeHtml, toast } from '../core/utils.js';

export class ExplorationController{
  constructor(globe,history){this.globe=globe;this.history=history}
  async whatWasHere(){
    const p=state.place;if(!p)return toast('Select a place first');
    this.history.resetContext();const loadVersion=this.history.loadVersion;
    update({historyScope:'through-time',dateRange:{start:'1000-01-01',end:'2026-01-01'}});
    this.history.eventList.innerHTML='<div class="event-card">Searching this place through time…</div>';
    try{
      const j=await api.whatWasHere({lat:p.lat,lng:p.lng,radius:state.radiusKm});
      if(loadVersion!==this.history.loadVersion)return;
      update({events:j.events||[]});this.globe.renderEvents(state.events);this.history.renderEvents({...j,scope:'through time'});
      document.getElementById('placeTitle').textContent=`What was here? · ${p.name}`;
      document.getElementById('placeSubtitle').textContent='Historical records across time';
    }catch(e){if(loadVersion===this.history.loadVersion)toast(e.message)}
  }
  async era(era){
    const ranges={
      ancient:['0001-01-01','0500-12-31'],medieval:['0500-01-01','1500-12-31'],
      earlymodern:['1500-01-01','1800-12-31'],industrial:['1760-01-01','1914-12-31'],
      ww1:['1914-07-28','1918-11-11'],interwar:['1918-11-12','1939-09-01'],
      ww2:['1939-09-01','1945-09-02'],coldwar:['1947-01-01','1991-12-31'],modern:['1991-01-01','2026-12-31']
    };
    const p=state.place;if(!p)return toast('Select a place first');
    const [start,end]=ranges[era]||ranges.modern;
    this.history.resetContext();const loadVersion=this.history.loadVersion;
    update({historyScope:'place',dateRange:{start,end}});
    this.history.eventList.innerHTML='<div class="event-card">Searching this historical era…</div>';
    try{
      const res=await api.events({lat:p.lat,lng:p.lng,radius:Math.max(state.radiusKm,25),start,end});
      if(loadVersion!==this.history.loadVersion)return;
      update({events:res.events||[]});this.globe.renderEvents(state.events);this.history.renderEvents({...res,scope:era});
    }catch(e){if(loadVersion===this.history.loadVersion)toast(e.message)}
  }
  async browseMedia(){
    const p=state.place;if(!p)return toast('Select a place first');
    const panel=document.getElementById('leftPanelBody');panel.innerHTML='<div class="muted">Loading historical media…</div>';
    try{
      const r=await api.media({lat:p.lat,lng:p.lng,radius:Math.min(10000,state.radiusKm*1000),query:`${p.name} ${state.selectedYear}`});
      panel.innerHTML=`<div class="media-grid">${(r.items||[]).map(m=>`
        <a class="media-card" href="${escapeHtml(m.url||'#')}" target="_blank" rel="noopener">
          ${m.thumbnail?`<img src="${escapeHtml(m.thumbnail)}" loading="lazy" alt="${escapeHtml(m.title||'Historical media')}">`:''}
          <b>${escapeHtml(m.title||'Historical media')}</b>
          <small>${escapeHtml(m.date||m.year||m.provider||m.source||'')} ${m.license?`· ${escapeHtml(m.license)}`:''}</small>
        </a>`).join('')||'<div class="muted">No nearby media found.</div>'}</div>`;
    }catch(e){panel.textContent=e.message}
  }
  toggleHeatmap(){
    const next=!this.globe.heatmapMode;this.globe.setHeatmapMode(next);toast(next?'Historical density mode on':'Historical density mode off');
  }
}
