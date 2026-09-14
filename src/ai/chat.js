import { api } from '../core/api.js';
import { state } from '../core/state.js';
import { escapeHtml, toast } from '../core/utils.js';

export class HistoryChat{
  constructor(){
    this.panel=document.getElementById('askPanel');
    this.messages=document.getElementById('chatMessages');
    this.form=document.getElementById('askForm');
    this.input=document.getElementById('askInput');
    this.form.addEventListener('submit',e=>{e.preventDefault();this.ask(this.input.value)});
    document.querySelectorAll('.quick-prompts button').forEach(b=>b.onclick=()=>{this.input.value=b.textContent;this.ask(b.textContent)});
    this.setupVoice();
  }
  open(){this.panel.classList.add('open');this.input.focus()}
  close(){this.panel.classList.remove('open')}
  async ask(question){
    question=question?.trim();if(!question)return;
    this.messages.insertAdjacentHTML('beforeend',`<div class="chat user">${escapeHtml(question)}</div>`);
    this.input.value='';
    const pending=document.createElement('div');pending.className='chat assistant';pending.textContent='Retrieving historical evidence…';this.messages.append(pending);this.messages.scrollTop=this.messages.scrollHeight;
    try{
      const res=await api.ask({
        question,provider:state.aiProvider,
        context:{
          date:state.selectedDate,
          place:state.place,
          event:state.selectedEvent?{id:state.selectedEvent.id,title:state.selectedEvent.title}:null,
          camera:state.camera,
          activeLayers:[...state.historicalLayers]
        }
      });
      pending.innerHTML=`${escapeHtml(res.answer||'No answer returned.').replace(/\n/g,'<br>')}
        ${(res.sources||[]).length?`<div class="sources"><b>Sources</b><br>${res.sources.map(s=>`<a target="_blank" rel="noopener" class="source-link" href="${escapeHtml(s.url)}">${escapeHtml(s.title||'Source')}</a>`).join('')}</div>`:''}
        <div class="sources">Provider: ${escapeHtml(res.provider||'retrieval-only')} · Confidence: ${Math.round((res.confidence||.5)*100)}%</div>`;
    }catch(e){pending.textContent=`Unable to answer: ${e.message}`}
    this.messages.scrollTop=this.messages.scrollHeight;
  }
  setupVoice(){
    const btn=document.getElementById('voiceBtn');
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){btn.onclick=()=>toast('Browser speech recognition is unavailable. OpenAI Realtime and Gemini Live adapters are available through the server integration.');return}
    const rec=new SR();rec.lang='en-US';rec.interimResults=false;
    rec.onresult=e=>{this.input.value=e.results[0][0].transcript;this.ask(this.input.value)};
    rec.onstart=()=>{btn.textContent='●'};rec.onend=()=>{btn.textContent='◉'};
    btn.onclick=()=>rec.start();
  }
}
