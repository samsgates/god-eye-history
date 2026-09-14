export const fmtDate = d => {
  try { return new Intl.DateTimeFormat('en',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${d}T12:00:00Z`)).toUpperCase(); }
  catch { return d; }
};
export const escapeHtml = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
export const debounce=(fn,ms=250)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}};
export function toast(message, timeout=2800){
  const host=document.getElementById('toastHost'); const el=document.createElement('div');
  el.className='toast'; el.textContent=message; host.append(el); setTimeout(()=>el.remove(),timeout);
}
export function addDate(date, unit, amount=1){
  const d=new Date(`${date}T12:00:00Z`);
  if(unit==='day') d.setUTCDate(d.getUTCDate()+amount);
  else if(unit==='month') d.setUTCMonth(d.getUTCMonth()+amount);
  else if(unit==='year') d.setUTCFullYear(d.getUTCFullYear()+amount);
  else if(unit==='decade') d.setUTCFullYear(d.getUTCFullYear()+amount*10);
  return d.toISOString().slice(0,10);
}
export function confidenceClass(score){return score>=.8?'high':score>=.55?'medium':'low'}
