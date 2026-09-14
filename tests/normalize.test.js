import test from 'node:test';import assert from 'node:assert/strict';
import { normalizeEvent, precisionFromDate, scoreEvent } from '../server/history/normalize.js';
test('date precision',()=>{assert.equal(precisionFromDate('1960-08-15'),'exact_day');assert.equal(precisionFromDate('1960'),'year')});
test('normalizes event',()=>{const e=normalizeEvent({id:'x',title:'Test',lat:10,lng:20,date:'1960-08-15'});assert.equal(e.latitude,10);assert.equal(e.longitude,20);assert.equal(e.date_precision,'exact_day')});
test('scoring is bounded',()=>assert.ok(scoreEvent(normalizeEvent({importance_score:1,confidence_score:1,sources:[{},{}]}))<=1));
