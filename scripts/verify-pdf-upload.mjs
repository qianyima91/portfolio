import assert from 'node:assert/strict';
import {readFile,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=`http://127.0.0.1:${process.env.PORT||4173}`;
const headers={'Content-Type':'application/json','X-Portfolio-Editor':'1',Origin:base};
const upload=(data,extraHeaders=headers)=>fetch(`${base}/api/upload-pdf`,{method:'POST',headers:extraHeaders,body:JSON.stringify(data)});
const fake={type:'application/pdf',name:'upload-test.pdf',data:Buffer.from('not a PDF').toString('base64')};
assert.equal((await upload(fake,{'Content-Type':'application/json'})).status,403,'缺少同源编辑标记应拒绝');
assert.equal((await upload(fake)).status,400,'仅改扩展名的非PDF应拒绝');
const original=await readFile(path.resolve(root,'..','作品集大纲1.0.pdf'));
const response=await upload({type:'application/pdf',name:'upload-verification-only.pdf',data:original.toString('base64')});
assert.equal(response.status,200,'正常PDF应上传成功');
const result=await response.json();
assert.match(result.src,/^assets\/uploads\/portfolios\/[a-z0-9-]+\.pdf$/);
const uploaded=path.resolve(root,result.src);
const directory=path.resolve(root,'assets','uploads','portfolios');
assert.ok(uploaded.startsWith(directory+path.sep),'测试文件必须位于本项目PDF上传目录');
try{
  const opened=await fetch(`${base}/${result.src}`);
  assert.equal(opened.status,200);
  assert.equal(opened.headers.get('content-type'),'application/pdf');
  assert.equal(opened.headers.get('content-disposition'),'inline');
  const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
  assert.equal(hash(Buffer.from(await opened.arrayBuffer())),hash(original),'PDF内容须逐字节保留');
  console.log('通过：PDF上传、原文件完整性、浏览器内联打开、伪PDF拒绝和同源写入限制。测试没有修改网站内容。');
}finally{await unlink(uploaded);}
