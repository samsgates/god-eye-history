import test from 'node:test';import assert from 'node:assert/strict';
import { toolDefinitions } from '../server/ai/tools.js';
test('canonical tool schemas are unique',()=>{const names=toolDefinitions.map(x=>x.name);assert.equal(new Set(names).size,names.length);for(const t of toolDefinitions)assert.equal(t.input_schema.type,'object')});
