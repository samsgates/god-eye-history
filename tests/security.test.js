import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';
test('frontend does not reference private AI key env names',()=>{
 const files=['src/main.js','src/ai/chat.js','src/core/api.js'];const txt=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
 assert.equal(/OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY/.test(txt),false);
});
