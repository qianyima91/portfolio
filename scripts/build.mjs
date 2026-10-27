import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildResponsiveImages} from './responsive-images.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
// Only the generated directory inside this checkout may be cleaned.
if(path.dirname(dist)!==root||path.basename(dist)!=='dist')throw new Error('无效的构建目录。');
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
const data=JSON.parse(await readFile(path.join(root,'content','site.json'),'utf8'));
const review=process.argv.includes('--review');
data.settings.showPlaceholders=review;
const files=new Set(['index.html','styles.css','hero.css','app.js','appearance.js','assets/favicon.svg','assets/character.webp','assets/photo-carousel.js','assets/photo-carousel.css','assets/images.js']);
function collect(value){
  if(typeof value==='string'&&/^(?:\.\/)?assets\//.test(value)){
    const file=value.replace(/^\.\//,'');
    const resolved=path.resolve(root,file);
    if(!resolved.startsWith(path.join(root,'assets')+path.sep)||file.includes('..')||file.includes('\\'))throw new Error(`无效素材路径：${file}`);
    files.add(file);
  }else if(value&&typeof value==='object')Object.values(value).forEach(collect);
}
collect(data);
for(const file of files){await mkdir(path.dirname(path.join(dist,file)),{recursive:true});await cp(path.join(root,file),path.join(dist,file));}
await buildResponsiveImages(root,dist,files);
if(review)await cp(path.join(root,'admin'),path.join(dist,'admin'),{recursive:true});
await mkdir(path.join(dist,'content'),{recursive:true});
await writeFile(path.join(dist,'content','site.json'),JSON.stringify(data,null,2)+'\n');
await writeFile(path.join(dist,'.nojekyll'),'');
console.log(`Built static ${review?'review preview':'public view'}: dist/ (${files.size} files + content)`);
