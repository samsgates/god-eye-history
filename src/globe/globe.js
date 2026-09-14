import {
  Viewer, Ion, Cartesian3, Color, HeightReference, ScreenSpaceEventHandler,
  ScreenSpaceEventType, Cartographic, Math as CesiumMath, UrlTemplateImageryProvider,
  WebMapServiceImageryProvider, GeoJsonDataSource, CallbackProperty, JulianDate, HeadingPitchRange, Cesium3DTileset
} from 'cesium';
import { OHMVectorLayer } from '../history/ohm-vector.js';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { update, state } from '../core/state.js';

const markerColor = {
  politics: Color.fromCssColorString('#a998ff'),
  conflict: Color.fromCssColorString('#ff7d7d'),
  culture: Color.fromCssColorString('#ffbd69'),
  science: Color.fromCssColorString('#87f4ff'),
  disaster: Color.fromCssColorString('#ff8d66'),
  transport: Color.fromCssColorString('#77e5a4'),
  default: Color.fromCssColorString('#d6ff62')
};

export class HistoryGlobe {
  constructor(container, config={}){
    this.config=config;
    if(config.cesiumIonToken) Ion.defaultAccessToken=config.cesiumIonToken;
    this.viewer = new Viewer(container,{
      timeline:false, animation:false, baseLayerPicker:true, geocoder:false, homeButton:false,
      navigationHelpButton:false, sceneModePicker:false, fullscreenButton:false,
      infoBox:false, selectionIndicator:false, shouldAnimate:true
    });
    this.viewer.scene.globe.enableLighting=true;
    this.viewer.scene.requestRenderMode=true;
    this.viewer.scene.maximumRenderTimeChange=Infinity;
    this.eventEntities=new Map();
    this.heatmapMode=false;
    this.presentEntities=new Map();
    this.annotationEntities=[];
    this.google3DTileset=null;
    this.ohm=new OHMVectorLayer(this.viewer);
    this.imageryLayers={};
    this.clickHandler=new ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.onMapClick=null;
    this.onEventClick=null;
    this._wireClicks();
    this._wireCamera();
    this.setStyle('default');
  }
  _wireClicks(){
    this.clickHandler.setInputAction(async movement=>{
      const picked=this.viewer.scene.pick(movement.position);
      if(picked?.id?.properties?.eventId){
        const id=picked.id.properties.eventId.getValue();
        this.onEventClick?.(id); return;
      }
      const cartesian=this.viewer.camera.pickEllipsoid(movement.position,this.viewer.scene.globe.ellipsoid);
      if(!cartesian)return;
      const c=Cartographic.fromCartesian(cartesian);
      this.onMapClick?.({lat:CesiumMath.toDegrees(c.latitude),lng:CesiumMath.toDegrees(c.longitude)});
    },ScreenSpaceEventType.LEFT_CLICK);
  }
  _wireCamera(){
    this.viewer.camera.changed.addEventListener(()=>{
      const c=this.viewer.camera.positionCartographic;
      update({camera:{
        lat:CesiumMath.toDegrees(c.latitude),lng:CesiumMath.toDegrees(c.longitude),
        height:c.height,heading:this.viewer.camera.heading,pitch:this.viewer.camera.pitch,roll:this.viewer.camera.roll
      }});
      if(this.ohm.enabled){clearTimeout(this._ohmRefreshTimer);this._ohmRefreshTimer=setTimeout(()=>this.ohm.refresh(),350)}
    });
  }
  flyTo({lat,lng,height=22000,heading=0,pitch=-0.55}){
    return this.viewer.camera.flyTo({destination:Cartesian3.fromDegrees(lng,lat,height),orientation:{heading,pitch,roll:0},duration:1.8});
  }
  flyToEvent(event){
    this.flyTo({lat:event.latitude,lng:event.longitude,height:event.location_precision==='exact_point'?2500:12000});
  }
  renderEvents(events=[]){
    const keep=new Set(events.map(e=>String(e.id)));
    for(const [id,entity] of this.eventEntities) if(!keep.has(id)){this.viewer.entities.remove(entity);this.eventEntities.delete(id)}
    for(const event of events){
      const id=String(event.id); if(this.eventEntities.has(id))continue;
      const category=(event.categories?.[0]||'default').toLowerCase();
      const size=this.heatmapMode
        ? 5+Math.min(28,Math.max(0,(event.importance_score||.5)*24))
        : 7+Math.min(9,Math.max(0,(event.importance_score||.5)*10));
      const entity=this.viewer.entities.add({
        position:Cartesian3.fromDegrees(event.longitude,event.latitude,30),
        point:{pixelSize:size,color:markerColor[category]||markerColor.default,outlineColor:Color.BLACK,outlineWidth:2,heightReference:HeightReference.RELATIVE_TO_GROUND,disableDepthTestDistance:100000},
        label:{text:event.importance_score>.82?event.title:'',font:'11px sans-serif',fillColor:Color.WHITE,showBackground:true,backgroundColor:Color.fromBytes(8,10,15,190),pixelOffset:{x:0,y:-18},distanceDisplayCondition:{near:0,far:250000}},
        properties:{eventId:id,type:'history-event'}
      });
      this.eventEntities.set(id,entity);
    }
    this.viewer.scene.requestRender();
  }
  clearEvents(){ for(const e of this.eventEntities.values())this.viewer.entities.remove(e);this.eventEntities.clear() }
  setHeatmapMode(enabled){
    this.heatmapMode=!!enabled;
    const current=[...this.eventEntities.keys()];
    // Caller will naturally refresh events. Existing markers receive a quick visual density emphasis now.
    for(const entity of this.eventEntities.values()){
      if(entity.point)entity.point.pixelSize=this.heatmapMode?18:9;
    }
    this.viewer.scene.requestRender();
  }
  renderPresent(layer, items=[]){
    this.clearPresent(layer);
    const list=[];
    for(const item of items.slice(0,1200)){
      if(!Number.isFinite(item.latitude)||!Number.isFinite(item.longitude))continue;
      const e=this.viewer.entities.add({
        position:Cartesian3.fromDegrees(item.longitude,item.latitude,item.altitude||20),
        point:{pixelSize:6,color:Color.fromCssColorString(item.color||'#87f4ff'),outlineColor:Color.BLACK,outlineWidth:1,disableDepthTestDistance:100000},
        label:item.label?{text:item.label,font:'10px sans-serif',fillColor:Color.WHITE,pixelOffset:{x:0,y:-14},distanceDisplayCondition:{near:0,far:150000}}:undefined,
        properties:{presentLayer:layer,presentId:item.id||'',metadata:JSON.stringify(item)}
      });
      list.push(e);
    }
    this.presentEntities.set(layer,list); this.viewer.scene.requestRender();
  }
  clearPresent(layer){
    const list=this.presentEntities.get(layer)||[]; list.forEach(e=>this.viewer.entities.remove(e)); this.presentEntities.delete(layer);
  }
  clearAllPresent(){for(const k of [...this.presentEntities.keys()])this.clearPresent(k)}
  async setHistoricalMap(enabled){
    if(enabled){
      await this.ohm.enable();
      this.imageryLayers.historical={alpha:1,kind:'ohm-vector'};
    }else{
      this.ohm.disable();
      delete this.imageryLayers.historical;
    }
    this.viewer.scene.requestRender();
  }
  setHistoricalDate(year){this.ohm.setYear(year)}
  setHistoricalOpacity(v){
    // Vector history is rendered as geometry, so opacity is represented by entity visibility.
    // The comparison slider uses a soft global show/hide threshold rather than fabricating raster history.
    for(const e of this.ohm.entities)e.show=Number(v)>.04;
    if(this.imageryLayers.historical)this.imageryLayers.historical.alpha=Number(v);
    this.viewer.scene.requestRender();
  }

  async toggleGoogle3D(){
    if(this.google3DTileset){
      this.viewer.scene.primitives.remove(this.google3DTileset);
      this.google3DTileset=null;
      this.viewer.scene.globe.show=true;
      this.viewer.scene.requestRender();
      return false;
    }
    const key=this.config.googleMapsApiKey;
    if(!key)throw new Error('GOOGLE_MAPS_API_KEY is not configured');
    const tileset=await Cesium3DTileset.fromUrl(`https://tile.googleapis.com/v1/3dtiles/root.json?key=${encodeURIComponent(key)}`,{
      showCreditsOnScreen:true,
      maximumScreenSpaceError:16
    });
    this.viewer.scene.primitives.add(tileset);
    this.google3DTileset=tileset;
    this.viewer.scene.globe.show=false;
    this.viewer.scene.requestRender();
    return true;
  }

  setStyle(style){
    const s=this.viewer.scene;
    s.highDynamicRange=style!=='archive';
    s.globe.showGroundAtmosphere=style!=='clean';
    if(style==='night') s.backgroundColor=Color.fromCssColorString('#000308');
    else if(style==='archive') s.backgroundColor=Color.fromCssColorString('#18120b');
    else s.backgroundColor=Color.fromCssColorString('#05070a');
    s.requestRender();
  }
  addAnnotation(annotation){
    let entity;
    if(annotation.type==='point'){
      entity=this.viewer.entities.add({position:Cartesian3.fromDegrees(annotation.lng,annotation.lat),point:{pixelSize:10,color:Color.YELLOW},label:{text:annotation.text||'Note',font:'12px sans-serif',pixelOffset:{x:0,y:-18}}});
    }
    this.annotationEntities.push(entity); return entity;
  }
  clearAnnotations(){this.annotationEntities.forEach(e=>e&&this.viewer.entities.remove(e));this.annotationEntities=[]}
  trackEntity(entity){
    if(!entity)return; this.viewer.trackedEntity=entity;
  }
  stopTracking(){this.viewer.trackedEntity=undefined}
  destroy(){this.clickHandler.destroy();this.viewer.destroy()}
}
