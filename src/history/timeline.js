import { state, setDate, update } from '../core/state.js';
import { addDate, fmtDate } from '../core/utils.js';

export class TimelineController{
  constructor(onDateChange, globe=null){
    this.onDateChange=onDateChange;this.globe=globe;
    this.dateInput=document.getElementById('dateInput');
    this.slider=document.getElementById('yearSlider');
    this.play=document.getElementById('playTimeline');
    this.speed=document.getElementById('timelineSpeed');
    this.timer=null;
    this.dateInput.addEventListener('change',()=>this.applyDate(this.dateInput.value));
    this.slider.addEventListener('input',()=>{
      const year=Number(this.slider.value);
      if(year<=0) return;
      const current=state.selectedDate.split('-');
      this.applyDate(`${String(year).padStart(4,'0')}-${current[1]}-${current[2]}`);
    });
    document.getElementById('prevDate').onclick=()=>this.applyDate(addDate(state.selectedDate,'year',-1));
    document.getElementById('nextDate').onclick=()=>this.applyDate(addDate(state.selectedDate,'year',1));
    this.play.onclick=()=>this.toggle();
  }
  applyDate(date,{notify=true}={}){
    if(!date)return;
    setDate(date);
    update({dateRange:{start:date,end:date}});
    this.dateInput.value=date;
    this.slider.value=Math.max(-500,Math.min(2026,Number(date.slice(0,4))));
    document.getElementById('hudDate').textContent=fmtDate(date);
    if(this.globe) this.globe.setHistoricalDate(Number(date.slice(0,4)));
    if(notify)this.onDateChange?.(date);
  }
  toggle(){
    if(this.timer){this.stop();return}
    this.play.textContent='Ⅱ'; update({playing:true});
    this.timer=setInterval(()=>{
      const next=addDate(state.selectedDate,this.speed.value,1);
      if(Number(next.slice(0,4))>2026){this.toggle();return}
      this.applyDate(next);
    },1000);
  }
  stop(){
    if(this.timer)clearInterval(this.timer);
    this.timer=null;this.play.textContent='▶';update({playing:false});
  }
}
