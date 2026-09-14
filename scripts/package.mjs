import { execFileSync } from 'node:child_process';
execFileSync('zip',['-r','god-eye-history.zip','.','-x','node_modules/*','dist/*','.git/*','*.zip'],{stdio:'inherit'});
