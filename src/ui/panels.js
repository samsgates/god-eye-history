import { state, update } from '../core/state.js';
import { PRESENT_LAYERS } from '../present/present.js';
import { escapeHtml, toast } from '../core/utils.js';

const HIST_LAYERS=[
 ['events','Events'],['photos','Historical photos'],['maps','Historical maps'],['boundaries','Boundaries'],
 ['people','People'],['politics','Politics'],['conflict','Wars & conflicts'],['culture','Culture'],
 ['science','Science & technology'],['transport','Transport'],['disaster','Disasters'],['architecture','Architecture']
];

export class PanelManager{
  constructor({compare,present,story,annotations,globe,history}){
    this.deps={compare,present,story,annotations,globe,history};
    this.panel=document.getElementById('leftPanel');this.title=document.getElementById('leftPanelTitle');this.body=document.getElementById('leftPanelBody');
    document.querySelectorAll('.rail-btn').forEach(b=>b.onclick=()=>this.open(b.dataset.panel,b));
    document.querySelector('[data-close="left"]').onclick=()=>this.panel.classList.remove('open');
  }
  open(name,btn){
    document.querySelectorAll('.rail-btn').forEach(b=>b.classList.toggle('active',b===btn));
    this.panel.classList.add('open');
    this[name]?.();
  }
  layers(){
    this.title.textContent='Historical layers';
    this.body.innerHTML=`
      <div class="layer-group"><h3>HISTORY</h3>${HIST_LAYERS.map(([id,label])=>`<label class="toggle-row"><span>${label}</span><input type="checkbox" data-hlayer="${id}" ${state.historicalLayers.has(id)?'checked':''}></label>`).join('')}</div>
      <div class="layer-group"><h3>RADIUS</h3><input id="radiusRange" type="range" min=".1" max="100" step=".1" value="${state.radiusKm}" style="width:100%"><div class="muted"><span id="radiusValue">${state.radiusKm}</span> km around selected place</div></div>
      <div class="layer-group"><h3>DISCOVER</h3><div class="tool-grid">
        <button id="historicalMapBtn" class="tool-card"><b>Historical map</b><small>OHM time-filtered vectors</small></button>
        <button id="browseMediaBtn" class="tool-card"><b>Media</b><small>Photos, maps, archives</small></button>
        <button id="whatWasHereBtn" class="tool-card"><b>What was here?</b><small>Same place through time</small></button>
        <button id="heatmapBtn" class="tool-card"><b>Density</b><small>Historical heatmap mode</small></button>
      </div></div>
      <div class="layer-group"><h3>ERA EXPLORER</h3><div class="era-grid">
        ${[['ancient','Ancient'],['medieval','Medieval'],['earlymodern','Early modern'],['industrial','Industrial'],['ww1','World War I'],['interwar','Interwar'],['ww2','World War II'],['coldwar','Cold War'],['modern','Modern']].map(([id,label])=>`<button data-era="${id}">${label}</button>`).join('')}
      </div></div>`;
    this.body.querySelectorAll('[data-hlayer]').forEach(i=>i.onchange=()=>{
      i.checked?state.historicalLayers.add(i.dataset.hlayer):state.historicalLayers.delete(i.dataset.hlayer);
      const cats=[...state.historicalLayers].filter(x=>!['events','photos','maps','boundaries','people'].includes(x));state.filters.categories=cats;
      this.deps.history.loadEvents();
    });
    const r=this.body.querySelector('#radiusRange');r.oninput=()=>{state.radiusKm=Number(r.value);this.body.querySelector('#radiusValue').textContent=r.value};r.onchange=()=>this.deps.history.loadEvents();
    this.body.querySelector('#historicalMapBtn').onclick=async()=>{await this.deps.globe.setHistoricalMap(!this.deps.globe.imageryLayers.historical)};
    this.body.querySelector('#browseMediaBtn').onclick=()=>this.deps.exploration.browseMedia();
    this.body.querySelector('#whatWasHereBtn').onclick=()=>this.deps.exploration.whatWasHere();
    this.body.querySelector('#heatmapBtn').onclick=()=>this.deps.exploration.toggleHeatmap();
    this.body.querySelectorAll('[data-era]').forEach(b=>b.onclick=()=>this.deps.exploration.era(b.dataset.era));
  }
  compare(){
    this.title.textContent='Then ↔ Now';
    this.body.innerHTML=`
      <div class="layer-group"><h3>COMPARISON</h3>
        <button class="tool-card" data-compare="fade"><b>Fade comparison</b><small>Blend historical map with the present</small></button>
        <button class="tool-card" data-compare="split"><b>Synchronized compare</b><small>Uses historical overlay with synchronized camera state</small></button>
      </div>
      <div class="layer-group"><h3>HISTORY OPACITY</h3><input id="opacityRange" type="range" min="0" max="1" step=".05" value=".55" style="width:100%"></div>
      <button id="compareOff" class="ghost-btn wide">Turn comparison off</button>`;
    this.body.querySelectorAll('[data-compare]').forEach(b=>b.onclick=()=>this.deps.compare.enable(b.dataset.compare));
    this.body.querySelector('#opacityRange').oninput=e=>this.deps.compare.opacity(Number(e.target.value));
    this.body.querySelector('#compareOff').onclick=()=>this.deps.compare.disable();
  }
  async stories(){
    this.title.textContent='Historical stories';this.body.innerHTML='<div class="muted">Loading stories…</div>';
    try{
      const stories=await this.deps.story.list();
      this.body.innerHTML=stories.map(s=>`<button class="tool-card" style="width:100%;margin-bottom:8px" data-story="${escapeHtml(s.id)}"><b>${escapeHtml(s.title)}</b><small>${escapeHtml(s.summary)}</small></button>`).join('')+
        `<div class="tool-grid" style="margin-top:12px"><button id="prevScene" class="tool-card">‹ Previous</button><button id="nextScene" class="tool-card">Next ›</button></div>`;
      this.body.querySelectorAll('[data-story]').forEach(b=>b.onclick=()=>this.deps.story.start(b.dataset.story));
      this.body.querySelector('#prevScene').onclick=()=>this.deps.story.prev();
      this.body.querySelector('#nextScene').onclick=()=>this.deps.story.next();
    }catch(e){this.body.textContent=e.message}
  }
  present(){
    this.title.textContent='Present-day context';
    this.body.innerHTML=`<p class="muted">Original God's Eye View capabilities are kept separate from History Mode so live intelligence does not overwhelm historical exploration.</p>
      ${PRESENT_LAYERS.map(([id,label])=>`<label class="toggle-row"><span>${label}</span><input type="checkbox" data-player="${id}" ${state.presentLayers.has(id)?'checked':''}></label>`).join('')}`;
    this.body.querySelectorAll('[data-player]').forEach(i=>i.onchange=()=>this.deps.present.toggle(i.dataset.player,i.checked));
  }
  annotations(){
    this.title.textContent='Annotations';
    this.body.innerHTML=`<div class="tool-grid">
      <button id="notePoint" class="tool-card"><b>Place note</b><small>Date-aware point annotation</small></button>
      <button id="clearNotes" class="tool-card"><b>Clear</b><small>Remove local annotations</small></button>
      <button id="exportNotes" class="tool-card"><b>Export</b><small>GeoJSON</small></button>
      <button id="cleanMode" class="tool-card"><b>Clean mode</b><small>Hide interface for recording</small></button></div>`;
    this.body.querySelector('#notePoint').onclick=()=>this.deps.annotations.beginPoint();
    this.body.querySelector('#clearNotes').onclick=()=>this.deps.annotations.clear();
    this.body.querySelector('#exportNotes').onclick=()=>this.deps.annotations.export();
    this.body.querySelector('#cleanMode').onclick=()=>document.body.classList.toggle('clean-ui');
  }
  settings(){
    this.title.textContent='Settings';
    this.body.innerHTML=`
      <div class="layer-group"><h3>AI PROVIDER</h3>
        <select id="aiProvider" style="width:100%;padding:9px;border-radius:8px;background:#151922;border:1px solid var(--line)">
          ${['auto','openai','gemini','claude'].map(x=>`<option ${state.aiProvider===x?'selected':''}>${x}</option>`).join('')}
        </select>
      </div>
      <div class="layer-group"><h3>THEME</h3><div class="tool-grid">
        <button class="tool-card" data-theme="dark">Dark</button><button class="tool-card" data-theme="light">Light</button>
        <button class="tool-card" data-theme="archive">Archive</button><button class="tool-card" data-theme="system">System</button>
      </div></div>
      <div class="layer-group"><h3>GLOBE STYLE</h3><div class="tool-grid">
        <button class="tool-card" data-style="default">Default</button><button class="tool-card" data-style="night">Night</button>
        <button class="tool-card" data-style="archive">Archive</button><button class="tool-card" data-style="clean">Clean</button>
      </div></div>
      <div class="layer-group"><h3>MODERN 3D CONTEXT</h3>
        <button id="google3dBtn" class="tool-card" style="width:100%"><b>Google Photorealistic 3D</b><small>Requires a billing-enabled, domain-restricted Map Tiles API key</small></button>
      </div>`;
    this.body.querySelector('#aiProvider').onchange=e=>{state.aiProvider=e.target.value;localStorage.setItem('geh-ai-provider',state.aiProvider);document.getElementById('hudAi').textContent=state.aiProvider.toUpperCase()};
    this.body.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>this.applyTheme(b.dataset.theme));
    this.body.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>this.deps.globe.setStyle(b.dataset.style));
    this.body.querySelector('#google3dBtn').onclick=async()=>{try{const on=await this.deps.globe.toggleGoogle3D();toast(on?'Google Photorealistic 3D enabled':'Google Photorealistic 3D disabled')}catch(e){toast(e.message)}};
  }
  applyTheme(t){
    document.body.classList.remove('light','archive');
    if(t==='light')document.body.classList.add('light'); if(t==='archive')document.body.classList.add('archive');
    if(t==='system'&&matchMedia('(prefers-color-scheme:light)').matches)document.body.classList.add('light');
    localStorage.setItem('geh-theme',t);
  }
}
