import http from 'node:http';
import {readFile,writeFile,mkdir,rename,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.PORT||4173);
const host='127.0.0.1';
const siteFile=path.join(root,'content','site.json');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.avif':'image/avif','.gif':'image/gif','.woff2':'font/woff2','.mp4':'video/mp4','.pdf':'application/pdf'};
let saving=false;
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function body(req,limit=2*1024*1024){const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>limit)throw Object.assign(new Error('文件太大，请压缩后重试。'),{status:413});chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(new Error('内容格式错误。'),{status:400});}}
function checkWrite(req){const origin=req.headers.origin;if(req.headers['x-portfolio-editor']!=='1'||origin!==`http://${host}:${port}`)throw Object.assign(new Error('只允许本地编辑页保存。'),{status:403});}
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  try{
    const url=new URL(req.url,`http://${host}:${port}`);
    const pathname=decodeURIComponent(url.pathname);
    if(pathname==='/api/status'&&req.method==='GET')return json(res,200,{editor:true,mode:'local',onlinePublishing:false});
    if(pathname==='/api/content'&&req.method==='GET'){return json(res,200,JSON.parse(await readFile(siteFile,'utf8')));}
    if(pathname==='/api/content'&&req.method==='PUT'){
      checkWrite(req);
      if(saving)return json(res,409,{error:'正在保存，请稍后重试。'});
      const next=await body(req);
      if(next.schemaVersion!==1||!next.profile?.name||!Array.isArray(next.experiences)||!Array.isArray(next.education)||!Array.isArray(next.honors)||!Array.isArray(next.works)||!Array.isArray(next.photography)||!Array.isArray(next.capabilities)||!next.settings) return json(res,400,{error:'网站内容结构不完整。'});
      for(const item of next.experiences){if(!/^[a-z0-9-]+$/.test(item.id)||!Array.isArray(item.modules)||!item.modules.every(m=>/^[a-z0-9-]+$/.test(m.id)))return json(res,400,{error:'经历标识格式不正确。'});}
      saving=true;
      try{
        const current=await readFile(siteFile,'utf8');
        const backupDir=path.join(root,'docs','backups');await mkdir(backupDir,{recursive:true});
        await writeFile(path.join(backupDir,`${new Date().toISOString().replace(/[:.]/g,'-')}.json`),current,'utf8');
        const temporary=`${siteFile}.${randomUUID()}.tmp`;
        await writeFile(temporary,JSON.stringify(next,null,2)+'\n','utf8');await rename(temporary,siteFile);
        return json(res,200,{saved:true,savedAt:new Date().toISOString(),scope:'local'});
      }finally{saving=false;}
    }
    if(pathname==='/api/upload'&&req.method==='POST'){
      checkWrite(req);const upload=await body(req,12*1024*1024);
      if(!/^image\/(png|jpeg|webp|gif|avif)$/.test(upload.type)||typeof upload.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(upload.data))return json(res,400,{error:'请选择PNG、JPG、WebP、GIF或AVIF图片。'});
      const buffer=Buffer.from(upload.data,'base64');if(buffer.length>8*1024*1024)return json(res,413,{error:'图片上限8MB，请压缩后上传。'});
      const signatures={ 'image/png':buffer.subarray(0,8).toString('hex')==='89504e470d0a1a0a','image/jpeg':buffer[0]===255&&buffer[1]===216&&buffer[2]===255,'image/webp':buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP','image/gif':/^GIF8[79]a$/.test(buffer.subarray(0,6).toString()),'image/avif':buffer.subarray(4,8).toString()==='ftyp'&&['avif','avis'].includes(buffer.subarray(8,12).toString())};
      if(!signatures[upload.type])return json(res,400,{error:'文件格式与图片类型不一致。'});
      const extension={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/avif':'avif'}[upload.type];
      const name=`${Date.now()}-${randomUUID().slice(0,8)}.${extension}`;
      await mkdir(path.join(root,'assets','uploads'),{recursive:true});await writeFile(path.join(root,'assets','uploads',name),buffer);
      return json(res,200,{src:`assets/uploads/${name}`});
    }
    if(pathname==='/api/upload-pdf'&&req.method==='POST'){
      checkWrite(req);
      const upload=await body(req,45*1024*1024);
      if(upload.type!=='application/pdf'||typeof upload.name!=='string'||!upload.name.toLowerCase().endsWith('.pdf')||typeof upload.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(upload.data))return json(res,400,{error:'请选择PDF文件。'});
      const buffer=Buffer.from(upload.data,'base64');
      if(buffer.length>30*1024*1024)return json(res,413,{error:'PDF上限30MB，请压缩后上传。'});
      if(!/^%PDF-(1\.[0-9]|2\.0)/.test(buffer.subarray(0,8).toString('ascii')))return json(res,400,{error:'文件不是有效的PDF格式，请重新选择。'});
      const name=`${Date.now()}-${randomUUID().slice(0,8)}.pdf`;
      const directory=path.join(root,'assets','uploads','portfolios');
      await mkdir(directory,{recursive:true});
      await writeFile(path.join(directory,name),buffer);
      return json(res,200,{src:`assets/uploads/portfolios/${name}`,name:path.basename(upload.name),size:buffer.length});
    }
    if(pathname.startsWith('/api/'))return json(res,404,{error:'接口不存在。'});
    if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'不支持的请求方式。'});
    let relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
    if(relative==='admin'||relative==='admin/')relative='admin/index.html';
    if(!/^(index\.html|styles\.css|hero\.css|app\.js|appearance\.js|assets\/|content\/site\.json$|admin\/)/.test(relative))return json(res,404,{error:'页面不存在。'});
    const filename=path.resolve(root,relative);if(!filename.startsWith(root+path.sep))return json(res,403,{error:'无效路径。'});
    const info=await stat(filename);if(!info.isFile())return json(res,404,{error:'页面不存在。'});
    res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-cache',...(path.extname(filename)==='.pdf'?{'Content-Disposition':'inline'}:{})});
    if(req.method==='HEAD')res.end();else res.end(await readFile(filename));
  }catch(error){json(res,error.status|| (error.code==='ENOENT'?404:500),{error:error.status?error.message:'请求未完成，请重试。'});}
});
server.listen(port,host,()=>console.log(`Local: http://${host}:${port}\nEditor: http://${host}:${port}/admin/`));
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`端口${port}已在使用。可设置PORT后重试。`:error.message);process.exitCode=1;});
