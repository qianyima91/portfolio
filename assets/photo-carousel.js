import {imageAttributes} from './images.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chevron = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function renderPhotoCarousel(photos) {
  const multiple = photos.length > 1;
  return `<div class="photo-carousel" data-photo-carousel tabindex="0" role="region" aria-roledescription="轮播图" aria-label="摄影作品">
    <div class="photo-stage" data-photo-stage>
      <div class="photo-floor" aria-hidden="true"></div>
      ${photos.map((photo,index) => `<button class="photo-card" type="button" data-photo-index="${index}" data-photo-src="${escape(photo.src)}" data-photo-caption="${escape(photo.caption)}" aria-label="查看第${index+1}张摄影作品"><img ${imageAttributes(photo.src,'(max-width: 700px) 84vw, 66vw')} alt="${escape(photo.caption || `摄影作品 ${index+1}`)}" draggable="false"><span class="photo-card-shade" aria-hidden="true"></span></button>`).join('')}
      <button class="photo-arrow photo-prev" type="button" data-photo-step="-1" aria-label="上一张摄影作品" ${multiple?'':'hidden'}>${chevron}</button>
      <button class="photo-arrow photo-next" type="button" data-photo-step="1" aria-label="下一张摄影作品" ${multiple?'':'hidden'}>${chevron}</button>
    </div>
    <div class="photo-footer"><div class="photo-status"><span data-photo-count>01 / ${String(photos.length).padStart(2,'0')}</span><p data-photo-current-caption></p></div>
      <div class="photo-dots" aria-label="选择摄影作品">${photos.map((_,index)=>`<button type="button" data-photo-dot="${index}" aria-label="切换到第${index+1}张摄影作品"></button>`).join('')}</div>
      <div class="photo-footer-actions"><span class="photo-hint">拖动浏览 · 点击放大</span><button class="photo-play" type="button" data-photo-play aria-label="暂停自动轮播" ${multiple?'':'hidden'}>Ⅱ</button></div>
    </div>
  </div>`;
}

export function mountPhotoCarousel(root) {
  if(!root)return ()=>{};
  const cards=[...root.querySelectorAll('[data-photo-index]')];
  const dots=[...root.querySelectorAll('[data-photo-dot]')];
  const stage=root.querySelector('[data-photo-stage]');
  const play=root.querySelector('[data-photo-play]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const removeListeners=[];
  let active=0,paused=reduced.matches,hover=false,focus=false,visible=false;
  let pointer=null,dragging=false,suppressUntil=0;
  function listen(target,event,handler){target.addEventListener(event,handler);removeListeners.push(()=>target.removeEventListener(event,handler));}
  function update() {
    const frontWidth=cards[active].offsetWidth;
    cards.forEach((card,index)=>{
      let offset=(index-active+cards.length)%cards.length;
      if(offset>cards.length/2)offset-=cards.length;
      const distance=Math.abs(offset);
      card.dataset.position=offset===0?'active':distance===1?(offset<0?'left':'right'):'back';
      const spread=frontWidth*.43+card.offsetWidth*.38;
      card.style.setProperty('--photo-x',`${Math.sign(offset)*Math.min(distance,2)*spread}px`);
      card.style.setProperty('--photo-z',`${distance===0?0:distance===1?-195:-390}px`);
      card.style.setProperty('--photo-angle',`${offset===0?0:-Math.sign(offset)*(distance===1?38:52)}deg`);
      card.style.setProperty('--photo-scale',distance===0?'1':distance===1?'.88':'.72');
      card.style.zIndex=String(5-Math.min(distance,3));
      card.tabIndex=offset===0?0:-1;
      card.setAttribute('aria-hidden',distance>1?'true':'false');
      card.setAttribute('aria-label',`${offset===0?'放大查看':'选择'}第${index+1}张摄影作品`);
      if(offset===0){card.dataset.image=card.dataset.photoSrc;card.dataset.caption=card.dataset.photoCaption||`摄影作品 ${index+1}`;}
      else{delete card.dataset.image;delete card.dataset.caption;}
    });
    dots.forEach((dot,index)=>{dot.classList.toggle('active',index===active);if(index===active)dot.setAttribute('aria-current','true');else dot.removeAttribute('aria-current');});
    root.querySelector('[data-photo-count]').textContent=`${String(active+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
    const caption=root.querySelector('[data-photo-current-caption]');caption.textContent=cards[active].dataset.photoCaption;caption.hidden=!caption.textContent;
    play.textContent=paused?'▶':'Ⅱ';play.setAttribute('aria-label',paused?'播放自动轮播':'暂停自动轮播');play.setAttribute('aria-pressed',String(paused));
  }
  function move(step){active=(active+step+cards.length)%cards.length;update();}
  function manualMove(step){paused=true;move(step);}
  listen(root,'click',event=>{
    if(performance.now()<suppressUntil){event.preventDefault();event.stopPropagation();return;}
    const step=event.target.closest('[data-photo-step]');if(step){manualMove(Number(step.dataset.photoStep));return;}
    const dot=event.target.closest('[data-photo-dot]');if(dot){paused=true;active=Number(dot.dataset.photoDot);update();return;}
    if(event.target.closest('[data-photo-play]')){paused=!paused;update();return;}
    const card=event.target.closest('[data-photo-index]');
    if(card){paused=true;if(Number(card.dataset.photoIndex)!==active){event.preventDefault();event.stopPropagation();active=Number(card.dataset.photoIndex);update();}else update();}
  });
  listen(root,'keydown',event=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();manualMove(event.key==='ArrowRight'?1:-1);}
    else if(event.key==='Home'||event.key==='End'){event.preventDefault();paused=true;active=event.key==='Home'?0:cards.length-1;update();}
  });
  listen(root,'pointerenter',()=>hover=true);listen(root,'pointerleave',()=>hover=false);
  listen(root,'focusin',()=>focus=true);listen(root,'focusout',event=>focus=root.contains(event.relatedTarget));
  listen(stage,'pointerdown',event=>{if(event.button!==0||event.target.closest('.photo-arrow'))return;pointer={id:event.pointerId,x:event.clientX,y:event.clientY,dx:0};});
  listen(stage,'pointermove',event=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    pointer.dx=event.clientX-pointer.x;
    if(!dragging&&Math.abs(pointer.dx)>10&&Math.abs(pointer.dx)>Math.abs(event.clientY-pointer.y)){
      dragging=true;stage.setPointerCapture(event.pointerId);stage.classList.add('is-dragging');
    }
    if(dragging){event.preventDefault();stage.style.setProperty('--photo-drag',`${Math.max(-38,Math.min(38,pointer.dx*.16))}px`);}
  });
  function release(event){
    if(!pointer||pointer.id!==event.pointerId)return;
    if(dragging){suppressUntil=performance.now()+350;if(event.type!=='pointercancel'&&Math.abs(pointer.dx)>40)manualMove(pointer.dx<0?1:-1);}
    stage.style.setProperty('--photo-drag','0px');stage.classList.remove('is-dragging');
    if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);
    pointer=null;dragging=false;
  }
  listen(stage,'pointerup',release);listen(stage,'pointercancel',release);
  const observer=new IntersectionObserver(entries=>visible=entries[0].isIntersecting,{threshold:.2});observer.observe(root);
  cards.forEach(card=>{
    const image=card.querySelector('img');
    function sizeImage(){if(!image.naturalWidth||!image.naturalHeight)return;const ratio=image.naturalWidth/image.naturalHeight;card.style.setProperty('--photo-ratio',String(ratio));card.dataset.orientation=ratio>1?'landscape':'portrait';update();}
    listen(image,'load',sizeImage);if(image.complete)sizeImage();
  });
  const resizeObserver=new ResizeObserver(update);resizeObserver.observe(stage);
  const timer=cards.length>1?setInterval(()=>{if(visible&&!paused&&!hover&&!focus&&!document.hidden&&!document.querySelector('dialog[open]'))move(1);},4500):null;
  update();
  return ()=>{if(timer)clearInterval(timer);observer.disconnect();resizeObserver.disconnect();removeListeners.forEach(remove=>remove());};
}
