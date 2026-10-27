import { applyHeroAppearance } from './appearance.js';
import { renderPhotoCarousel, mountPhotoCarousel } from './assets/photo-carousel.js';
import {configureImages,imageAttributes,fullImageUrl,installImageRetries} from './assets/images.js';
installImageRetries();
const main = document.querySelector('#main');
let data;
let localEditor = false;
let currentView = '';
let cleanupPhotography;
const publicView = new URLSearchParams(location.search).get('view') === 'public';
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const star = '<svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><path d="M20 0C20 13 13 20 0 20c13 0 20 7 20 20 0-13 7-20 20-20C27 20 20 13 20 0Z"/></svg>';
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5"/></svg>';
const mediaIcon = '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="6" y="9" width="36" height="30" rx="5" stroke="currentColor" stroke-width="1.2"/><circle cx="17" cy="19" r="3" stroke="currentColor" stroke-width="1.2"/><path d="m8 34 10-9 7 6 6-8 10 11" stroke="currentColor" stroke-width="1.2"/></svg>';
const pdfIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M14 3v5h5M8 13h8M8 17h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function validUrl(value) {
  if (!value || typeof value !== 'string') return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(assets\/|\.\/assets\/)/.test(value) && !value.includes('..') && !/[\\<>]/.test(value)) return value;
  return '';
}
function link(url, label, className = '') {
  const safe = validUrl(url);
  if (!safe) return '';
  return `<a class="${className}" href="${e(safe)}" ${/^https?:/.test(safe) ? 'target="_blank" rel="noopener noreferrer"' : ''}>${e(label)}${arrow}</a>`;
}
const draft = () => data.settings.showPlaceholders && !publicView;
const tags = items => `<div class="tags">${(items ?? []).map(t => `<span>${e(t)}</span>`).join('')}</div>`;
function sectionHeading(number, title, extra = '') {
  return `<div class="section-heading"><div><span class="section-number">${number}</span><h2>${e(title)}</h2></div>${extra || `<span class="section-star">${star}</span>`}</div>`;
}
function education() {
  return `<div class="education-list">${data.education.map(item => `<div class="education-row"><div class="school-mark">工</div><div class="school-copy"><h3>${e(item.school)}</h3><p>${e(item.major)} <span>· ${e(item.degree)}</span></p></div><time>${e(item.period)}</time></div>`).join('')}</div>`;
}
function honors() {
  return `<div class="honors"><h3>所获荣誉</h3><ul>${data.honors.map(h => `<li>${e(h)}</li>`).join('')}</ul></div>`;
}
function experienceRows(kind) {
  return `<div class="experience-list">${data.experiences.filter(item => item.kind === kind).map((item, index) => `<a class="experience-row" href="#/experience/${encodeURIComponent(item.id)}" aria-label="查看${e(item.name)}经历"><time>${e(item.period)}</time><div class="experience-copy"><div><h3>${e(item.name)}</h3><span class="row-index">0${index + 1}</span></div><p>${e(item.summary)}</p></div><span class="experience-role">${e(item.role)}</span><span class="round-arrow">${arrow}</span></a>`).join('')}</div>`;
}
function renderHome() {
  const p = data.profile;
  const englishRole = p.englishRole ?? 'PRODUCT OPERATIONS';
  main.innerHTML = `<div class="home-view">
    <section class="hero" aria-labelledby="hero-name">
      <div class="hero-purple"><span class="purple-swoosh swoosh-one"></span><span class="purple-swoosh swoosh-two"></span></div>
      <div class="hero-type"><h1 id="hero-name">${e(p.name)}</h1><div class="hero-role-group"><p class="hero-role">${e(p.role)}</p>${englishRole ? `<p class="hero-english" lang="en">${e(englishRole)}</p>` : ''}</div></div>
      <span class="hero-star">${star}</span><div class="hero-orbit" aria-hidden="true"></div>
      <img class="hero-character" src="assets/character.webp" alt="紫色毛帽、银色墨镜的3D人物形象" fetchpriority="high" width="1141" height="1379">
      <div class="hero-info"><p>${e(p.identity)}</p><div class="hero-keywords">${p.keywords.map(k => `<span>${e(k)}</span>`).join('<i>/</i>')}</div></div>
    </section>
    <div class="hero-metrics-block"><section class="hero-stats page-width" aria-label="经历数据亮点">${heroStats()}</section><a class="scroll-cue" href="#/education" aria-label="向下浏览教育与经历"><span></span></a></div>
    <div class="page-width home-content"><section id="education" class="home-section education-section reveal">${sectionHeading('01', '教育背景')}${education()}${honors()}</section><section id="internships" class="home-section reveal">${sectionHeading('02', '实习经历')}${experienceRows('internship')}</section><section id="projects" class="home-section reveal">${sectionHeading('03', '项目经历')}${experienceRows('project')}</section><a class="about-teaser reveal" href="#/about"><span class="teaser-star">${star}</span><div><p>经历之外</p><h2>关于我，和我的创作。</h2></div><span class="round-arrow">${arrow}</span></a></div></div>`;
  applyHeroAppearance(data.appearance);
  currentView = 'home';
}
function heroStats() {
  return (data.heroStats || []).slice(0,4).map(s => `<div class="hero-stat" tabindex="0" role="group" aria-label="${e(`${s.value}，${s.label}，${s.detail}`)}"><div class="hero-stat-content"><strong>${e(s.value)}</strong><span class="hero-stat-label">${e(s.label)}</span><p>${e(s.detail)}</p></div></div>`).join('');
}
addEventListener('message', event => {
  if(!localEditor || window.parent === window || event.source !== window.parent || event.origin !== location.origin || event.data?.type !== 'portfolio-hero-preview') return;
  const next = event.data;
  if(next.appearance) { data.appearance = next.appearance; applyHeroAppearance(data.appearance); }
  if(typeof next.englishRole === 'string') {
    data.profile.englishRole = next.englishRole;
    const group = main.querySelector('.hero-role-group');
    let english = group?.querySelector('.hero-english');
    if(!next.englishRole.trim()) english?.remove();
    else if(group) {
      if(!english) { english = document.createElement('p'); english.className = 'hero-english'; english.lang = 'en'; group.append(english); }
      english.textContent = next.englishRole;
    }
  }
  if(Array.isArray(next.heroStats)) { data.heroStats = next.heroStats; const stats = main.querySelector('.hero-stats'); if(stats)stats.innerHTML = heroStats(); }
});
function placeholder(label, className = '') {
  return draft() ? `<div class="media-placeholder ${className}"><span class="placeholder-art">${mediaIcon}</span><p>${e(label)}</p><small>待补充素材</small></div>` : '';
}
function renderMedia(item) {
  const src = validUrl(item.src);
  const url = validUrl(item.url);
  if (!src && !url) return placeholder(item.label);
  if (item.kind === 'video' && src) return `<figure class="media-item"><video src="${e(src)}" controls preload="metadata" playsinline></video><figcaption>${e(item.label)}</figcaption></figure>`;
  if (src) return `<figure class="media-item"><button class="image-button" type="button" data-image="${e(src)}" data-caption="${e(item.label)}"><img ${imageAttributes(src,'(max-width: 700px) 92vw, 40vw')} alt="${e(item.label)}"><span class="image-expand">↗</span></button><figcaption>${e(item.label)}</figcaption>${url ? link(url,'查看完整材料','text-link') : ''}</figure>`;
  return `<div class="material-link">${mediaIcon}${link(url,item.label,'text-link')}</div>`;
}
function metrics(items) {
  if (!items?.length) return '';
  return `<div class="metric-grid">${items.map(m => `<div class="metric"><div>${e(m.value)}<span>${e(m.unit)}</span></div><h4>${e(m.label)}</h4>${m.note ? `<p>${e(m.note)}</p>` : ''}</div>`).join('')}</div>`;
}
function moduleHtml(m, index) {
  const links = (m.links ?? []).map(l => link(l.url,l.label,'text-link')).filter(Boolean);
  const missingLinks = (m.links ?? []).filter(l => !validUrl(l.url));
  const solutions = (m.solutions ?? []).filter(s => s.label && validUrl(s.url));
  return `<section class="case-module reveal" id="module-${e(m.id)}"><div class="module-title"><span>0${index + 1}</span><h2>${e(m.title)}</h2></div><p class="module-description">${e(m.description)}</p>${tags(m.tags)}${metrics(m.metrics)}${m.points?.length ? `<ul class="action-list">${m.points.map(p=>`<li>${e(p)}</li>`).join('')}</ul>` : ''}${m.flow?.length ? `<div class="workflow" aria-label="工作流程">${m.flow.map((f,i)=>`<div><span>0${i+1}</span><p>${e(f)}</p></div>${i<m.flow.length-1?'<i aria-hidden="true">→</i>':''}`).join('')}</div>` : ''}${m.channels?.length ? `<div class="channel-list">${m.channels.map(c=>validUrl(c.url)?link(c.url,c.label,'channel'): `<span class="channel">${e(c.label)}</span>`).join('')}</div>` : ''}${solutions.length ? `<div class="solution-links">${solutions.map(s=>link(s.url,s.label,'text-link')).join('')}</div>` : m.solutions && draft() ? `<div class="inline-placeholder"><span>五个解决方案</span><small>名称与链接待补充</small></div>` : ''}<div class="media-grid">${(m.media??[]).map(renderMedia).join('')}</div>${m.smallNote && draft() ? `<p class="small-note">${e(m.smallNote)}</p>`:''}${links.length ? `<div class="module-links">${links.join('')}</div>`:''}${draft() && missingLinks.length ? `<div class="pending-links">${missingLinks.map(l=>`<span>${e(l.label)}<small>入口待接入</small></span>`).join('')}</div>`:''}</section>`;
}
function renderExperience(id) {
  const item = data.experiences.find(x=>x.id===id);
  if (!item) return renderNotFound();
  const isIntern = item.kind === 'internship';
  const index = data.experiences.indexOf(item);
  const next = data.experiences[(index + 1) % data.experiences.length];
  main.innerHTML = `<div class="detail-view page-width"><div class="breadcrumb"><a href="#/">首页</a><span>/</span><a href="#/${isIntern?'internships':'projects'}">${isIntern?'实习经历':'项目经历'}</a><span>/</span><span>${e(item.name)}</span></div><section class="detail-hero"><div class="detail-eyebrow"><span>0${index+1}</span>${isIntern?'实习经历':'项目经历'}</div><h1>${e(item.name)}<span>${star}</span></h1><div class="detail-meta"><span>${e(item.role)}</span><time>${e(item.period)}</time></div><p class="detail-intro">${e(item.intro)}</p><div class="detail-context">${e(item.context)}</div></section><div class="case-layout"><aside class="case-nav" aria-label="本段经历目录"><span>本段经历</span>${item.modules.map((m,i)=>`<button type="button" data-scroll="module-${e(m.id)}"><small>0${i+1}</small>${e(m.title)}</button>`).join('')}<a href="#/${isIntern?'internships':'projects'}">← 返回${isIntern?'实习':'项目'}经历</a></aside><div class="case-body">${item.modules.map(moduleHtml).join('')}</div></div><a class="next-case" href="#/experience/${e(next.id)}"><div><small>继续浏览</small><h2>${e(next.name)}</h2><p>${e(next.summary)}</p></div><span class="round-arrow">${arrow}</span></a></div>`;
  currentView = `experience/${id}`;
  document.title = `${item.name} · 马倩怡的作品集`;
}
function workCards() {
  const works = data.works.map((w,index)=>({...w,_index:index})).sort((a,b)=> (b.date||'').localeCompare(a.date||'') || a._index-b._index);
  return `<div class="works-grid">${works.map((w,index)=>{
    const cover=validUrl(w.cover), url=validUrl(w.url), pdf=validUrl(w.portfolioPdf);
    if(!cover&&!url&&!pdf&&!draft())return '';
    const pdfAction=pdf
      ? `<a class="work-pdf-link" href="${e(pdf)}" target="_blank" rel="noopener noreferrer" aria-label="查看${e(w.title)}的PDF作品集">${pdfIcon}<span>查看作品集 <small>PDF</small></span></a>`
      : w.id==='happiness' && draft()
        ? localEditor
          ? `<a class="work-pdf-link is-empty" href="admin/?tab=works&work=${encodeURIComponent(w.id)}" target="_blank" rel="noopener">${pdfIcon}<span>上传PDF作品集</span></a>`
          : `<span class="work-pdf-link is-empty">${pdfIcon}<span>PDF作品集待上传</span></span>`
        : '';
    return `<article class="work-card"><div class="work-cover work-cover-${index%4}">${cover?`<button class="image-button" type="button" data-image="${e(cover)}" data-caption="${e(w.title)}"><img ${imageAttributes(cover,'(max-width: 700px) 92vw, 46vw')} alt="${e(w.title)}封面"></button>`:`<div class="work-empty"><span>0${index+1}</span>${mediaIcon}<small>待添加作品封面</small></div>`}</div><div class="work-meta"><span>${e(w.category)}</span><time>${e(w.date|| (draft()?'日期待补':''))}</time></div><h3>${e(w.title)}</h3>${w.description?`<p class="work-description">${e(w.description)}</p>`:''}${w.contribution?`<p class="work-contribution"><span>本人贡献</span>${e(w.contribution)}</p>`:''}<div class="work-actions">${url?link(url,'播放 / 体验','text-link'):draft()?'<span class="pending-label">作品入口待接入</span>':''}${pdfAction}</div></article>`;
  }).join('')}</div>`;
}
function photographyHtml() {
  const photos=data.photography.filter(photo=>validUrl(photo.src)).map(photo=>({...photo,src:validUrl(photo.src)}));
  return photos.length?renderPhotoCarousel(photos):`<div class="photography-grid">${data.photography.map((_,index)=>placeholder(`摄影作品 0${index+1}`,'photo')).join('')}</div>`;
}
function renderAbout() {
  main.innerHTML = `<div class="about-view page-width"><div class="breadcrumb"><a href="#/">首页</a><span>/</span><span>关于我</span></div><section class="about-intro"><div><span class="detail-eyebrow">关于我</span><h1>你好，我是<br><span>${e(data.profile.name)}。</span></h1><p>${e(data.profile.bio)}</p>${tags(data.profile.keywords)}</div><div class="about-portrait"><span class="portrait-orbit"></span><img src="assets/character.webp" alt="马倩怡的3D人物形象" width="1024" height="1536"></div></section><section class="about-section reveal">${sectionHeading('01','个人背景')}${education()}<div class="capabilities">${data.capabilities.map((c,i)=>`<div class="capability"><span>0${i+1}</span><h3>${e(c.title)}</h3><p>${e(c.description)}</p>${tags(c.tags)}</div>`).join('')}</div>${honors()}</section><section class="about-section reveal" id="ai-works">${sectionHeading('02','核心AI创作')}<p class="section-intro">在模型实践中探索影像、创意与表达。</p>${workCards()}${!draft()&&!data.works.some(w=>validUrl(w.cover)||validUrl(w.url)||validUrl(w.portfolioPdf))?'<p class="quiet-empty">作品整理中</p>':''}</section><section class="about-section photography-section reveal">${sectionHeading('03','摄影作品')}${photographyHtml()}${!draft()&&!data.photography.some(p=>validUrl(p.src))?'<p class="quiet-empty">摄影作品整理中</p>':''}</section></div>`;
  if(!draft() && !data.works.some(w=>validUrl(w.cover)||validUrl(w.url)||validUrl(w.portfolioPdf)))main.querySelector('#ai-works')?.remove();
  if(!draft() && !data.photography.some(p=>validUrl(p.src)))main.querySelector('.photography-section')?.remove();
  cleanupPhotography=mountPhotoCarousel(main.querySelector('[data-photo-carousel]'));
  currentView='about';
  document.title='关于我 · 马倩怡的作品集';
}
function renderNotFound() {
  main.innerHTML='<div class="page-width not-found"><span>404</span><h1>这一页暂时没有内容。</h1><a class="text-link" href="#/">回到首页 ↗</a></div>';
  currentView='not-found';
}
function footer() {
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.profile.email) ? data.profile.email : '';
  document.querySelector('#footer').innerHTML=`<div class="footer-inner page-width"><div class="footer-person">${star}<div><strong>${e(data.profile.name)}</strong><span>${e(data.profile.role)}</span></div></div><div class="footer-contact">${email?`<a href="mailto:${e(email)}">${e(email)}</a>`:draft()?'<span>邮箱待补充</span>':''}${validUrl(data.profile.resumeUrl)?link(data.profile.resumeUrl,'查看简历','text-link'):draft()?'<span>简历入口待补充</span>':''}</div><a class="footer-top" href="#/" aria-label="回到首页">回到首页 ${arrow}</a></div>`;
}
let revealObserver;
function animateIn() {
  revealObserver?.disconnect();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}}),{threshold:0.05});
  document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));
}
function route() {
  cleanupPhotography?.();cleanupPhotography=null;
  const hash=location.hash.replace(/^#\/?/,'').split('?')[0];
  const homeRoute=['','internships','projects','education'].includes(hash);
  if(homeRoute){if(currentView!=='home')renderHome();document.title=`${data.profile.name} · ${data.profile.role}作品集`;}
  else if(hash==='about')renderAbout();
  else if(hash.startsWith('experience/'))renderExperience(decodeURIComponent(hash.slice(11)));
  else renderNotFound();
  const nav=hash==='about'?'about':hash==='projects'?'projects':hash==='internships'?'internships':hash.startsWith('experience/')?(data.experiences.find(x=>x.id===hash.slice(11))?.kind==='project'?'projects':'internships'):'home';
  document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===nav)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  requestAnimationFrame(()=>{if(homeRoute&&hash){document.getElementById(hash)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}else scrollTo({top:0,behavior:'instant'});animateIn();});
}
document.addEventListener('click',event=>{
  if(event.target.closest('.skip-link')){event.preventDefault();main.focus();return;}
  const sameRoute=event.target.closest('a[href^="#/"]');
  if(sameRoute && sameRoute.getAttribute('href')===location.hash){event.preventDefault();route();return;}
  const scrollButton=event.target.closest('[data-scroll]');
  if(scrollButton){document.getElementById(scrollButton.dataset.scroll)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});document.querySelectorAll('.case-nav button').forEach(b=>b.classList.toggle('active',b===scrollButton));}
  const imageButton=event.target.closest('[data-image]');
  if(imageButton){const dialog=document.querySelector('#media-dialog');document.querySelector('#dialog-content').innerHTML=`<img src="${e(fullImageUrl(imageButton.dataset.image))}" decoding="async" alt="${e(imageButton.dataset.caption)}"><p>${e(imageButton.dataset.caption)}</p>`;dialog.showModal();}
});
const dialog=document.querySelector('#media-dialog');
dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
document.querySelector('#back-top').addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
addEventListener('scroll',()=>{document.querySelector('#back-top').hidden=scrollY<600;document.querySelector('.site-header').classList.toggle('scrolled',scrollY>20);},{passive:true});
addEventListener('hashchange',route);
try {
  const response=await fetch('content/site.json',{cache:'no-cache'});
  if(!response.ok)throw new Error('内容读取失败');
  data=await response.json();
  if(['127.0.0.1','localhost'].includes(location.hostname))try{const status=await fetch('api/status');if(status.ok)localEditor=(await status.json()).editor===true;}catch{}
  if(!localEditor){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);try{const manifest=await fetch('content/images.json',{cache:'no-cache',signal:controller.signal});if(manifest.ok)configureImages(await manifest.json());}catch{}finally{clearTimeout(timeout);}}
  route();footer();
  if(localEditor && window.parent !== window)window.parent.postMessage({type:'portfolio-preview-ready'},location.origin);
  if((localEditor && !publicView) || draft()){
    const tools=document.querySelector('#preview-tools');tools.hidden=false;
    tools.innerHTML=`<span class="preview-dot"></span><span>${localEditor?'本地编辑':'制作预览'}</span>${localEditor?'<a href="admin/" target="_blank" rel="noopener">编辑内容 ↗</a>':''}<a href="?view=public${e(location.hash||'#/')}" target="_blank" rel="noopener">查看公开效果 ↗</a>`;
  }
} catch(error) {
  main.innerHTML='<div class="page-width not-found"><h1>内容暂时未能打开。</h1><p>请刷新页面重试。</p><button type="button" class="plain-button" onclick="location.reload()">重新加载</button></div>';
  console.error(error);
}
