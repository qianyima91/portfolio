import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='http://127.0.0.1:4173';
async function ready(){try{const response=await fetch(`${base}/api/status`,{signal:AbortSignal.timeout(800)});return response.ok&&(await response.json()).editor===true;}catch{return false;}}
if(!await ready()){
  const server=spawn(process.execPath,['scripts/server.mjs'],{cwd:root,detached:true,stdio:'ignore',windowsHide:true});
  server.unref();
}
for(let attempt=0;attempt<30;attempt++){
  if(await ready()){
    const browser=spawn('cmd.exe',['/c','start','',`${base}/admin/`],{stdio:'ignore',windowsHide:true});browser.unref();
    console.log(`编辑入口：${base}/admin/`);process.exit(0);
  }
  await delay(150);
}
console.error('编辑器未能启动，请运行“启动网站.cmd”查看提示。');process.exitCode=1;
