import {spawnSync} from 'node:child_process';
const reference=process.argv.includes('--reference'),cwd=reference?'tests/reference':'.';
let failed=0;
for(const flag of ['', '--bancadas','--postos','--alinhamento','--selecao','--wasd','--criador','--menu',...(reference?[]:['--map'])]){
 console.log('\nSUÍTE '+(flag||'geral')+(reference?' / referência':''));
 const result=spawnSync(process.execPath,[reference?'regressao.mjs':'tests/regressao.mjs','index.html',...(flag?[flag]:[])],{cwd,stdio:'inherit',windowsHide:true,env:{...process.env,CHROME_TEST_NO_SANDBOX:'1'}});if(result.status!==0)failed++;
}process.exitCode=failed?1:0;
