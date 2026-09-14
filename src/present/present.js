import { api } from '../core/api.js';
import { state } from '../core/state.js';
import { toast } from '../core/utils.js';

export const PRESENT_LAYERS = [
  ['aircraft','Aircraft'],['vessels','Vessels'],['satellites','Satellites'],
  ['earthquakes','Earthquakes'],['fires','Fires'],['cctv','Public cameras'],
  ['traffic','Traffic'],['bikeshare','Bike share'],['infrastructure','Infrastructure']
];

export class PresentController{
  constructor(globe){this.globe=globe}
  async toggle(layer,on){
    if(!on){this.globe.clearPresent(layer);state.presentLayers.delete(layer);return}
    state.presentLayers.add(layer);
    try{
      const p=state.place||{lat:20,lng:0};
      const res=await api.present(layer,{lat:p.lat,lng:p.lng,radius:250});
      this.globe.renderPresent(layer,res.items||[]);
      if(res.notice)toast(res.notice);
    }catch(e){state.presentLayers.delete(layer);toast(`${layer}: ${e.message}`)}
  }
}
