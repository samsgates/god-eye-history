import { europeanaSearch } from '../server/sources/europeana.js';
const query=process.argv.slice(2).join(' ')||'London 1960';
const items=await europeanaSearch({query,rows:50});
console.log(JSON.stringify({query,count:items.length,items},null,2));
