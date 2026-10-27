import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const git=(...args)=>execFileSync('git',args,{cwd:root,stdio:'inherit'});
function pushArguments(){
  if(process.platform!=='win32'||process.env.HTTPS_PROXY||process.env.HTTP_PROXY||process.env.ALL_PROXY)return [];
  try{if(execFileSync('git',['config','--get-urlmatch','http.proxy','https://github.com/'],{cwd:root,encoding:'utf8',stdio:'pipe'}).trim())return [];}catch{}
  try{
    const key='HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings';
    const enabled=execFileSync('reg.exe',['query',key,'/v','ProxyEnable'],{encoding:'utf8',stdio:'pipe'});
    if(!/REG_DWORD\s+0x1\b/i.test(enabled))return [];
    const settings=execFileSync('reg.exe',['query',key,'/v','ProxyServer'],{encoding:'utf8',stdio:'pipe'});
    let proxy=settings.match(/REG_SZ\s+([^\r\n]+)/)?.[1]?.trim();
    if(proxy?.includes('='))proxy=proxy.split(';').find(v=>v.startsWith('https='))?.slice(6)||proxy.split(';').find(v=>v.startsWith('http='))?.slice(5);
    if(/^(127\.0\.0\.1|localhost):\d{1,5}$/.test(proxy||''))return ['-c',`http.proxy=http://${proxy}`];
  }catch{}
  return [];
}
try{
  const remote=execFileSync('git',['remote','get-url','origin'],{cwd:root,encoding:'utf8'}).trim();
  if(!/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?$/.test(remote))throw new Error('尚未连接GitHub仓库，请先完成首次部署。');
  const branch=execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim();
  if(branch!=='main')throw new Error('请在main分支发布，当前操作已停止。');
  for(const script of ['check.mjs','build.mjs','verify-build.mjs'])execFileSync(process.execPath,[`scripts/${script}`],{cwd:root,stdio:'inherit'});
  git('add','--all');
  const staged=execFileSync('git',['diff','--cached','--name-only'],{cwd:root,encoding:'utf8'}).trim();
  if(staged)git('commit','-m',`Update portfolio ${new Date().toISOString()}`);
  git(...pushArguments(),'push','origin','main');
  console.log('已推送GitHub。等待仓库Actions中的Publish portfolio显示绿色后，刷新公开网址。');
}catch(error){console.error(error.message||'发布失败。');process.exitCode=1;}
