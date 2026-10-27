import { normalizeAppearance } from '../appearance.js';
import { renderAppearanceEditor, bindAppearanceEditor } from './appearance-editor.js';
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const main=document.querySelector('#editor-main');
const saveButton=document.querySelector('#save');
let content,tab='profile',dirty=false,saving=false,available=false;
let cleanupAppearance;
const tabs=[['profile','基本信息'],['appearance','首屏字体与排版'],['education','教育与荣誉'],['experiences','实习与项目'],['works','AI创作'],['photography','摄影作品'],['contact','联系与简历']];
const editParams=new URLSearchParams(location.search);
if(tabs.some(([id])=>id===editParams.get('tab')))tab=editParams.get('tab');
function get(path){return path.split('.').reduce((node,key)=>node?.[key],content);}
function set(path,value){const keys=path.split('.');const last=keys.pop();const parent=keys.reduce((node,key)=>node[key],content);parent[last]=value;markDirty();}
function markDirty(){dirty=true;saveButton.disabled=!available;document.querySelector('#save-state').textContent='有未保存的修改';}
function toast(message){const node=document.querySelector('#toast');node.textContent=message;node.hidden=false;clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>node.hidden=true,5000);}
function field(label,path,options={}){const raw=get(path);const value=options.lines?raw?.join('\n')??'':raw;return `<label class="field"><span>${e(label)}</span>${options.multiline?`<textarea data-path="${e(path)}" ${options.lines?'data-lines="true"':''} rows="${options.rows||3}">${e(value)}</textarea>`:`<input data-path="${e(path)}" value="${e(value)}" type="${options.type||'text'}" ${options.placeholder?`placeholder="${e(options.placeholder)}"`:''}>`}${options.hint?`<small>${e(options.hint)}</small>`:''}</label>`;}
function imageField(label,path){const src=get(path);const safe=typeof src==='string'&&/^(assets\/|https?:\/\/)/.test(src)&&!src.includes('..');return `<div class="media-edit"><h3>${e(label)}</h3>${safe?`<img src="${src.startsWith('assets/')?'../':''}${e(src)}" alt="${e(label)}">`:''}<label class="upload">上传 / 替换图片<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" data-upload="${e(path)}"></label><span class="upload-hint">PNG、JPG、WebP等，最大8MB</span>${field('图片路径或网址',path,{hint:'上传后自动填写，也可以使用已有图片的公开网址。'})}</div>`;}
function pdfField(index){
  const item=content.works[index];
  const pdf=item.portfolioPdf||'';
  const safe=/^(assets\/|https?:\/\/)/.test(pdf)&&!pdf.includes('..');
  return `<div class="media-edit pdf-edit"><h3>PDF作品集</h3><p class="pdf-help">补充项目过程、设计细节与完整成果。上传后保存，作品卡片会显示PDF小图标入口。</p><button type="button" class="upload" data-pdf-choose="${index}">上传 / 替换PDF</button><input hidden type="file" id="pdf-file-${index}" accept="application/pdf,.pdf" data-pdf-upload="${index}"><span class="upload-hint">PDF，最大30MB</span>${pdf?`<div class="pdf-current"><span>当前：${e(item.portfolioPdfName||'PDF作品集')}</span>${safe?`<a href="${pdf.startsWith('assets/')?'../':''}${e(pdf)}" target="_blank" rel="noopener noreferrer">查看PDF ↗</a>`:''}<button type="button" class="subtle-button delete" data-remove-pdf="${index}">移除入口</button></div>`:''}${field('PDF作品集路径或网址',`works.${index}.portfolioPdf`,{hint:'可直接上传，或填写公开PDF链接；留空则隐藏正式页面的PDF入口。'})}</div>`;
}
function title(title,description){return `<h1 class="edit-title">${title}</h1><p class="edit-description">${description}</p>`;}
function render(){
  cleanupAppearance?.();cleanupAppearance=null;
  document.querySelector('#editor-nav').innerHTML=tabs.map(([id,label])=>`<button type="button" data-tab="${id}" class="${tab===id?'active':''}">${label}</button>`).join('');
  if(tab==='profile')main.innerHTML=title('基本信息','修改姓名、身份与个人介绍，保存后刷新作品集查看。')+`<section class="edit-section"><h2>首屏信息</h2><div class="fields-two">${field('姓名','profile.name')}${field('岗位','profile.role')}</div>${field('学校与身份','profile.identity')}${field('三个关键词（每行一个）','profile.keywords',{multiline:true,lines:true})}</section><section class="edit-section"><h2>关于我</h2>${field('个人简介','profile.bio',{multiline:true,rows:5})}</section><section class="edit-section"><h2>内容预览</h2><label class="checkbox"><input type="checkbox" data-path="settings.showPlaceholders" ${content.settings.showPlaceholders?'checked':''}>显示尚未补齐的素材位置</label><p class="edit-description">公开效果预览会隐藏空图片和空按钮。人物主视觉与页面布局通过网站代码维护。</p></section>`;
  if(tab==='education')main.innerHTML=title('教育与荣誉','保持已确认的专业、时间与荣誉原文，后续可在此更新。')+content.education.map((x,i)=>`<section class="edit-section"><h2>教育经历 0${i+1}</h2>${field('院校',`education.${i}.school`)}<div class="fields-two">${field('专业',`education.${i}.major`)}${field('学位',`education.${i}.degree`)}</div>${field('时间',`education.${i}.period`)}</section>`).join('')+`<section class="edit-section"><h2>所获荣誉</h2>${field('荣誉列表（每行一项）','honors',{multiline:true,lines:true,rows:13})}</section><section class="edit-section"><h2>个人能力</h2>${content.capabilities.map((c,i)=>`<details><summary>${e(c.title)}</summary>${field('名称',`capabilities.${i}.title`)}${field('说明',`capabilities.${i}.description`,{multiline:true})}${field('标签（每行一个）',`capabilities.${i}.tags`,{multiline:true,lines:true})}</details>`).join('')}</section>`;
  if(tab==='experiences')main.innerHTML=title('实习与项目','展开对应经历修改内容；没有材料的字段可以保留空白。')+content.experiences.map((x,i)=>`<section class="edit-section"><h2>${e(x.name)}</h2><div class="fields-two">${field('名称',`experiences.${i}.name`)}${field('职责',`experiences.${i}.role`)}</div>${field('日期',`experiences.${i}.period`)}${field('首页工作摘要',`experiences.${i}.summary`)}${field('经历介绍',`experiences.${i}.intro`,{multiline:true})}${field('业务背景',`experiences.${i}.context`,{multiline:true})}${x.modules.map((m,j)=>moduleEditor(i,j,m)).join('')}</section>`).join('');
  if(tab==='works')main.innerHTML=title('AI创作','上传封面或PDF作品集、补充完成日期和本人贡献，再接入视频或体验链接。有日期的作品按日期倒序展示。')+content.works.map((w,i)=>`<section class="edit-section" id="edit-work-${e(w.id)}"><h2>0${i+1} · ${e(w.title)}</h2>${field('作品名称',`works.${i}.title`)}<div class="fields-two">${field('类别',`works.${i}.category`)}${field('完成日期',`works.${i}.date`,{type:'date'})}</div>${imageField('作品封面',`works.${i}.cover`)}${field('作品简介',`works.${i}.description`,{multiline:true})}${field('本人贡献',`works.${i}.contribution`,{multiline:true})}${field('播放 / 体验网址',`works.${i}.url`,{type:'url',placeholder:'https://…'})}${pdfField(i)}${itemActions('works',i)}</section>`).join('')+'<button type="button" class="add-button" data-add="works">＋ 添加AI作品</button>';
  if(tab==='photography')main.innerHTML=title('摄影作品','上传图片后可在作品集里点击查看大图。')+content.photography.map((p,i)=>`<section class="edit-section"><h2>摄影作品 0${i+1}</h2>${imageField('摄影图片',`photography.${i}.src`)}${field('图片说明',`photography.${i}.caption`)}${itemActions('photography',i)}</section>`).join('')+'<button type="button" class="add-button" data-add="photography">＋ 添加摄影作品</button>';
  if(tab==='contact')main.innerHTML=title('联系与简历','目前按你的选择保留为空。填写后，网站页尾会显示对应入口。')+`<section class="edit-section"><h2>联系方式</h2>${field('公开邮箱','profile.email',{type:'email',placeholder:'name@example.com'})}${field('最终简历链接','profile.resumeUrl',{placeholder:'https://… 或 assets/中的PDF路径',hint:'上线前再指定最终简历。图片上传功能只接收图片，简历PDF由网站文件或公开链接提供。'})}</section><div class="read-only">当前编辑服务只在你的电脑上保存网站文件。GitHub仓库与线上登录尚未接通；正式线上保存和发布将在仓库准备后配置。</div>`;
  if(tab==='appearance'){main.innerHTML=renderAppearanceEditor(content);cleanupAppearance=bindAppearanceEditor(main,content,markDirty);}
}
function itemActions(collection,index){return `<div class="item-actions"><button type="button" class="subtle-button" data-move="${collection}:${index}:-1" ${index===0?'disabled':''}>↑ 上移</button><button type="button" class="subtle-button" data-move="${collection}:${index}:1" ${index===content[collection].length-1?'disabled':''}>↓ 下移</button><button type="button" class="subtle-button delete" data-remove="${collection}:${index}">移除</button></div>`;}
function moduleEditor(i,j,m){const prefix=`experiences.${i}.modules.${j}`;return `<details><summary>${e(m.title)}</summary>${field('业务标题',`${prefix}.title`)}${field('说明',`${prefix}.description`,{multiline:true})}${field('本人行动（每行一项）',`${prefix}.points`,{multiline:true,lines:true,rows:4})}${field('标签（每行一个）',`${prefix}.tags`,{multiline:true,lines:true})}${(m.metrics??[]).map((metric,k)=>`<div class="media-edit"><h3>成果指标</h3><div class="fields-two">${field('数值',`${prefix}.metrics.${k}.value`)}${field('单位',`${prefix}.metrics.${k}.unit`)}</div>${field('指标名称',`${prefix}.metrics.${k}.label`)}${field('统计口径说明',`${prefix}.metrics.${k}.note`,{multiline:true})}</div>`).join('')}${m.flow?field('流程步骤（每行一项）',`${prefix}.flow`,{multiline:true,lines:true}):''}${(m.channels??[]).map((c,k)=>`<div class="fields-two">${field('渠道名称',`${prefix}.channels.${k}.label`)}${field('账号网址',`${prefix}.channels.${k}.url`)}</div>`).join('')}${(m.solutions??[]).map((s,k)=>`<div class="fields-two">${field(`方案${k+1}名称`,`${prefix}.solutions.${k}.label`)}${field('方案链接',`${prefix}.solutions.${k}.url`)}</div>`).join('')}${(m.media??[]).map((media,k)=>`${media.kind === 'video' ? field('视频文件路径（可留空）',`${prefix}.media.${k}.src`,{hint:'本地视频路径或https视频文件网址；大型视频优先填写下方播放链接。'}) : imageField(media.label,`${prefix}.media.${k}.src`)}${field('材料名称',`${prefix}.media.${k}.label`)}${field('完整材料链接',`${prefix}.media.${k}.url`,{hint:media.kind==='video'?'视频使用播放链接；此处不上传大型视频。':''})}`).join('')}${(m.links??[]).map((l,k)=>`<div class="fields-two">${field('入口名称',`${prefix}.links.${k}.label`)}${field('跳转网址',`${prefix}.links.${k}.url`)}</div>`).join('')}</details>`;}
document.addEventListener('input',event=>{const input=event.target;if(!input.dataset.path||input.type==='file')return;set(input.dataset.path,input.type==='checkbox'?input.checked:input.dataset.lines?input.value.split('\n').filter(x=>x.trim()):input.value);});
document.addEventListener('click',event=>{
  const pdfChoose=event.target.closest('[data-pdf-choose]');if(pdfChoose)document.getElementById(`pdf-file-${pdfChoose.dataset.pdfChoose}`)?.click();
  const pdfRemove=event.target.closest('[data-remove-pdf]');if(pdfRemove){const index=Number(pdfRemove.dataset.removePdf);set(`works.${index}.portfolioPdf`,'');set(`works.${index}.portfolioPdfName`,'');const y=scrollY;render();scrollTo({top:y,behavior:'instant'});}
  const nav=event.target.closest('[data-tab]');if(nav){tab=nav.dataset.tab;render();scrollTo({top:0,behavior:'instant'});}
  const move=event.target.closest('[data-move]');if(move){const [collection,index,step]=move.dataset.move.split(':');const a=content[collection];const n=Number(index),next=n+Number(step);if(next<0||next>=a.length)return;[a[n],a[next]]=[a[next],a[n]];markDirty();render();}
  const remove=event.target.closest('[data-remove]');if(remove){const [collection,index]=remove.dataset.remove.split(':');if(!confirm('从当前内容中移除此项？保存前可以刷新页面撤销。'))return;content[collection].splice(Number(index),1);markDirty();render();}
  const add=event.target.closest('[data-add]');if(add){const id=crypto.randomUUID().slice(0,8);if(add.dataset.add==='works')content.works.push({id:`work-${id}`,title:'新作品',category:'AI创作',date:'',description:'',contribution:'',cover:'',url:''});else content.photography.push({id:`photo-${id}`,caption:'',src:''});markDirty();render();}
});
document.addEventListener('change',async event=>{
  const input=event.target;if(!input.dataset.upload||!input.files?.[0])return;
  const file=input.files[0];if(file.size>8*1024*1024){toast('图片上限8MB，请压缩后再上传。');return;}
  if(!available){toast('线上编辑连接尚未接通。');return;}
  toast('正在上传图片…');
  try{const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});const res=await fetch('../api/upload',{method:'POST',headers:{'Content-Type':'application/json','X-Portfolio-Editor':'1'},body:JSON.stringify({type:file.type,data:base64})});const result=await res.json();if(!res.ok)throw new Error(result.error||'图片上传未完成');set(input.dataset.upload,result.src);const opened=[...document.querySelectorAll('details[open]')].map(n=>n.querySelector('summary')?.textContent);render();document.querySelectorAll('details').forEach(n=>{if(opened.includes(n.querySelector('summary')?.textContent))n.open=true;});toast('图片已加入，点击“保存到本地”应用修改。');}catch(error){toast(error.message);}
});
saveButton.addEventListener('click',async()=>{
  if(saving||!available)return;
  saving=true;saveButton.disabled=true;saveButton.textContent='正在保存…';
  try{const res=await fetch('../api/content',{method:'PUT',headers:{'Content-Type':'application/json','X-Portfolio-Editor':'1'},body:JSON.stringify(content)});const result=await res.json();if(!res.ok)throw new Error(result.error||'保存未完成');dirty=false;document.querySelector('#save-state').textContent=`已保存到本地 · ${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`;toast('已保存到本地并自动备份。线上更新还需双击“发布网站.cmd”，等待发布成功后刷新公开网址。');}catch(error){toast(error.message);saveButton.disabled=false;}finally{saving=false;saveButton.textContent='保存到本地';}
});
document.addEventListener('change',async event=>{
  const input=event.target;
  if(input.dataset.pdfUpload===undefined||!input.files?.[0])return;
  const file=input.files[0];
  if(!file.name.toLowerCase().endsWith('.pdf')){toast('请选择PDF文件。');return;}
  if(file.size>30*1024*1024){toast('PDF上限30MB，请压缩后上传。');return;}
  if(!available){toast('线上编辑连接尚未接通。');return;}
  input.disabled=true;toast('正在上传PDF…');
  try{
    const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});
    const response=await fetch('../api/upload-pdf',{method:'POST',headers:{'Content-Type':'application/json','X-Portfolio-Editor':'1'},body:JSON.stringify({type:'application/pdf',name:file.name,data:base64})});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'PDF上传未完成');
    const index=Number(input.dataset.pdfUpload);set(`works.${index}.portfolioPdf`,result.src);set(`works.${index}.portfolioPdfName`,result.name);
    const y=scrollY;render();scrollTo({top:y,behavior:'instant'});toast('PDF已上传，点击“保存到本地”后显示作品集入口。');
  }catch(error){input.disabled=false;input.value='';toast(error.message);}
});
addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
try{
  if(!['127.0.0.1','localhost'].includes(location.hostname))throw new Error('offline');
  const status=await fetch('../api/status');if(!status.ok)throw new Error('offline');const result=await status.json();if(!result.editor)throw new Error('offline');available=true;
  const response=await fetch('../api/content',{cache:'no-store'});if(!response.ok)throw new Error('read');content=await response.json();content.appearance=normalizeAppearance(content.appearance);content.heroStats??=[];
  document.querySelector('#save-state').textContent='已连接本地网站';document.querySelector('#editor-tip').textContent='修改后先“保存到本地”，再双击网站文件夹中的“发布网站.cmd”。等待发布进度显示绿色成功后，刷新线上作品集。本地保存会自动备份，不会直接更新线上。';render();
  if(tab==='works'&&editParams.get('work'))document.getElementById(`edit-work-${editParams.get('work')}`)?.scrollIntoView({block:'start'});
}catch{
  document.querySelector('#save-state').textContent='本地编辑服务未连接';document.querySelector('#editor-tip').textContent='请在本机双击“编辑作品集.cmd”启动编辑器。公开网址只展示作品。';main.innerHTML='<div class="help-empty"><h1>请先启动本地编辑器。</h1><p>GitHub与公开网站已接通，编辑器仍在本机运行。</p><p>双击“编辑作品集.cmd”后打开本页，修改并保存，再运行“发布网站.cmd”更新公开网站。</p><a href="../#/">返回作品集 ↗</a></div>';
}
