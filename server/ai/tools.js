import { searchEvents, eventById, sameDay, mediaFor } from '../history/search.js';
import { searchPlaces } from '../places.js';

export const toolDefinitions = [
  {name:'search_places',description:'Resolve a place name to coordinates.',input_schema:{type:'object',properties:{query:{type:'string'}},required:['query']}},
  {name:'search_historical_events',description:'Search verified historical events by coordinates and date.',input_schema:{type:'object',properties:{lat:{type:'number'},lng:{type:'number'},radius:{type:'number'},start:{type:'string'},end:{type:'string'},categories:{type:'string'}},required:['lat','lng','start']}},
  {name:'search_same_day_worldwide',description:'Find historical events worldwide on an exact date.',input_schema:{type:'object',properties:{date:{type:'string'}},required:['date']}},
  {name:'get_event_details',description:'Get a canonical historical event by ID.',input_schema:{type:'object',properties:{id:{type:'string'}},required:['id']}},
  {name:'get_historical_media',description:'Find historical photographs and cultural media around a place.',input_schema:{type:'object',properties:{lat:{type:'number'},lng:{type:'number'},radius:{type:'number'},query:{type:'string'}},required:['lat','lng']}}
];

export async function runTool(name,args){
  if(name==='search_places')return searchPlaces(args.query);
  if(name==='search_historical_events')return searchEvents(args);
  if(name==='search_same_day_worldwide')return sameDay(args.date);
  if(name==='get_event_details')return {event:await eventById(args.id)};
  if(name==='get_historical_media')return {items:await mediaFor(args)};
  throw new Error(`Unknown tool: ${name}`);
}
