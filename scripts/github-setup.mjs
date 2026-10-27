// First deployment helper. Git Credential Manager owns authentication;
// credentials exist only in process memory and never enter arguments or files.
import {execFileSync} from 'node:child_process';
const [operation,owner,repo='portfolio']=process.argv.slice(2);
if(!['status','create','pages'].includes(operation)||!owner||!/^[\w.-]+$/.test(owner)||!/^[\w.-]+$/.test(repo))throw new Error('用法：node scripts/github-setup.mjs status|create|pages GitHub用户名 仓库名');
let token;
try{
  const credential=execFileSync('git',['credential','fill'],{encoding:'utf8',input:`protocol=https\nhost=github.com\nusername=${owner}\n\n`,env:{...process.env,GCM_INTERACTIVE:'never',GIT_TERMINAL_PROMPT:'0'},stdio:['pipe','pipe','pipe']});
  token=credential.split(/\r?\n/).find(line=>line.startsWith('password='))?.slice(9);
}catch{console.error('本机GitHub授权尚未完成，请完成Git Credential Manager登录。');process.exit(1);}
if(!token)throw new Error('未获得本机GitHub登录凭据。');
async function api(endpoint,options={}){
  const response=await fetch(`https://api.github.com${endpoint}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'portfolio-deployment','Content-Type':'application/json'},body:options.body?JSON.stringify(options.body):undefined});
  const text=await response.text();let data;try{data=JSON.parse(text);}catch{data={};}
  if(!response.ok&&!(options.allow404&&response.status===404))throw new Error(`GitHub请求未完成：${response.status} ${data.message||response.statusText}`);
  return {status:response.status,data};
}
try{
  const {data:user}=await api('/user');
  if(user.login.toLowerCase()!==owner.toLowerCase())throw new Error('Git登录账号与已连接账号不一致，已停止。');
  const endpoint=`/repos/${owner}/${repo}`;
  if(operation==='status')console.log(JSON.stringify({login:user.login,id:user.id}));
  if(operation==='create'){
    let result=await api(endpoint,{allow404:true});
    if(result.status===404)result=await api('/user/repos',{method:'POST',body:{name:repo,description:'马倩怡 · 产品运营作品集',private:false,auto_init:false,has_issues:false,has_wiki:false}});
    const d=result.data;
    console.log(JSON.stringify({full_name:d.full_name,url:d.html_url,clone_url:d.clone_url,visibility:d.visibility,empty:d.size===0,default_branch:d.default_branch}));
  }
  if(operation==='pages'){
    let result=await api(`${endpoint}/pages`,{allow404:true});
    if(result.status===404)result=await api(`${endpoint}/pages`,{method:'POST',body:{build_type:'workflow'}});
    else if(result.data.build_type!=='workflow')result=await api(`${endpoint}/pages`,{method:'PUT',body:{build_type:'workflow'}});
    const d=result.data;
    console.log(JSON.stringify({url:d.html_url,status:d.status,build_type:d.build_type,https_enforced:d.https_enforced}));
  }
}catch(error){console.error(error.message);process.exitCode=1;}finally{token=undefined;}
