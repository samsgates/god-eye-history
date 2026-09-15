import './styles.css';
import { api } from './core/api.js';
import { state, update, serializeState } from './core/state.js';
import { toast } from './core/utils.js';
import { HistoryGlobe } from './globe/globe.js';
import { HistoryController } from './history/history-controller.js';
import { TimelineController } from './history/timeline.js';
import { CompareController } from './history/compare.js';
import { StoryDirector } from './history/story.js';
import { ExplorationController } from './history/exploration.js';
import { PresentController } from './present/present.js';
import { AnnotationController } from './annotations/annotations.js';
import { HistoryChat } from './ai/chat.js';
import { PanelManager } from './ui/panels.js';

async function boot(){
  const config=await api.config().catch(()=>({}));
  const globe=new HistoryGlobe('cesiumContainer',config);
  const history=new HistoryController(globe);
  const timeline=new TimelineController(()=>state.historyScope==='global'?history.sameDayWorldwide():state.place&&history.loadEvents(),globe);
  const compare=new CompareController(globe);
  const present=new PresentController(globe);
  const annotations=new AnnotationController(globe);
  const exploration=new ExplorationController(globe,history);
  const chat=new HistoryChat();
  const story=new StoryDirector(globe,history,timeline);
  const panels=new PanelManager({compare,present,story,annotations,globe,history,exploration});

  globe.onMapClick=async pos=>{
    if(annotations.onMapClick(pos))return;
    await history.mapClick(pos);
  };
  globe.onEventClick=id=>history.openEvent(id);

  globe.flyTo({lat:20,lng:0,height:17500000});

  let searchVersion=0;
  document.getElementById('searchForm').onsubmit=async e=>{
    e.preventDefault();const q=document.getElementById('searchInput').value.trim();if(!q)return;
    timeline.stop();
    const version=++searchVersion;history.beginSearch(q);
    try{
      const res=await api.searchPlaces(q);
      if(version!==searchVersion)return;
      const place=res.places?.[0];
      if(res.intent?.date) timeline.applyDate(res.intent.date,{notify:false});
      if(place){
        if(res.intent?.start)update({dateRange:{start:res.intent.start,end:res.intent.end}});
        await history.selectPlace(place,{load:false});
        await history.loadEvents(res.intent?.start?{start:res.intent.start,end:res.intent.end}:{});
      }
      else{history.showSearchFailure(q);toast('No matching place found')}
    }catch(err){if(version===searchVersion){history.showSearchFailure(q,'Search unavailable');toast(err.message)}}
  };
  document.getElementById('askBtn').onclick=()=>chat.open();
  document.getElementById('closeAsk').onclick=()=>chat.close();
  document.getElementById('sameDayBtn').onclick=()=>history.sameDayWorldwide();
  document.getElementById('closeHistory').onclick=()=>document.getElementById('historyPanel').classList.toggle('hidden');
  document.getElementById('closeEvent').onclick=()=>history.closeEvent();
  document.getElementById('surpriseBtn').onclick=async()=>{
    const choices=['Rome 64 AD','London 1666','Delhi 1947','Berlin 1989','Pompeii 79 AD','Paris 1789'];
    const q=choices[Math.floor(Math.random()*choices.length)];
    document.getElementById('searchInput').value=q;document.getElementById('searchForm').requestSubmit();
  };
  document.addEventListener('keydown',e=>{
    if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();document.getElementById('searchInput').focus()}
    if(e.key==='Escape'){chat.close();history.closeEvent();document.getElementById('leftPanel').classList.remove('open')}
  });

  // share state
  const params=new URLSearchParams(location.search);
  let restoredShare=false;
  if(params.get('share')){
    try{
      const s=JSON.parse(atob(params.get('share')));
      if(s.date)timeline.applyDate(s.date,{notify:false});
      if(s.dateRange?.start&&s.dateRange?.end)update({dateRange:s.dateRange});
      if(s.scope)update({historyScope:s.scope});
      if(s.radiusKm)update({radiusKm:Number(s.radiusKm)});
      if(s.place){await history.selectPlace(s.place,{load:s.scope!=='global'});restoredShare=true}
      if(s.scope==='global'){await history.sameDayWorldwide();restoredShare=true}
      if(s.camera)await globe.flyTo(s.camera);
      if(s.eventId)await history.openEvent(s.eventId);
    }catch{}
  }
  document.addEventListener('history-context-changed',()=>{
    if(location.search)new URL(location.href).searchParams.has('share')&&globalThis.history.replaceState(null,'',location.pathname);
  });
  document.getElementById('brandButton').onclick=()=>{
    const url=new URL(location.href);url.search='';url.searchParams.set('share',btoa(JSON.stringify(serializeState())));navigator.clipboard?.writeText(url.href);toast('Shareable view copied');
  };

  // first-run journeys
  const first=document.getElementById('firstRun');
  const closeFirst=()=>{first.classList.add('hidden');localStorage.setItem('geh-onboarded','1')};
  document.getElementById('skipFirstRun').onclick=closeFirst;
  document.querySelectorAll('[data-journey]').forEach(b=>b.onclick=async()=>{
    const j=b.dataset.journey;closeFirst();
    if(j==='place')document.getElementById('searchInput').focus();
    if(j==='time')document.getElementById('dateInput').showPicker?.();
    if(j==='story'){document.querySelector('[data-panel="stories"]').click()}
    if(j==='today'){
      const now=new Date();const md=`${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      await history.thisDay(md);
    }
  });
  if(localStorage.getItem('geh-onboarded'))first.classList.add('hidden');

  panels.applyTheme(localStorage.getItem('geh-theme')||'dark');
  document.getElementById('hudAi').textContent=state.aiProvider.toUpperCase();

  if(!restoredShare&&searchVersion===0&&!state.place){
    const initial=await api.searchPlaces('London').catch(()=>({places:[]}));
    if(searchVersion===0&&!state.place&&initial.places?.[0]) await history.selectPlace(initial.places[0]);
  }

  console.info('god-eye-history ready', {provider:state.aiProvider, config});
}
boot().catch(err=>{
  console.error(err);
  document.getElementById('toastHost').innerHTML=`<div class="toast">Startup error: ${err.message}</div>`;
});
