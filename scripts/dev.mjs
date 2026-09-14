import { spawn } from 'node:child_process';
const children=[
  spawn(process.execPath,['server/index.js'],{stdio:'inherit',env:{...process.env,NODE_ENV:'development'}}),
  spawn(process.platform==='win32'?'npm.cmd':'npm',['run','dev:web'],{stdio:'inherit'})
];
function stop(){children.forEach(c=>c.kill('SIGTERM'));process.exit()}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
