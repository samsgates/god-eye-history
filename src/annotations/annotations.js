import { state, update } from '../core/state.js';
import { toast } from '../core/utils.js';

export class AnnotationController{
  constructor(globe){this.globe=globe;this.pending=false}
  beginPoint(){
    this.pending=true; toast('Click the globe to place a historical note');
  }
  onMapClick(pos){
    if(!this.pending)return false;
    const text=prompt('Annotation text')||'Historical note';
    const annotation={id:crypto.randomUUID(),type:'point',lat:pos.lat,lng:pos.lng,text,valid_from:state.selectedDate,valid_to:null};
    state.annotations.push(annotation);this.globe.addAnnotation(annotation);this.pending=false;update({annotations:state.annotations});
    return true;
  }
  clear(){state.annotations.length=0;this.globe.clearAnnotations();update({annotations:state.annotations})}
  export(){
    const blob=new Blob([JSON.stringify({type:'FeatureCollection',features:state.annotations.map(a=>({type:'Feature',properties:{text:a.text,valid_from:a.valid_from,valid_to:a.valid_to},geometry:{type:'Point',coordinates:[a.lng,a.lat]}}))},null,2)],{type:'application/geo+json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='god-eye-history-annotations.geojson';a.click();URL.revokeObjectURL(a.href);
  }
}
