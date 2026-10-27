import sharp from 'sharp';
import {readFile,writeFile,mkdir,cp,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

export async function buildResponsiveImages(root,dist,files){
  sharp.concurrency(2);
  const images={};
  const cache=path.join(root,'tmp','image-cache');
  await mkdir(cache,{recursive:true});
  await mkdir(path.join(dist,'assets','optimized'),{recursive:true});
  let originalBytes=0,previewBytes=0;
  for(const file of files){
    if(!file.startsWith('assets/uploads/')||! /\.(png|jpe?g|webp|avif)$/i.test(file))continue;
    const input=await readFile(path.join(root,file));
    const metadata=await sharp(input).metadata();
    if((metadata.pages||1)>1)continue; // Preserve animated uploads.
    const width=metadata.orientation>4?metadata.height:metadata.width;
    const key=createHash('sha256').update('responsive-v1-quality86').update(input).digest('hex').slice(0,20);
    const variants=[];
    for(const size of [...new Set([480,960,1600,2400].map(size=>Math.min(size,width)))]){
      const name=`${key}-${size}.webp`;
      const cached=path.join(cache,name);
      try{await stat(cached);}catch{
        await sharp(input).rotate().resize({width:size,withoutEnlargement:true}).webp({quality:86,effort:4,smartSubsample:true}).toFile(cached);
      }
      const src=`assets/optimized/${name}`;
      await cp(cached,path.join(dist,src));
      const info=await sharp(cached).metadata();
      variants.push({src,width:info.width,height:info.height,bytes:(await stat(cached)).size});
    }
    const preview=variants.find(v=>v.width>=Math.min(960,width));
    images[file]={width:variants.at(-1).width,height:variants.at(-1).height,src:preview.src,full:variants.at(-1).src,sources:variants.filter(v=>v.width<=1600||v===variants[0])};
    originalBytes+=input.length;previewBytes+=preview.bytes;
  }
  const report={images:Object.keys(images).length,originalBytes,previewBytes,reduction:originalBytes?Number((100*(1-previewBytes/originalBytes)).toFixed(1)):0};
  await mkdir(path.join(dist,'content'),{recursive:true});
  await writeFile(path.join(dist,'content','images.json'),JSON.stringify({images,report})+'\n');
  console.log(`响应式图片：${report.images}张，960px预览合计${(previewBytes/1024/1024).toFixed(2)}MB（比原图减少${report.reduction}%）；保留原图。`);
}
