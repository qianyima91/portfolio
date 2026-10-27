import {readFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const content=JSON.parse(await readFile(path.join(root,'content','site.json'),'utf8'));
for(const file of ['app.js','appearance.js','assets/photo-carousel.js','assets/images.js','admin/editor.js','admin/appearance-editor.js','scripts/server.mjs','scripts/build.mjs','scripts/responsive-images.mjs','scripts/verify-build.mjs','scripts/publish.mjs','scripts/github-setup.mjs'])execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});
const expected={shengshu:['产品推广','增长运营','活动策划','官网优化'],enlight:['AI工具评测及选型','工作流标准化'],roboparty:['商业化运营'],qunar:['社媒运营与用户增长','产品运营']};
for(const [id,titles] of Object.entries(expected)){const item=content.experiences.find(i=>i.id===id);if(!item||JSON.stringify(item.modules.map(m=>m.title))!==JSON.stringify(titles))throw new Error(`请核对经历业务标题：${id}`);}
if(!Array.isArray(content.honors)||content.honors.some(item=>typeof item!=='string')||!Array.isArray(content.works)||content.works.some(item=>!item.id||typeof item.title!=='string'))throw new Error('荣誉或AI作品内容结构不正确。');
const info=await stat(path.join(root,'assets','character.webp'));if(info.size<1000)throw new Error('人物素材未就绪。');
const localAssets=[];
function scan(node){if(Array.isArray(node))node.forEach(scan);else if(node&&typeof node==='object'){for(const [key,value] of Object.entries(node)){if(['src','cover','resumeUrl','portfolioPdf'].includes(key)&&typeof value==='string'&&value.startsWith('assets/'))localAssets.push(value);else scan(value);}}}
scan(content);for(const asset of localAssets)await stat(path.join(root,asset));
console.log(`通过：JavaScript语法、四段经历业务标题、内容结构及本地素材（${content.honors.length}项荣誉/${content.works.length}部AI作品）。`);
