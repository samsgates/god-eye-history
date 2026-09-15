import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDateIntent, stripDate } from '../server/places.js';

test('parses and strips a year-only place search',()=>{
  assert.deepEqual(parseDateIntent('Paris 1789'),{date:'1789-01-01',start:'1789-01-01',end:'1789-12-31'});
  assert.equal(stripDate('Paris 1789'),'Paris');
});

test('parses exact dates in either common order',()=>{
  const expected={date:'1947-08-15',start:'1947-08-15',end:'1947-08-15'};
  assert.deepEqual(parseDateIntent('Delhi 15 August 1947'),expected);
  assert.deepEqual(parseDateIntent('Delhi August 15, 1947'),expected);
  assert.equal(stripDate('Delhi August 15, 1947'),'Delhi');
});

test('parses short AD years as a full-year search',()=>{
  assert.deepEqual(parseDateIntent('Pompeii 79 AD'),{date:'0079-01-01',start:'0079-01-01',end:'0079-12-31'});
  assert.equal(stripDate('Pompeii 79 AD'),'Pompeii');
});