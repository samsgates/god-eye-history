import { VectorTile } from '@mapbox/vector-tile';
import { PbfReader } from 'pbf';
import { Cartesian3, Color, PolygonHierarchy } from 'cesium';

function lon2tile(lon,z){return Math.floor((lon+180)/360*Math.pow(2,z))}
function lat2tile(lat,z){return Math.floor((1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*Math.pow(2,z))}
function normalizeTile(x,z){const n=2**z;return ((x%n)+n)%n}
function visibleAt(props,year){
  const start=Number(props.start_decdate ?? props.start_date ?? -99999);
  const end=Number(props.end_decdate ?? props.end_date ?? 99999);
  const a=Number.isFinite(start)?start:-99999,b=Number.isFinite(end)?end:99999;
  return year>=a && year<=b;
}
function featureColor(props){
  const f=String(props.highway||props.railway||props.boundary||props.building||props.waterway||'').toLowerCase();
  if(f.includes('rail')) return Color.fromCssColorString('#f0b76c').withAlpha(.85);
  if(props.boundary) return Color.fromCssColorString('#b69cff').withAlpha(.85);
  if(props.building) return Color.fromCssColorString('#e8d6a4').withAlpha(.20);
  if(props.highway) return Color.fromCssColorString('#e4d0a1').withAlpha(.75);
  return Color.fromCssColorString('#87f4ff').withAlpha(.60);
}

export class OHMVectorLayer {
  constructor(viewer){
    this.viewer=viewer;this.enabled=false;this.year=1960;this.entities=[];this.abort=null;this.lastKey='';
  }
  setYear(year){this.year=Number(year)||1960;if(this.enabled)this.refresh(true)}
  async enable(){this.enabled=true;await this.refresh(true)}
  disable(){this.enabled=false;this.abort?.abort();this.clear()}
  clear(){this.entities.forEach(e=>this.viewer.entities.remove(e));this.entities=[];this.lastKey='';this.viewer.scene.requestRender()}
  zoomForHeight(h){
    if(h>6000000)return 3;if(h>2500000)return 4;if(h>900000)return 5;if(h>300000)return 6;
    if(h>120000)return 8;if(h>50000)return 10;if(h>15000)return 12;return 14;
  }
  async refresh(force=false){
    if(!this.enabled)return;
    const c=this.viewer.camera.positionCartographic;
    const lat=c.latitude*180/Math.PI,lng=c.longitude*180/Math.PI,z=this.zoomForHeight(c.height);
    const cx=lon2tile(lng,z),cy=lat2tile(lat,z),key=`${z}:${cx}:${cy}:${this.year}`;
    if(!force&&key===this.lastKey)return;this.lastKey=key;
    this.abort?.abort();this.abort=new AbortController();const signal=this.abort.signal;
    const tiles=[];
    const radius=z>=12?1:0;
    for(let dx=-radius;dx<=radius;dx++)for(let dy=-radius;dy<=radius;dy++)tiles.push([normalizeTile(cx+dx,z),Math.max(0,cy+dy)]);
    try{
      const buffers=await Promise.all(tiles.map(async([x,y])=>{
        const r=await fetch(`https://vtiles.openhistoricalmap.org/maps/ohm/${z}/${x}/${y}.pbf`,{signal});
        if(!r.ok)throw new Error(`OHM ${r.status}`);return {x,y,buf:await r.arrayBuffer()};
      }));
      if(signal.aborted)return;
      this.clear();let budget=1400;
      for(const t of buffers){
        const tile=new VectorTile(new PbfReader(t.buf));
        for(const layer of Object.values(tile.layers||{})){
          for(let i=0;i<layer.length && budget>0;i++){
            const f=layer.feature(i);const props=f.properties||{};if(!visibleAt(props,this.year))continue;
            const gj=f.toGeoJSON(t.x,t.y,z);const color=featureColor(props);
            if(gj.geometry?.type==='LineString'){
              const pos=gj.geometry.coordinates.map(([lon,lat])=>Cartesian3.fromDegrees(lon,lat,8));
              if(pos.length>1){this.entities.push(this.viewer.entities.add({polyline:{positions:pos,width:props.boundary?2:1.4,material:color,clampToGround:true}}));budget--}
            } else if(gj.geometry?.type==='MultiLineString'){
              for(const line of gj.geometry.coordinates.slice(0,4)){
                const pos=line.map(([lon,lat])=>Cartesian3.fromDegrees(lon,lat,8));
                if(pos.length>1){this.entities.push(this.viewer.entities.add({polyline:{positions:pos,width:1.2,material:color,clampToGround:true}}));budget--;if(budget<=0)break}
              }
            } else if(gj.geometry?.type==='Polygon' && props.building){
              const ring=gj.geometry.coordinates?.[0]||[];
              if(ring.length>3&&ring.length<300){this.entities.push(this.viewer.entities.add({polygon:{hierarchy:new PolygonHierarchy(ring.map(([lon,lat])=>Cartesian3.fromDegrees(lon,lat))),material:color,outline:true,outlineColor:color.withAlpha(.55),height:2}}));budget--}
            }
          }
        }
      }
      this.viewer.scene.requestRender();
    }catch(e){if(e.name!=='AbortError')console.warn('OHM vector layer:',e.message)}
  }
}
