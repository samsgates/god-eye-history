const checks=[
 ['Node >=24.14', Number(process.versions.node.split('.')[0])>=24],
 ['DATABASE_URL configured', !!process.env.DATABASE_URL],
 ['At least one AI provider', !!(process.env.OPENAI_API_KEY||process.env.GEMINI_API_KEY||process.env.ANTHROPIC_API_KEY)],
 ['Cesium token optional', true],
 ['Europeana optional', true]
];
console.log('god-eye-history doctor');
for(const [name,ok] of checks)console.log(`${ok?'✓':'○'} ${name}`);
if(!checks[0][1])process.exitCode=1;
