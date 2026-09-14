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
  const timeline=new TimelineController(()=>state.place&&history.loadEvents(),globe);
  const compare=new CompareController(globe);
  const present=new PresentController(globe);
  const annotations=new AnnotationController(globe);
  const exploration=new ExplorationController(globe,history);
  const chat=new HistoryChat();
  const story=new StoryDirector(globe,history);
  const panels=new PanelManager({compare,present,story,annotations,globe,history,exploration});

  globe.onMapClick=async pos=>{
    if(annotations.onMapClick(pos))return;
    await history.mapClick(pos);
  };
  globe.onEventClick=id=>history.openEvent(id);

  globe.flyTo({lat:20,lng:0,height:17500000});

  document.getElementById('searchForm').onsubmit=async e=>{
    e.preventDefault();const q=document.getElementById('searchInput').value.trim();if(!q)return;
    try{
      const res=await api.searchPlaces(q);
      if(res.intent?.date) timeline.applyDate(res.intent.date);
      const place=res.places?.[0];if(place)await history.selectPlace(place);
      else toast('No matching place found');
    }catch(err){toast(err.message)}
  };
  document.getElementById('askBtn').onclick=()=>chat.open();
  document.getElementById('closeAsk').onclick=()=>chat.close();
  document.getElementById('sameDayBtn').onclick=()=>history.sameDayWorldwide();
  document.getElementById('closeHistory').onclick=()=>document.getElementById('historyPanel').classList.toggle('hidden');
  document.getElementById('closeEvent').onclick=()=>document.getElementById('eventDrawer').classList.remove('open');
  document.getElementById('surpriseBtn').onclick=async()=>{
    const choices=['Rome 44 BC','London 1666','Delhi 1947','Berlin 1989','Pompeii 79 AD','Paris 1789'];
    const q=choices[Math.floor(Math.random()*choices.length)];
    document.getElementById('searchInput').value=q;document.getElementById('searchForm').requestSubmit();
  };
  document.addEventListener('keydown',e=>{
    if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();document.getElementById('searchInput').focus()}
    if(e.key==='Escape'){chat.close();document.getElementById('eventDrawer').classList.remove('open');document.getElementById('leftPanel').classList.remove('open')}
  });

  // share state
  const params=new URLSearchParams(location.search);
  if(params.get('share')){
    try{
      const s=JSON.parse(atob(params.get('share')));
      if(s.date)timeline.applyDate(s.date);
      if(s.place)await history.selectPlace(s.place);
    }catch{}
  }
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
      const res=await api.thisDay(md).catch(()=>({events:[]}));update({events:res.events||[]});globe.renderEvents(state.events);history.renderEvents({...res,scope:'global'});
    }
  });
  if(localStorage.getItem('geh-onboarded'))first.classList.add('hidden');

  panels.applyTheme(localStorage.getItem('geh-theme')||'dark');
  document.getElementById('hudAi').textContent=state.aiProvider.toUpperCase();

  const initial=await api.searchPlaces('London').catch(()=>({places:[]}));
  if(initial.places?.[0]) await history.selectPlace(initial.places[0]);

  console.info('god-eye-history ready', {provider:state.aiProvider, config});
}
boot().catch(err=>{
  console.error(err);
  document.getElementById('toastHost').innerHTML=`<div class="toast">Startup error: ${err.message}</div>`;
});
