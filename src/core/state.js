const listeners = new Set();

export const state = {
  mode: 'history',
  selectedDate: '1960-08-15',
  selectedYear: 1960,
  dateRange: {start:'1960-08-15',end:'1960-08-15'},
  historyScope: 'place',
  place: null,
  camera: null,
  events: [],
  selectedEvent: null,
  historicalLayers: new Set(['events', 'photos']),
  presentLayers: new Set(),
  comparison: { enabled: false, mode: 'swipe', historicalDate: '1960-08-15' },
  aiProvider: localStorage.getItem('geh-ai-provider') || 'auto',
  radiusKm: 15,
  filters: { categories: [], importance: 0 },
  playing: false,
  annotations: [],
  story: null
};

export function subscribe(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }
export function update(patch){
  Object.assign(state, patch);
  for (const fn of listeners) fn(state, patch);
}
export function setDate(date){
  const y = Number(String(date).slice(0,4));
  update({selectedDate: date, selectedYear: Number.isFinite(y) ? y : state.selectedYear});
}
export function serializeState(){
  return {
    mode: state.mode,
    scope: state.historyScope,
    date: state.selectedDate,
    dateRange: state.dateRange,
    place: state.place ? {name:state.place.name, lat:state.place.lat, lng:state.place.lng, id:state.place.id}:null,
    camera: state.camera,
    layers:[...state.historicalLayers],
    present:[...state.presentLayers],
    radiusKm: state.radiusKm,
    eventId: state.selectedEvent?.id || null
  };
}
