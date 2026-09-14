import { state, update } from '../core/state.js';

export class CompareController{
  constructor(globe){this.globe=globe}
  async enable(mode='fade'){
    update({comparison:{...state.comparison,enabled:true,mode}});
    await this.globe.setHistoricalMap(true);
    if(mode==='fade') this.globe.setHistoricalOpacity(.55);
  }
  disable(){
    update({comparison:{...state.comparison,enabled:false}});
    this.globe.setHistoricalMap(false);
  }
  opacity(v){this.globe.setHistoricalOpacity(v)}
}
