import {readFile,stat,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const source=JSON.parse(await readFile(path.join(root,'content/site.json'),'utf8'));
const built=JSON.parse(await readFile(path.join(dist,'content/site.json'),'utf8'));
assert.deepEqual(built,{...source,settings:{...source.settings,showPlaceholders:false}},'公开文案或样式与当前内容不一致。');
const files=await readdir(dist,{recursive:true});
assert(!files.some(file=>/^(admin|docs|scripts|\.git|\.openai)([\\/]|$)/.test(file)),'公开包包含后台或历史记录。');
assert(!files.some(file=>file==='assets/character-source.png'||file.endsWith('.env')),'公开包包含非展示源文件。');
const refs=new Set(['index.html','app.js','appearance.js','styles.css','hero.css','assets/favicon.svg','assets/character.webp','assets/photo-carousel.js','assets/photo-carousel.css','assets/images.js','content/images.json','.nojekyll']);
function collect(value){if(typeof value==='string'&&/^(?:\.\/)?assets\//.test(value))refs.add(value.replace(/^\.\//,''));else if(value&&typeof value==='object')Object.values(value).forEach(collect);}
collect(built);
const manifest=JSON.parse(await readFile(path.join(dist,'content/images.json'),'utf8'));
for(const [original,image] of Object.entries(manifest.images)){
  assert(refs.has(original),`图片清单引用了未使用的原图：${original}`);
  refs.add(image.src);refs.add(image.full);
  for(const variant of image.sources){
    refs.add(variant.src);
    const info=await sharp(path.join(dist,variant.src)).metadata();
    assert.equal(info.format,'webp');assert.equal(info.width,variant.width);
    assert(Math.abs(info.width/info.height-image.width/image.height)<0.01,`图片比例发生变化：${original}`);
  }
}
let bytes=0;
for(const file of refs){const info=await stat(path.join(dist,file));assert(info.isFile(),`素材不存在：${file}`);assert(info.size<100*1024*1024,`文件超过GitHub单文件限制：${file}`);bytes+=info.size;}
console.log(`公开构建通过：${refs.size}个文件/素材，${(bytes/1024/1024).toFixed(1)}MB；当前内容完整，未包含本地后台和备份。`);
