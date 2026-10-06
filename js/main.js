const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const pages=$$('.page'), wipe=$('#wipe'), menu=$('#menu');
let soundOn=false,audio=null;
let currentPageIndex=Math.max(0,pages.findIndex(p=>p.classList.contains('active')));
let pageBusy=false;
let pageBusyUntil=0;
const pageIds=pages.map(p=>p.id);

/* V14 — opening animation: one falling red dot grows into a full-screen matrix */
const introScreen=$('#introScreen'), introGrid=$('#introGrid'), introSkip=$('#introSkip');
let introFinished=false;

function buildIntroMatrix(){
  if(!introGrid)return;
  const mobile=innerWidth<=850;
  const cols=mobile?10:18;
  const rows=Math.max(10,Math.ceil(innerHeight/(mobile?42:54)));
  const gapX=innerWidth/(cols+1);
  const gapY=innerHeight/(rows+1);
  const frag=document.createDocumentFragment();
  const total=cols*rows;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const dot=document.createElement('i');
      dot.className='intro-grid-dot';
      const x=(c+1)*gapX-innerWidth/2;
      const y=(r+1)*gapY-innerHeight/2;
      const dist=Math.hypot(x/(innerWidth*.7),y/(innerHeight*.7));
      const wave=Math.min(.52,dist*.24);
      const jitter=(Math.random()-.5)*.08;
      dot.style.setProperty('--x',`${x.toFixed(1)}px`);
      dot.style.setProperty('--y',`${y.toFixed(1)}px`);
      dot.style.setProperty('--delay',`${(.58+wave+jitter).toFixed(3)}s`);
      frag.appendChild(dot);
    }
  }
  introGrid.replaceChildren(frag);
}
function finishIntro(){
  if(introFinished||!introScreen)return;
  introFinished=true;
  introScreen.classList.add('is-exiting');
  document.body.classList.remove('intro-lock');
  setTimeout(()=>introScreen.classList.add('is-finished'),560);
}
function startIntro(){
  if(!introScreen)return;
  document.body.classList.add('intro-lock');
  buildIntroMatrix();
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(reduced){setTimeout(finishIntro,420);return;}
  setTimeout(finishIntro,2450);
}
introSkip?.addEventListener('click',e=>{e.stopPropagation();finishIntro();});
introScreen?.addEventListener('click',e=>{
  if(performance.now()<650)return;
  finishIntro();
});
addEventListener('resize',()=>{
  if(!introFinished)buildIntroMatrix();
});
startIntro();


function tone(freq=300,d=.07,vol=.025,type='sine'){
 if(!soundOn)return;
 audio ||= new (window.AudioContext||window.webkitAudioContext)();
 const o=audio.createOscillator(),g=audio.createGain();
 o.type=type;o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(audio.destination);
 o.start();g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.stop(audio.currentTime+d);
}
$('#sound').onclick=()=>{soundOn=!soundOn;$('#sound b').textContent=soundOn?'ON':'OFF';tone(440,.1,.03,'triangle')};

function updatePageIndex(id){
 const i=pageIds.indexOf(id);
 if(i>=0)currentPageIndex=i;
}

function showPage(id,direction){
 const next=$('#'+id);
 if(!next || next.classList.contains('active') || pageBusy)return;
 const current=pages.find(p=>p.classList.contains('active'));
 const nextIndex=pageIds.indexOf(id);
 const currentIndex=current?pages.indexOf(current):currentPageIndex;
 const dir=direction || (nextIndex>currentIndex?'next':'prev');
 pageBusy=true;
 pageBusyUntil=performance.now()+520;
 if(current){
   current.classList.remove('page-leave-next','page-leave-prev');
   void current.offsetWidth;
   current.classList.add(dir==='next'?'page-leave-next':'page-leave-prev');
 }
 setTimeout(()=>{
   pages.forEach(p=>{p.classList.remove('active','page-leave-next','page-leave-prev','page-enter-next','page-enter-prev');});
   next.classList.add('active',dir==='next'?'page-enter-next':'page-enter-prev');
   updatePageIndex(id);
   window.scrollTo({top:0,left:0,behavior:'instant'});
   next.scrollTop=0;
   menu.classList.remove('open');
   $('#lifeDetail')?.classList.remove('show');
   $('#workModal')?.classList.remove('open');
   if(id==='dots') startDots();
   if(id==='infinity') initRoom();
   tone(dir==='next'?190:150,.08,.015,'triangle');
   setTimeout(()=>next.classList.remove('page-enter-next','page-enter-prev'),620);
 },230);
 setTimeout(()=>{pageBusy=false},540);
}
$$('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page));

// ABOUT 页红色半圆：点击或拖拽后触发回到首页的覆盖式转场
const portraitHalo = $('.portrait-halo');
if (portraitHalo) {
  let haloDragging = false;
  let haloStartX = 0, haloStartY = 0;
  let haloMoved = false;
  portraitHalo.addEventListener('pointerdown', e => {
    if (!$('#about').classList.contains('active')) return;
    haloDragging = true;
    haloMoved = false;
    haloStartX = e.clientX;
    haloStartY = e.clientY;
    portraitHalo.setPointerCapture?.(e.pointerId);
    portraitHalo.classList.add('dragging');
    e.preventDefault();
  });
  portraitHalo.addEventListener('pointermove', e => {
    if (!haloDragging) return;
    const dx = e.clientX - haloStartX;
    const dy = e.clientY - haloStartY;
    if (Math.hypot(dx, dy) > 10) haloMoved = true;
    const pull = Math.min(70, Math.hypot(dx, dy) * .16);
    portraitHalo.style.setProperty('--drag-x', `${dx * .12}px`);
    portraitHalo.style.setProperty('--drag-y', `${dy * .12}px`);
    portraitHalo.style.setProperty('--drag-scale', (1 + pull / 900).toFixed(3));
  });
  const releaseHalo = e => {
    if (!haloDragging) return;
    haloDragging = false;
    portraitHalo.classList.remove('dragging');
    portraitHalo.style.removeProperty('--drag-x');
    portraitHalo.style.removeProperty('--drag-y');
    portraitHalo.style.removeProperty('--drag-scale');
    // 点击和拖拽都返回首页；拖拽会带出更明显的红色扩张感
    showPage('home');
    tone(220,.12,.025,'triangle');
  };
  portraitHalo.addEventListener('pointerup', releaseHalo);
  portraitHalo.addEventListener('pointercancel', releaseHalo);
}

// 首页红色圆球：保留自由拖拽；单击时让大圆球收束成顶部品牌小红点，并丝滑进入 LIFE。
const heroOrb=$('#heroOrb');
const heroTransitionDot=$('#heroTransitionDot');
if(heroOrb){
  let orbDragging=false, orbMoved=false, dragOffsetX=0, dragOffsetY=0;
  const moveOrb=(x,y)=>{
    const r=heroOrb.getBoundingClientRect();
    const left=Math.max(8,Math.min(innerWidth-r.width-8,x-r.width/2));
    const top=Math.max(82,Math.min(innerHeight-r.height-8,y-r.height/2));
    heroOrb.style.left=left+'px'; heroOrb.style.top=top+'px'; heroOrb.style.right='auto';
  };
  heroOrb.addEventListener('pointerdown',e=>{
    if(!$('#home').classList.contains('active'))return;
    orbDragging=true; orbMoved=false;
    const r=heroOrb.getBoundingClientRect();
    dragOffsetX=e.clientX-r.left-r.width/2; dragOffsetY=e.clientY-r.top-r.height/2;
    heroOrb.setPointerCapture?.(e.pointerId); heroOrb.classList.add('dragging'); e.preventDefault();
  });
  heroOrb.addEventListener('pointermove',e=>{
    if(!orbDragging)return;
    if(Math.hypot(e.clientX-(heroOrb.getBoundingClientRect().left+heroOrb.offsetWidth/2),e.clientY-(heroOrb.getBoundingClientRect().top+heroOrb.offsetHeight/2))>2)orbMoved=true;
    moveOrb(e.clientX-dragOffsetX,e.clientY-dragOffsetY);
  });
  const releaseOrb=()=>{
    if(!orbDragging)return;
    orbDragging=false; heroOrb.classList.remove('dragging');
  };
  heroOrb.addEventListener('pointerup',releaseOrb); heroOrb.addEventListener('pointercancel',releaseOrb);
  heroOrb.addEventListener('click',e=>{
    if(orbMoved){orbMoved=false;return;}
    if(pageBusy || !$('#home').classList.contains('active'))return;
    const r=heroOrb.getBoundingClientRect();
    if(heroTransitionDot){
      const brandDot=$('.brand-dot')?.getBoundingClientRect();
      const sx=r.left+r.width/2, sy=r.top+r.height/2;
      const tx=brandDot?brandDot.left+brandDot.width/2:38;
      const ty=brandDot?brandDot.top+brandDot.height/2:32;
      heroTransitionDot.style.left=r.left+'px';
      heroTransitionDot.style.top=r.top+'px';
      heroTransitionDot.style.width=r.width+'px';
      heroTransitionDot.style.height=r.height+'px';
      heroTransitionDot.style.setProperty('--dx',(tx-sx)+'px');
      heroTransitionDot.style.setProperty('--dy',(ty-sy)+'px');
      heroTransitionDot.style.setProperty('--target-scale',String((brandDot?.width||15)/r.width));
      heroTransitionDot.classList.remove('play');
      void heroTransitionDot.offsetWidth;
      heroTransitionDot.classList.add('play');
    }
    heroOrb.classList.add('orb-leaving');
    setTimeout(()=>showPage('life','next'),90);
    setTimeout(()=>{
      heroOrb.classList.remove('orb-leaving');
      if(heroTransitionDot)heroTransitionDot.classList.remove('play');
    },820);
    tone(360,.1,.025,'sine');
  });
}

// 通用章节滚动：保持原版的自然滚动感，只在章节边界做轻柔切换。
const scrollableIds=new Set(['life','works','orb','about']);
let wheelLock=0;
function canMoveFromScrollable(el,delta){
 const top=el.scrollTop;
 const max=Math.max(0,el.scrollHeight-el.clientHeight);
 if(delta>0) return top>=max-8;
 return top<=8;
}
function moveChapter(delta){
 if(pageBusy)return;
 const now=performance.now();
 if(now-wheelLock<520 || now<pageBusyUntil)return;
 const active=pages[currentPageIndex];
 if(!active)return;
 const id=active.id;
 if(scrollableIds.has(id) && !canMoveFromScrollable(active,delta))return;
 const nextIndex=Math.max(0,Math.min(pageIds.length-1,currentPageIndex+(delta>0?1:-1)));
 if(nextIndex===currentPageIndex)return;
 wheelLock=now;
 showPage(pageIds[nextIndex],delta>0?'next':'prev');
}
window.addEventListener('wheel',e=>{
 if(menu.classList.contains('open') || $('#workModal')?.classList.contains('open') || $('#lifeDetail')?.classList.contains('show'))return;
 if(Math.abs(e.deltaY)<12)return;
 const active=pages[currentPageIndex];
 if(!active)return;
 if(active.id==='orb'){
   // Orb 内部自己的作品滚动优先，页面边界时才离开本章节。
   if(e.target.closest('#orbStage'))return;
 }
 const delta=e.deltaY;
 const id=active.id;
 if(scrollableIds.has(id)){
   if(!canMoveFromScrollable(active,delta))return;
 }
 e.preventDefault();
 moveChapter(delta);
},{passive:false});

let touchStartY=0,touchStartX=0,touchActive=false;
window.addEventListener('touchstart',e=>{
 if(e.touches.length!==1)return;
 touchStartY=e.touches[0].clientY;touchStartX=e.touches[0].clientX;touchActive=true;
},{passive:true});
window.addEventListener('touchend',e=>{
 if(!touchActive)return; touchActive=false;
 const t=e.changedTouches[0]; if(!t)return;
 const dy=t.clientY-touchStartY,dx=t.clientX-touchStartX;
 if(Math.abs(dy)<55 || Math.abs(dy)<Math.abs(dx)*1.15)return;
 const active=pages[currentPageIndex]; if(!active)return;
 if(scrollableIds.has(active.id) && !canMoveFromScrollable(active,dy<0?1:-1))return;
 moveChapter(dy<0?1:-1);
},{passive:true});

// LIFE 时间线：点击左侧红点展开对应事件详情。
const lifeEvents=[
 {k:'01 / 1929',title:'松本 · 早年',text:'1929年出生于日本长野县松本市。童年时期开始绘画，并逐渐形成对重复图案、圆点与网状结构的持续关注。',meta:'关键词：松本 / 早期绘画 / 波点 / 网状图案'},
 {k:'02 / 1957—58',title:'纽约 · 转向前卫艺术',text:'1957年赴美国，随后在纽约展开创作。网络绘画、软雕塑与空间实践逐渐成为她艺术语言的重要部分。',meta:'关键词：纽约 / 网络绘画 / 软雕塑 / 空间实践'},
 {k:'03 / 1960s',title:'重复 · 增殖 · 自我消融',text:'1960年代，她将重复从画布扩展到身体、物件与空间。镜面、灯光和软雕塑共同构成沉浸式环境，“自我消融”成为重要观念。',meta:'关键词：重复 / 增殖 / 镜面 / 自我消融'},
 {k:'04 / 1973—',title:'回到日本 · 跨媒介创作',text:'1973年返回日本后继续绘画、写作与装置创作，并持续推进大型环境作品与 Infinity Mirror Room 系列。',meta:'关键词：日本 / 绘画 / 写作 / Infinity Mirror Room'},
 {k:'05 / 2017—2026',title:'无限持续',text:'2017年东京草间弥生美术馆开馆。此后她持续以绘画、雕塑、装置等媒介发展“无限”的视觉体系，直至2026年。',meta:'关键词：美术馆 / 无限镜屋 / 装置 / 晚期创作'}
];
const lifeDetail=$('#lifeDetail');
function openLifeDetail(i){
 const d=lifeEvents[i]; if(!d||!lifeDetail)return;
 $('#lifeDetailKicker').textContent=d.k; $('#lifeDetailTitle').textContent=d.title; $('#lifeDetailText').textContent=d.text; $('#lifeDetailMeta').textContent=d.meta;
 lifeDetail.classList.add('show'); lifeDetail.setAttribute('aria-hidden','false'); tone(320,.08,.018,'triangle');
}
$$('.life-list article').forEach((article,i)=>article.querySelector('.life-dot-trigger')?.addEventListener('click',e=>{e.stopPropagation();openLifeDetail(i)}));
$('#lifeDetailClose')?.addEventListener('click',()=>{lifeDetail.classList.remove('show');lifeDetail.setAttribute('aria-hidden','true')});

$('#menuOpen').onclick=()=>{menu.classList.add('open');tone(330,.05,.02)};
$('#menuClose').onclick=()=>menu.classList.remove('open');
$('#menuNext').onclick=()=>showPage('life');
document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.classList.remove('open');$('#workModal').classList.remove('open')}});

let mx=innerWidth/2,my=innerHeight/2,tx=mx,ty=my;
const cursor=$('#cursor');
window.addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;if(innerWidth>850)cursor.style.display='block'});
function cursorLoop(){
 mx+=(tx-mx)*.18;my+=(ty-my)*.18;cursor.style.left=mx+'px';cursor.style.top=my+'px';
 const orb=$('.orbit-b'); if(orb && $('#home').classList.contains('active')){orb.style.transform=`translate(${(mx/innerWidth-.5)*24}px,${(my/innerHeight-.5)*24}px)`;}
 requestAnimationFrame(cursorLoop);
} cursorLoop();

const bg=$('#bgCanvas'),bctx=bg.getContext('2d',{alpha:true});
let bgPts=[];
function resizeBg(){
 const d=Math.min(devicePixelRatio||1,1.5),w=innerWidth,h=innerHeight;bg.width=w*d;bg.height=h*d;bg.style.width=w+'px';bg.style.height=h+'px';bctx.setTransform(d,0,0,d,0,0);
 const n=innerWidth<700?34:70;bgPts=Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,r:4+Math.random()*28,vx:(Math.random()-.5)*.08,vy:(Math.random()-.5)*.08,a:.035+Math.random()*.055}));
} resizeBg();addEventListener('resize',resizeBg);
function drawBg(){
 bctx.clearRect(0,0,innerWidth,innerHeight);
 for(const p of bgPts){p.x+=p.vx;p.y+=p.vy;if(p.x<-50)p.x=innerWidth+50;if(p.x>innerWidth+50)p.x=-50;if(p.y<-50)p.y=innerHeight+50;if(p.y>innerHeight+50)p.y=-50;
  bctx.beginPath();bctx.arc(p.x,p.y,p.r,0,Math.PI*2);bctx.fillStyle=`rgba(20,20,20,${p.a})`;bctx.fill();
 }
 requestAnimationFrame(drawBg);
}drawBg();

let dotRAF=null,dots=[],dotCtx=$('#dotCanvas').getContext('2d');
let dotRunning=false,dotW=0,dotH=0;
function resizeDot(){dotW=innerWidth;dotH=innerHeight;const d=Math.min(devicePixelRatio||1,1.5);$('#dotCanvas').width=dotW*d;$('#dotCanvas').height=dotH*d;dotCtx.setTransform(d,0,0,d,0,0)}
resizeDot();addEventListener('resize',resizeDot);
function seedDots(){
 dots=[];const n=innerWidth<700?48:85;
 for(let i=0;i<n;i++)dots.push({x:Math.random()*dotW,y:Math.random()*dotH,r:3+Math.random()*18,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,c:i%9===0?'#f2cf16':(i%4===0?'#f7f5ef':'#e5222e'),a:.28+Math.random()*.55});
}
function startDots(){
 if(dotRunning)return;dotRunning=true;seedDots();
 const loop=()=>{
  if(!$('#dots').classList.contains('active')){dotRunning=false;return}
  dotCtx.clearRect(0,0,dotW,dotH);
  for(const p of dots){
   const dx=p.x-tx,dy=p.y-ty,dist=Math.hypot(dx,dy);
   if(dist<130&&dist>0){p.vx+=dx/dist*.025;p.vy+=dy/dist*.025}
   p.vx*=.985;p.vy*=.985;p.x+=p.vx;p.y+=p.vy;
   if(p.x<-30)p.x=dotW+30;if(p.x>dotW+30)p.x=-30;if(p.y<-30)p.y=dotH+30;if(p.y>dotH+30)p.y=-30;
   dotCtx.beginPath();dotCtx.arc(p.x,p.y,p.r,0,Math.PI*2);dotCtx.fillStyle=p.c;dotCtx.globalAlpha=p.a;dotCtx.fill();
  }
  dotCtx.globalAlpha=1;$('#dotCount').textContent=dots.length;dotRAF=requestAnimationFrame(loop);
 };loop();
}
$('#dotCanvas').addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY});
$('#dotCanvas').addEventListener('pointerdown',e=>{
 if(!$('#dots').classList.contains('active'))return;
 const x=e.clientX,y=e.clientY;
 for(let i=0;i<14;i++){
  const angle=Math.random()*Math.PI*2;
  const speed=1+Math.random()*4;
  dots.push({x:x+Math.cos(angle)*20,y:y+Math.sin(angle)*20,r:3+Math.random()*16,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,c:i%4?'#e5222e':'#fff',a:.8});
}
 $('#dotHint').style.opacity=.25;tone(520,.08,.02,'sine');
 if(dots.length>130){$('#dotPanel').classList.add('show');}
});
$('#dotPanel button').onclick=()=>$('#dotPanel').classList.remove('show');

const data={
 surface:{type:'OBJECT STUDY',title:'Dot Surface',text:'波点覆盖器物表面后，日常形体被转化为强烈的视觉符号。',key:['OBJECT','SURFACE','DOT'],img:'assets/blue-vase.jpg'},
 fish:{type:'PATTERN STUDY',title:'Dot Language',text:'鲜明色彩与重复圆点形成密集节奏，展示波点如何从单一符号扩展为完整的视觉语言。',key:['PATTERN','COLOR','DOT'],img:'assets/fish-dot.jpg'},
 flower:{type:'SCULPTURE / SPACE',title:'Color Space',text:'大型彩色形体把波点从平面推向空间，让观看者在形体与环境之间移动。',key:['SCULPTURE','SPACE','COLOR'],img:'assets/flower-installation.jpg'},
 gallery:{type:'EXHIBITION',title:'Infinite Wall',text:'大量不同尺度的图案并置，让重复、差异与观看路径同时成为展览体验的一部分。',key:['EXHIBITION','PATTERN','VIEWING'],img:'assets/dot-gallery.jpg'},
 mirror:{type:'INSTALLATION',title:'Infinity Mirror Room',text:'镜面、光线与重复的波点共同构成无限感。观者进入空间后，边界被反射不断延伸，观看本身成为作品体验的一部分。',key:['MIRROR','SPACE','INFINITY'],img:'assets/infinity-room.jpg'},
 yellow:{type:'SCULPTURE / ENVIRONMENT',title:'Yellow Polka Dot',text:'黄色与黑色波点覆盖大型形体，使物体从日常尺度进入一种强烈的视觉环境。',key:['DOT','FORM','ENVIRONMENT'],img:'assets/yellow-sculpture.jpg'},
 pumpkin:{type:'SCULPTURE',title:'Pumpkin',text:'南瓜是草间弥生反复使用的意象之一。鲜明的颜色、圆润的形体和波点覆盖，让自然形体变成高度辨识的视觉符号。',key:['PUMPKIN','DOT','SCULPTURE'],img:'assets/red-pumpkin.jpg'},
 nets:{type:'PAINTING',title:'Infinity Nets',text:'“无限网”系列以连续、重复的笔触构成网状表面。它把绘画从单一图像推向一种几乎没有终点的视觉结构。',key:['NET','REPETITION','INFINITY']},
 dotsobs:{type:'PERFORMANCE / DOTS',title:'Dots Obsession',text:'波点不只停留在画布或物体表面，也进入身体、服装与空间。重复的圆点让个体与环境之间的边界变得模糊。',key:['BODY','DOTS','OBLITERATION'],img:'assets/dot-performance.jpg'},
 garden:{type:'INSTALLATION',title:'Narcissus Garden',text:'镜面球体形成连续的反射表面。观者在作品中看到自己，也看到环境与他人的观看行为。',key:['MIRROR','REFLECTION','SELF']}
};
function openWork(key){
 const d=data[key],visual=$('#modalVisual');visual.innerHTML='';
 if(d.img){const im=document.createElement('img');im.src=d.img;im.alt=d.title;visual.appendChild(im)}
 else {visual.className='modal-visual';visual.innerHTML=key==='nets'?'<div style="height:100%;background:radial-gradient(circle,#111 0 2px,transparent 3px);background-size:16px 16px"></div>':'<div style="height:100%;background:radial-gradient(circle,#fff 0 40px,transparent 41px),#1739b7"></div>'}
 $('#modalType').textContent=d.type;$('#modalTitle').textContent=d.title;$('#modalText').textContent=d.text;
 $('#modalKey').innerHTML=d.key.map(x=>`<span>${x}</span>`).join('');
 $('#workModal').classList.add('open');tone(280,.08,.02);
}
$$('.work-card').forEach(c=>c.onclick=()=>openWork(c.dataset.key));
$('.modal-close').onclick=()=>$('#workModal').classList.remove('open');
$('#workModal').onclick=e=>{if(e.target.id==='workModal')e.currentTarget.classList.remove('open')};

let roomReady=false;
function initRoom(){
 if(roomReady)return;roomReady=true;
 const box=$('#roomDots');
 for(let i=0;i<12;i++){createRoomDot(Math.random()*80+10,Math.random()*70+10);}
}
function createRoomDot(x,y){
 const box=$('#roomDots');
 const d=document.createElement('i');
 d.className='room-dot';
 d.style.left=x+'%'; d.style.top=y+'%';
 const s=6+Math.random()*18; d.style.width=d.style.height=s+'px';
 d.onclick=(e)=>{e.stopPropagation();
   for(let i=0;i<6;i++){
    createRoomDot(x+(Math.random()-.5)*18,y+(Math.random()-.5)*18);
   }
   d.classList.add('burst'); setTimeout(()=>d.classList.remove('burst'),500);
 };
 box.appendChild(d);
}
$('#mirrorDots')?.addEventListener('click',e=>{
 const x=e.offsetX/e.currentTarget.clientWidth*100;
 const y=e.offsetY/e.currentTarget.clientHeight*100;
 for(let i=0;i<10;i++) createRoomDot(x+(Math.random()-.5)*15,y+(Math.random()-.5)*15);
});
$('#multiply').onclick=()=>{
 initRoom();const box=$('#roomDots');
 for(let i=0;i<18;i++){const d=document.createElement('i');d.className='room-dot';d.style.left=(20+Math.random()*70)+'%';d.style.top=(10+Math.random()*82)+'%';d.style.width=d.style.height=(4+Math.random()*12)+'px';box.appendChild(d)}
 tone(100,.18,.02,'sawtooth');
 // intentionally never clear: the room is an open-ended multiplication field
};
$('#room').addEventListener('pointermove',e=>{
 if(!$('#infinity').classList.contains('active'))return;
 const rx=(e.clientX/innerWidth-.5)*16,ry=(e.clientY/innerHeight-.5)*10;
 $('#room').style.transform=`translate(${rx}px,${ry}px)`;
});
$('#room').addEventListener('pointerdown',e=>{
 if(!$('#infinity').classList.contains('active'))return;
 if(e.target.classList.contains('room-dot')) return;
 const rect=$('#room').getBoundingClientRect();
 const x=(e.clientX-rect.left)/rect.width*100, y=(e.clientY-rect.top)/rect.height*100;
 for(let i=0;i<12;i++){
   const a=Math.random()*Math.PI*2, r=2+Math.random()*12;
   createRoomDot(x+Math.cos(a)*r,y+Math.sin(a)*r);
 }
 tone(560,.045,.012,'sine');
});

// Scroll-driven text reveal: text darkens as it passes through the reading zone.
const revealTexts=[...document.querySelectorAll('.reveal-text')];
function updateReveal(){
 const vh=innerHeight;
 revealTexts.forEach(el=>{
   const box=el.getBoundingClientRect();
   const center=box.top+box.height*.5;
   const t=Math.max(0,Math.min(1,1-Math.abs(center-vh*.55)/(vh*.55)));
   el.style.setProperty('--reveal',t.toFixed(3));
 });
}
addEventListener('scroll',updateReveal,{passive:true});
addEventListener('resize',updateReveal);
updateReveal();


/* LINGMU V13 — pinned editorial array: blank → reveal → spread → drift */
const orbWorks=[
 {title:'Infinity Mirror Room',type:'INSTALLATION / MIRROR / INFINITY',desc:'镜面、光线与重复的波点共同构成无限感。作品成为阵列中的第一个入口。',img:'assets/infinity-room.jpg'},
 {title:'Yellow Polka Dot',type:'SCULPTURE / ENVIRONMENT / DOT',desc:'黄色与黑色的重复圆点覆盖形体，让雕塑从单一物体变成完整的视觉环境。',img:'assets/yellow-sculpture.jpg'},
 {title:'Pumpkin',type:'SCULPTURE / PUMPKIN / DOT',desc:'南瓜成为反复出现的视觉意象，圆润形体与波点覆盖形成强烈的视觉识别。',img:'assets/red-pumpkin.jpg'},
 {title:'Dot Surface',type:'OBJECT / SURFACE / REPETITION',desc:'当波点覆盖日常器物，表面本身成为观看的焦点，重复把普通形体转化为视觉符号。',img:'assets/blue-vase.jpg'},
 {title:'Infinity Mirror Rooms',type:'VIDEO / INSTALLATION / MOVING IMAGE',desc:'动态影像让作品从静态观看进入真实的空间节奏，成为阵列中的运动节点。',video:'https://www.youtube.com/embed/bT7i507OnOw?autoplay=1&mute=1&loop=1&playlist=bT7i507OnOw&rel=0&modestbranding=1'},
 {title:'Dot Language',type:'PATTERN / COLOR / SYMBOL',desc:'鲜明色彩与不同尺度的圆点形成密集节奏，展示波点如何从单一符号扩展成视觉语言。',img:'assets/fish-dot.jpg'},
 {title:'Color Space',type:'SCULPTURE / SPACE / EXPERIENCE',desc:'大型彩色形体把波点从平面推向空间，观看者在形体、颜色与环境之间移动。',img:'assets/flower-installation.jpg'},
 {title:'Infinite Wall',type:'EXHIBITION / PATTERN / VIEWING',desc:'大量不同尺度的图案并置，让重复、差异与观看路径同时成为展览体验的一部分。',img:'assets/dot-gallery.jpg'}
];
let orbIndex=0, orbLastNearest=-1, orbArrayReady=false, orbArrayRaf=0;
let orbTargetProgress=0, orbVisualProgress=0;
const orbPage=$('#orb'), orbTrack=$('#orbArrayTrack'), orbField=$('#orbStage');
const orbCopy=$('.array-copy');

function buildOrbArray(){
 if(!orbTrack || orbArrayReady)return;
 orbTrack.innerHTML=orbWorks.map((d,i)=>{
   const media=d.video
    ? `<iframe src="${d.video}" title="${d.title}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture"></iframe>`
    : `<img src="${d.img}" alt="${d.title}" loading="lazy">`;
   return `<article class="array-card" data-array-index="${i}">
      <div class="array-card-media">${media}</div>
      <div class="array-card-bloom"></div><span class="array-red-dot"></span>
      <div class="array-card-info"><div class="num">${String(i+1).padStart(2,'0')} / 08</div><h3>${d.title}</h3><p>${d.type}</p></div>
    </article>`;
 }).join('');
 orbArrayReady=true;
 $$('.array-card').forEach(card=>card.addEventListener('click',()=>{
   const i=Number(card.dataset.arrayIndex);
   if(!Number.isFinite(i))return;
   const max=Math.max(1,orbPage.scrollHeight-orbPage.clientHeight);
   orbPage.scrollTo({top:max*(0.08+i*.105),behavior:'smooth'});
 }));
}
function lerp(a,b,t){return a+(b-a)*t}
function clamp01(v){return Math.max(0,Math.min(1,v))}
function ease(v){v=clamp01(v);return v*v*(3-2*v)}
function expo(v){v=clamp01(v);return 1-Math.pow(1-v,4)}

function updateOrbTarget(){
 if(!orbPage)return;
 const max=Math.max(1,orbPage.scrollHeight-orbPage.clientHeight);
 orbTargetProgress=clamp01(orbPage.scrollTop/max);
}
function updateOrbArray(){
 if(!orbPage || !orbArrayReady)return;
 // Lenis-like visual damping without hijacking native scroll.
 orbVisualProgress += (orbTargetProgress-orbVisualProgress)*.075;
 if(Math.abs(orbTargetProgress-orbVisualProgress)<.00015)orbVisualProgress=orbTargetProgress;
 const raw=orbVisualProgress;
 const cards=$$('.array-card');
 const fieldW=orbField?.clientWidth||innerWidth*.66;
 const fieldH=orbField?.clientHeight||innerHeight*.86;
 const cardW=Math.min(Math.max(150,innerWidth*.135),255);
 const cardH=Math.min(Math.max(220,innerHeight*.45),410);
 const cols=4,rows=2;
 const gapX=Math.max(18,(fieldW-cardW*cols)/(cols-1));
 const gapY=Math.max(20,(fieldH-cardH*rows)/(rows-1));
 const gridW=cardW*cols+gapX*(cols-1), gridH=cardH*rows+gapY*(rows-1);
 const startX=(fieldW-gridW)/2, startY=(fieldH-gridH)/2;
 const centerX=fieldW*.55-cardW/2, centerY=fieldH*.47-cardH/2;
 // The first ~55% is the reveal. The remaining scroll subtly pans the finished field.
 const spread=expo(clamp01((raw-.055)/.52));
 const camera=clamp01((raw-.48)/.52);
 let nearest=0,nearestScore=Infinity;
 cards.forEach((card,i)=>{
   const col=i%cols,row=Math.floor(i/cols);
   const gx=startX+col*(cardW+gapX);
   const gy=startY+row*(cardH+gapY);
   // staggered reveal: each card wakes slightly after the previous one
   const local=ease(clamp01((raw-(.055+i*.018))/.24));
   const reveal=local*.78+spread*.22;
   const driftX=Math.sin((i+1)*1.7+camera*2.5)*18*spread;
   const driftY=Math.cos((i+2)*1.3+camera*2.2)*12*spread;
   const x=lerp(centerX,gx,spread)+driftX-(camera*(col-.9)*38);
   const y=lerp(centerY,gy,spread)+driftY-(camera*(row-.5)*16);
   const entryX=(i%2?1:-1)*(38+18*i)*(1-local);
   const entryY=(i<4?-1:1)*(22+10*i)*(1-local);
   const scale=lerp(.72,.91+((i===orbIndex)?.05:0),reveal);
   const angle=lerp((i-3.5)*7,(col-1.5)*.45+(row?.7:-.7),spread);
   const opacity=clamp01(.02+reveal*.98);
   const blur=Math.max(0,(1-reveal)*5);
   const depth=Math.abs(i-(camera*7));
   const focus=Math.max(0,1-depth/2.7);
   card.style.transform=`translate3d(${x+entryX}px,${y+entryY}px,0) rotate(${angle}deg) scale(${scale})`;
   card.style.opacity=opacity.toFixed(3);
   card.style.zIndex=20+Math.round(focus*25);
   card.style.filter=`blur(${blur.toFixed(2)}px) saturate(${.76+focus*.24}) brightness(${.72+focus*.28})`;
   card.style.pointerEvents=opacity>.45?'auto':'none';
   const score=Math.abs(i-(camera*7));
   if(score<nearestScore){nearestScore=score;nearest=i;}
 });
 const copyReveal=ease(clamp01((raw-.04)/.22));
 if(orbCopy){orbCopy.style.opacity=copyReveal.toFixed(3);orbCopy.style.transform=`translate3d(${(1-copyReveal)*-18}px,${(1-copyReveal)*10}px,0)`;}
 const cross=$('.array-crosshair'); if(cross)cross.style.opacity=(copyReveal*.75).toFixed(3);
 const grid=orbPage.querySelector('.orb-grid'); if(grid)grid.style.opacity=(copyReveal*.22).toFixed(3);
 const note=orbPage.querySelector('.array-scroll-note'); if(note){note.style.opacity=(.25+copyReveal*.75).toFixed(3);note.style.transform=`translateY(${(1-copyReveal)*10}px)`;}
 orbIndex=nearest;
 const d=orbWorks[nearest];
 const title=$('#orbTitle'),type=$('#orbType'),desc=$('#orbDesc');
 if(title)title.textContent=d.title;if(type)type.textContent=d.type;if(desc)desc.textContent=d.desc;
 const idx=$('#orbIndex');if(idx)idx.textContent=String(nearest+1).padStart(2,'0');
 const progress=$('#orbProgress i');if(progress)progress.style.width=`${Math.max(0,Math.min(100,(camera*7+1)/8*100))}%`;
 const side=$('#orbSideDots');
 if(side && nearest!==orbLastNearest){
   side.innerHTML=orbWorks.map((_,i)=>`<i class="${i===nearest?'active':''}" data-array-dot="${i}"></i>`).join('');
   side.querySelectorAll('i').forEach(dot=>dot.onclick=()=>{const i=Number(dot.dataset.arrayDot);orbPage.scrollTo({top:(orbPage.scrollHeight-orbPage.clientHeight)*(.08+i*.105),behavior:'smooth'});});
   orbLastNearest=nearest;
 }
 cards.forEach((c,i)=>c.classList.toggle('is-active',i===nearest && camera>.08));
 if(Math.abs(orbTargetProgress-orbVisualProgress)>.0002)orbArrayRaf=requestAnimationFrame(updateOrbArray);
 else orbArrayRaf=0;
}
function requestOrbArrayUpdate(){updateOrbTarget();if(!orbArrayRaf)orbArrayRaf=requestAnimationFrame(updateOrbArray)}
function enterOrb(){buildOrbArray();orbPage.scrollTop=0;orbTargetProgress=0;orbVisualProgress=0;orbIndex=0;orbLastNearest=-1;requestOrbArrayUpdate()}
if(orbPage){
 buildOrbArray();
 orbPage.addEventListener('scroll',requestOrbArrayUpdate,{passive:true});
 window.addEventListener('resize',requestOrbArrayUpdate);
}
$$('[data-page="orb"]').forEach(b=>b.addEventListener('click',()=>setTimeout(enterOrb,260)));
