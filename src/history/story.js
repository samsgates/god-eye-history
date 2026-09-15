import { api } from '../core/api.js';
import { update } from '../core/state.js';
import { toast } from '../core/utils.js';

export class StoryDirector{
  constructor(globe,history,timeline){this.globe=globe;this.history=history;this.timeline=timeline;this.timer=null;this.index=0;this.story=null}
  async list(){return (await api.stories()).stories||[]}
  async start(id){
    this.timeline.stop();
    const res=await api.story(id); this.story=res.story; this.index=0; update({story:this.story});
    await this.playScene(0); toast(`Story started: ${this.story.title}`);
  }
  async playScene(index){
    if(!this.story?.scenes?.[index])return;
    this.index=index; const s=this.story.scenes[index];
    if(s.date)this.timeline.applyDate(s.date,{notify:false});
    if(s.place) await this.history.selectPlace(s.place,{fly:false,load:false});
    if(s.place)document.getElementById('searchInput').value=`${s.place.name}${s.date?` ${s.date.slice(0,4)}`:''}`;
    if(s.camera) await this.globe.flyTo(s.camera);
    else if(s.place) await this.globe.flyTo({lat:s.place.lat,lng:s.place.lng,height:s.height||18000});
    if(s.date&&s.place) await this.history.loadEvents();
    if(s.narration){
      document.getElementById('askPanel').classList.add('open');
      const chat=document.getElementById('chatMessages');
      chat.insertAdjacentHTML('beforeend',`<div class="chat assistant"><b>${this.story.title}</b><br>${s.narration}</div>`);
      chat.scrollTop=chat.scrollHeight;
    }
  }
  next(){return this.playScene(Math.min(this.story.scenes.length-1,this.index+1))}
  prev(){return this.playScene(Math.max(0,this.index-1))}
}
