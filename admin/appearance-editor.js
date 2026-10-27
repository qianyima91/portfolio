import { DEFAULT_APPEARANCE, FONT_PRESETS } from '../appearance.js';
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups = [
  ['name','姓名',90,180,44,96], ['role','岗位',56,120,30,68], ['english','英文副标题',10,24,8,16],
  ['identity','学校与身份',12,24,9,16], ['keywords','三个关键词',14,28,10,18]
];
function input(label,path,value,min,max,step=1,type='number') {
  return `<label class="style-field"><span>${e(label)}</span><input type="${type}" data-path="${e(path)}" value="${e(value)}" ${type==='number'?`min="${min}" max="${max}" step="${step}"`:''}></label>`;
}
function typography(group,content) {
  const [id,label,min,max,mobileMin,mobileMax] = group;
  const item=content.appearance[id];
  const prefix=`appearance.${id}`;
  return `<details class="type-settings" ${id==='name'?'open':''}><summary>${e(label)}</summary>
    ${id==='english' ? input('英文副标题 · 文案','profile.englishRole',content.profile.englishRole ?? 'PRODUCT OPERATIONS',0,0,1,'text') : ''}
    <label class="style-field"><span>${e(label)} · 字体</span><select data-path="${prefix}.font">${Object.entries(FONT_PRESETS).map(([key,font])=>`<option value="${key}" ${key===item.font?'selected':''}>${e(font.label)}</option>`).join('')}</select></label>
    <div class="style-two">${input(`${label} · 电脑字号`,`${prefix}.size`,item.size,min,max)}${input(`${label} · 手机字号`,`${prefix}.mobileSize`,item.mobileSize,mobileMin,mobileMax)}</div>
    <div class="style-two"><label class="style-field"><span>${e(label)} · 字重</span><select data-path="${prefix}.weight">${[400,500,600,700,800,900].map(w=>`<option value="${w}" ${Number(item.weight)===w?'selected':''}>${w}${w===400?' 常规':w===700?' 粗体':''}</option>`).join('')}</select></label>${input(`${label} · 颜色`,`${prefix}.color`,item.color,0,0,1,'color')}</div>
    <div class="style-two">${input(`${label} · 字距`,`${prefix}.letterSpacing`,item.letterSpacing,id==='english'?0:-6,id==='english'?12:8,.5)}${input(`${label} · 行高`,`${prefix}.lineHeight`,item.lineHeight,1,2.2,.05)}</div>
    ${input(`${label} · 倾斜角度`,`${prefix}.slant`,item.slant,-10,10)}
  </details>`;
}
export function renderAppearanceEditor(content) {
  const layout=content.appearance.layout;
  return `<h1 class="edit-title">首屏字体与排版</h1><p class="edit-description">调整左侧设置，右侧即时预览。点击顶部“保存到网站”后，刷新网站即可应用；当前保存至本机网站。</p>
  <div class="appearance-editor"><div class="appearance-controls">
    <section class="edit-section"><div class="style-section-title"><h2>首屏文字</h2><button class="subtle-button" type="button" data-reset-appearance>恢复默认样式</button></div><p class="style-help">字体优先使用本机已安装字体，缺失时采用回退字体。</p>${groups.map(g=>typography(g,content)).join('')}</section>
    <section class="edit-section"><h2>位置与间距</h2>${input('左侧统一缩进（%）','appearance.layout.left',layout.left,3,8,.5)}${input('标题距顶（px）','appearance.layout.titleTop',layout.titleTop,24,90)}${input('姓名与岗位间距（px）','appearance.layout.titleGap',layout.titleGap,4,40)}${input('岗位与英文间距（px）','appearance.layout.englishGap',layout.englishGap,0,24)}${input('身份区距底（px）','appearance.layout.infoBottom',layout.infoBottom,48,125)}${input('身份与关键词间距（px）','appearance.layout.infoGap',layout.infoGap,6,30)}<p class="style-help">位置设置用于电脑版；手机采用独立布局以保留阅读顺序。</p></section>
    <section class="edit-section"><h2>首页数据</h2><p class="style-help">悬浮或键盘聚焦时，整组文字一起变紫并放大。</p>${content.heroStats.map((s,i)=>`<details class="type-settings"><summary>${e(s.value)} · ${e(s.label)}</summary>${input(`第${i+1}组 · 数字`,`heroStats.${i}.value`,s.value,0,0,1,'text')}${input(`第${i+1}组 · 名称`,`heroStats.${i}.label`,s.label,0,0,1,'text')}${input(`第${i+1}组 · 说明`,`heroStats.${i}.detail`,s.detail,0,0,1,'text')}</details>`).join('')}</section>
  </div><aside class="appearance-preview"><div class="preview-toolbar"><strong>实时预览</strong><div><button type="button" class="selected" data-preview-size="1440" aria-pressed="true">电脑</button><button type="button" data-preview-size="390" aria-pressed="false">手机</button><a href="../#/" target="portfolio-preview">单独打开 ↗</a></div></div><div class="preview-window"><iframe id="appearance-frame" src="../?editor=1#/" title="首屏字体与排版实时预览"></iframe></div><p class="style-help">预览中的改动尚未保存；点击顶部保存后再刷新独立页面。</p></aside></div>`;
}
export function bindAppearanceEditor(root,content,markDirty) {
  const frame=root.querySelector('#appearance-frame');
  const windowBox=root.querySelector('.preview-window');
  let width=1440;
  let disposed=false;
  function resize() {
    const scale=Math.min(1,windowBox.clientWidth/width);
    const height=width===390?1030:970;
    frame.style.width=`${width}px`;
    frame.style.height=`${height}px`;
    frame.style.transform=`scale(${scale})`;
    windowBox.style.height=`${height*scale}px`;
  }
  function push() {
    if(disposed)return;
    frame.contentWindow?.postMessage({type:'portfolio-hero-preview',appearance:content.appearance,heroStats:content.heroStats,englishRole:content.profile.englishRole ?? 'PRODUCT OPERATIONS'},location.origin);
  }
  function onMessage(event) {
    if(event.origin===location.origin && event.source===frame.contentWindow && event.data?.type==='portfolio-preview-ready')push();
  }
  function onInput(event) { if(event.target.dataset.path)queueMicrotask(push); }
  function onClick(event) {
    const size=event.target.closest('[data-preview-size]');
    if(size){width=Number(size.dataset.previewSize);root.querySelectorAll('[data-preview-size]').forEach(b=>{const selected=b===size;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});resize();}
    if(event.target.closest('[data-reset-appearance]')){
      content.appearance=structuredClone(DEFAULT_APPEARANCE);
      root.querySelectorAll('[data-path^="appearance."]').forEach(input=>{input.value=input.dataset.path.split('.').reduce((node,key)=>node[key],content);});
      markDirty();push();
    }
  }
  const observer=new ResizeObserver(resize);
  observer.observe(windowBox);
  root.addEventListener('input',onInput);
  root.addEventListener('click',onClick);
  addEventListener('message',onMessage);
  resize();
  return ()=>{disposed=true;observer.disconnect();root.removeEventListener('input',onInput);root.removeEventListener('click',onClick);removeEventListener('message',onMessage);};
}
