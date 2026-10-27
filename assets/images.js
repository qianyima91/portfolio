const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=value=>typeof value==='string'&&/^assets\/[a-zA-Z0-9_./-]+$/.test(value)&&!value.includes('..');
let images=Object.create(null);
export function configureImages(manifest){
  images=Object.create(null);
  for(const [source,item] of Object.entries(manifest?.images||{})){
    if(!safe(source)||!safe(item?.src)||!safe(item?.full)||!Number.isFinite(item.width)||!Number.isFinite(item.height)||!Array.isArray(item.sources))continue;
    if(!item.sources.every(v=>safe(v.src)&&Number.isFinite(v.width)&&v.width>0))continue;
    images[source]=item;
  }
}
export function imageAttributes(source,sizes='100vw'){
  const item=images[source];
  return `src="${escape(item?.src||source)}"${item?` srcset="${item.sources.map(v=>`${escape(v.src)} ${v.width}w`).join(', ')}" sizes="${escape(sizes)}" width="${item.width}" height="${item.height}"`:''} loading="lazy" decoding="async"`;
}
export const fullImageUrl=source=>images[source]?.full||source;
export function installImageRetries(){
  document.addEventListener('error',event=>{
    const img=event.target;
    if(!(img instanceof HTMLImageElement)||!img.src||Number(img.dataset.imageRetries||0)>=2)return;
    const attempt=Number(img.dataset.imageRetries||0)+1;
    const selected=img.currentSrc||img.src;
    img.dataset.imageRetries=String(attempt);
    setTimeout(()=>{
      if(!img.isConnected)return;
      const url=new URL(selected,location.href);url.searchParams.set('image-retry',String(attempt));
      img.removeAttribute('srcset');img.src=url.href;
    },attempt*1200);
  },true);
}
