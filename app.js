const app = document.getElementById('app');
const CROWD_ICON = {family:"👨‍👩‍👧",couple:"💕",solo:"🧭",senior:"🌿",student:"🎒",photo:"📷",foodie:"🍜",outdoor:"⛰️"};
const THEME_ICON = {nature:"🏔️",history:"🏛️",seaside:"🏖️",ancient:"🏚️",city:"🏙️",food:"🍴",outdoor:"🥾",folk:"🎭",culture:"🎨"};
const SEASON_ICON = {spring:"🌸",summer:"☀️",autumn:"🍂",winter:"❄️"};
const TABS = ['guide','trip','photo','cost','journal'];


function goHome(){ document.getElementById('searchInput').value=''; renderHome(); }

function applyTab(tab){
  document.getElementById('app').classList.toggle('hidden', tab!=='guide');
  document.getElementById('searchBox').classList.toggle('hidden', tab!=='guide');
  document.getElementById('tripView').classList.toggle('hidden', tab!=='trip');
  document.getElementById('photoWall').classList.toggle('hidden', tab!=='photo');
  document.getElementById('costView').classList.toggle('hidden', tab!=='cost');
  document.getElementById('journalView').classList.toggle('hidden', tab!=='journal');
  TABS.forEach(t=>{
    const btn = document.getElementById('tab-'+t);
    btn.classList.toggle('active', t===tab);
    btn.setAttribute('aria-selected', t===tab?'true':'false');
  });
  if(tab==='guide') goHome();
}

function showTab(tab){
  const hash = '#'+tab;
  if(location.hash !== hash) location.hash = hash;
  else applyTab(tab);
}

window.addEventListener('hashchange', ()=>{
  const tab = TABS.find(t => location.hash === '#'+t) || 'guide';
  applyTab(tab);
});

function renderHome(){
  document.getElementById('cityCount').textContent = CITIES.length;
  let html = `<div class="hero"><h1>不知道去哪儿？先告诉我你是谁 👇</h1><p>选一个人群标签，或按主题、季节挑，我们帮你把城市分好类</p></div>`;

  // 人群
  html += `<div class="section-title">你是哪种旅行者？</div><div class="tag-grid">`;
  Object.keys(CROWDS).forEach(k=>{
    if(k==='outdoor'||k==='foodie') return;
    const n = CITIES.filter(c=>c.crowds.includes(k)).length;
    if(n<5) return;
    html += `<div class="tag-card" data-act="crowd" data-key="${k}"><span class="icon">${CROWD_ICON[k]}</span><div class="label">${CROWDS[k]}</div><div class="count">${n} 个城市</div></div>`;
  });
  html += `</div>`;

  // 主题
  html += `<div class="section-title">想玩什么？</div><div class="tag-grid">`;
  Object.keys(THEMES).forEach(k=>{
    const n = CITIES.filter(c=>c.themes.includes(k)).length;
    if(n<5) return;
    html += `<div class="tag-card" data-act="theme" data-key="${k}"><span class="icon">${THEME_ICON[k]}</span><div class="label">${THEMES[k]}</div><div class="count">${n} 个城市</div></div>`;
  });
  html += `</div>`;

  // 季节
  html += `<div class="section-title">什么季节出发？</div><div class="season-row">`;
  Object.keys(SEASONS).forEach(k=>{
    const n = CITIES.filter(c=>c.seasons.includes(k)).length;
    if(n<5) return;
    html += `<div class="season-btn" data-act="season" data-key="${k}"><span class="em">${SEASON_ICON[k]}</span>${SEASONS[k]}<br><span style="font-size:12px;color:var(--ink-soft);font-weight:400">${n} 城推荐</span></div>`;
  });
  html += `</div>`;

  // 热门
  html += `<div class="section-title">🔥 热门推荐</div><div class="city-grid">`;
  ["xian","chengdu","hangzhou","sanya","lijiang","qingdao","xiamen","zhangjiajie"].forEach(id=>{
    const c = CITIES.find(x=>x.id===id); html += cityCard(c);
  });
  html += `</div>`;
  app.innerHTML = html;
  window.scrollTo(0,0);
}

function cityCard(c){
  const chips = c.themes.slice(0,2).map(t=>`<span class="chip">${THEMES[t]}</span>`).join('')
    + c.crowds.slice(0,1).map(t=>`<span class="chip crowd">${CROWDS[t]}</span>`).join('');
  const trip = (typeof TRIP_DATA!=='undefined') && TRIP_DATA.cities.find(x=>x.city===c.name);
  const tripChip = trip ? `<span class="chip trip">${trip.trips.length} 条行程</span>` : '';
  return `<div class="city-card" data-act="detail" data-key="${c.id}"><div><span class="name">${c.name}</span><span class="prov">${c.province}</span></div><div class="intro">${c.intro}</div><div class="chips">${chips}${tripChip}</div></div>`;
}

function filterCrowd(k){
  const list = CITIES.filter(c=>c.crowds.includes(k));
  renderGrouped(list, `适合「${CROWDS[k]}」的城市`, 'theme');
}
function filterTheme(k){
  const list = CITIES.filter(c=>c.themes.includes(k));
  renderGrouped(list, `「${THEMES[k]}」主题城市`, 'crowd');
}
function filterSeason(k){
  const list = CITIES.filter(c=>c.seasons.includes(k));
  renderGrouped(list, `${SEASONS[k]}推荐城市`, 'theme');
}

function doSearch(){
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  if(!q){ renderHome(); return; }
  const list = CITIES.filter(c=>{
    const hay = (c.name+c.province+c.intro+c.themes.map(t=>THEMES[t]).join()+c.crowds.map(t=>CROWDS[t]).join()+c.seasons.map(t=>SEASONS[t]).join()+c.guide.route+c.guide.food+c.guide.tips).toLowerCase();
    return hay.includes(q);
  });
  if(!list.length){ app.innerHTML = `<div class="empty"><div class="big">🧭</div>没找到"${q}"相关城市，换个关键词试试？<br><span data-act="home" style="color:var(--blue-deep);cursor:pointer">返回首页</span></div>`; return; }
  renderGrouped(list, `搜索"${q}" · ${list.length} 个城市`, 'theme');
}

function renderGrouped(list, title, groupBy){
  let html = `<div class="back" data-act="home">← 返回首页</div><div class="section-title">${title}</div>`;
  const groups = {};
  list.forEach(c=>{
    const keys = groupBy==='theme' ? c.themes : c.crowds;
    keys.forEach(k=>{ (groups[k]=groups[k]||[]).push(c); });
  });
  const order = Object.keys(groupBy==='theme'?THEMES:CROWDS);
  order.forEach(k=>{
    if(!groups[k]) return;
    html += `<div class="group-block"><div class="group-head">${groupBy==='theme'?THEME_ICON[k]:CROWD_ICON[k]} ${groupBy==='theme'?THEMES[k]:CROWDS[k]} <span class="cnt">${groups[k].length} 城</span></div><div class="city-grid">`;
    groups[k].forEach(c=> html += cityCard(c));
    html += `</div></div>`;
  });
  app.innerHTML = html;
  window.scrollTo(0,0);
}

function showDetail(id){
  const c = CITIES.find(x=>x.id===id); if(!c) return;
  const g = c.guide;
  let html = `<div class="back" data-act="home">← 返回</div><div class="detail">
    <h2>${c.name} <span style="font-size:14px;color:var(--ink-soft);font-weight:400">${c.province}</span></h2>
    <div class="sub">推荐 ${c.days} 天 · ${BUDGETS[c.budget]} · 最佳：${c.seasons.map(s=>SEASONS[s]).join('、')}</div>
    <div class="intro">${c.intro}</div>
    <div class="meta-row">
      <div class="meta-box">👥 适合：<b>${c.crowds.map(x=>CROWDS[x]).join('、')}</b></div>
      <div class="meta-box">🎯 主题：<b>${c.themes.map(x=>THEMES[x]).join('、')}</b></div>
    </div>`;
  [["🗺️ 行程路线","route","平台参考价"],["🚗 交通","traffic"],["🏨 住宿","stay"],["🍴 美食","food"],["⚠️ 避坑贴士","tips"],["💰 花费参考","cost","模型估算"]].forEach(([k,v,src])=>{
    if(v==='route'){
      html += `<div class="guide-row"><div class="k">${k}</div><div class="v">${renderRoute(g[v], c.name)}${src?`<span class="src-tag">${src}</span>`:''}</div></div>`;
    } else {
      html += `<div class="guide-row"><div class="k">${k}</div><div class="v">${g[v]}${src?`<span class="src-tag">${src}</span>`:''}</div></div>`;
    }
  });
  const trip = (typeof TRIP_DATA!=='undefined') && TRIP_DATA.cities.find(x=>x.city===c.name);
  if(trip){
    html += `<div class="detail-trips"><div class="section-title">🗓️ 推荐行程安排 <span class="src-tag">平台参考价</span></div><div class="trip-grid">`;
    trip.trips.forEach(t=>{ html += `<div class="trip-card"><div class="trip-info"><div class="trip-day">Day ${t.day}</div><div class="trip-spot">${t.spot}</div><div class="trip-intro">${t.intro}</div></div></div>`; });
    html += `</div></div>`;
  }
  html += `</div>`;
  app.innerHTML = html;

  loadSpotImages();
  window.scrollTo(0,0);
}


// shortcut: 交通时间为启发式估算(含山/湖/寺等远景点40-60分钟,否则20-30分钟),需逐城精确数据时升级
function transitBetween(a, b){
  const far = /山|长城|湖|岛|湾|寺|陵|遗址|景区|瀑布|峡谷|湿地|森林公园|天池/.test(a+b);
  return far ? '🚕 打车/公交 约40-60分钟' : '🚇 地铁/步行 约20-30分钟';
}
// 高德 Web 服务 key：去 https://lbs.amap.com 控制台→应用管理→创建key→服务平台选"Web服务"，填入此处
const AMAP_WEB_KEY='9476e96a46c4f89e69918fe0d78a854a';
const _spotImgCache=new Map();
async function _fetchSpotPhoto(city, spot){
  const core=spot.replace(/夜景|晨景|日落|日出|夜市|附近|周边|沿线|景区$/g,'').trim()||spot;
  const url=`https://restapi.amap.com/v3/place/text?keywords=${encodeURIComponent(core)}&city=${encodeURIComponent(city)}&citylimit=true&extensions=all&offset=20&key=${AMAP_WEB_KEY}`;
  try{
    const r=await fetch(url);
    const d=await r.json();
    if(!d.pois||!d.pois.length)return null;
    const withPhoto=d.pois.filter(p=>p.photos&&p.photos[0]);
    if(!withPhoto.length)return null;
    const match=withPhoto.filter(p=>p.name.includes(core)).sort((a,b)=>a.name.length-b.name.length)[0]||withPhoto[0];
    return match.photos[0].url;
  }catch(e){return null;}
}
async function loadSpotImages(){
  if(!AMAP_WEB_KEY)return;
  document.querySelectorAll('.spot-img:not([data-loaded])').forEach(async box=>{
    box.setAttribute('data-loaded','1');
    const city=box.dataset.city, spot=box.dataset.spot, key=city+'|'+spot;
    if(_spotImgCache.has(key)){box.innerHTML=_spotImgCache.get(key);return;}
    box.textContent='加载图…';
    const url=await _fetchSpotPhoto(city, spot);
    if(url){const h=`<img src="${url}" loading="lazy" alt="${spot}">`;_spotImgCache.set(key,h);box.innerHTML=h;}else box.textContent='';
  });
}

function renderRoute(routeText, cityName){
  const days = routeText.split(/[；;。]/).filter(s=>s.trim());
  return days.map(dayStr=>{
    const dm = dayStr.match(/Day\s*(\d+)/i);
    const dayNum = dm ? dm[1] : '';
    let spotsStr = dayStr.replace(/Day\s*\d+\s*/i,'').trim();
    const spots = spotsStr.split('+').map(s=>s.trim()).filter(s=>s);
    let h = `<div class="route-day">第 ${dayNum} 天</div><div class="route-spots">`;
    spots.forEach((sp,i)=>{
      const clean = sp.replace(/[（(].*?[)）]/g,'').trim();
      h += `<div class="spot"><div class="spot-name">${sp}</div><div class="spot-img" data-city="${cityName}" data-spot="${clean}"></div></div>`;
      if(i < spots.length-1) h += `<div class="transit">${transitBetween(spots[i],spots[i+1])}</div>`;
    });
    return h + `</div>`;
  }).join('');
}

setTimeout(()=>{ const l=document.getElementById('loading'); if(l) l.classList.add('hidden'); }, 3000);
try {
  document.getElementById('logo').addEventListener('click', ()=>showTab('guide'));
  TABS.forEach(t=> document.getElementById('tab-'+t).addEventListener('click', ()=>showTab(t)));
  document.getElementById('searchBtn').addEventListener('click', doSearch);
  document.getElementById('searchInput').addEventListener('keydown', e=>{ if(e.key==='Enter') doSearch(); });
  app.addEventListener('click', e=>{
    const t = e.target.closest('[data-act]'); if(!t) return;
    const act = t.dataset.act, key = t.dataset.key;
    if(act==='crowd') filterCrowd(key);
    else if(act==='theme') filterTheme(key);
    else if(act==='season') filterSeason(key);
    else if(act==='detail') showDetail(key);
    else if(act==='home') goHome();
  });
  renderHome();
  const initTab = TABS.find(t => location.hash === '#'+t) || 'guide';
  if(initTab !== 'guide') applyTab(initTab);
} catch(err) {
  console.error('初始化失败:', err);
  app.innerHTML = '<div class="empty"><div class="big">⚠️</div>数据加载失败，请刷新重试</div>';
} finally {
  document.getElementById('loading').classList.add('hidden');
}
// ===== 旅行主题粒子（静态密集散布，纯原生 SVG + Vanilla JS）=====
const enableTravelParticles = true;
(function(){
  if(!enableTravelParticles) return;
  const COLORS=['#6BA4D8','#7FB68E','#E8A87C','#9AA6B2'];
  const ICONS=[
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L2 12l7 2 2 7 4-5 7-14z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="14" rx="2"/><line x1="5" y1="13" x2="19" y2="13"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/><line x1="9" y1="6" x2="15" y2="6"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h18l-2 5H5z"/><path d="M12 14V4l5 4"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="7" width="12" height="14" rx="1"/><path d="M9 7V4h6v3"/><line x1="6" y1="12" x2="18" y2="12"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 7l2-2h4l2 2"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3,6 9,4 15,6 21,4 21,18 15,20 9,18 3,20"/><line x1="9" y1="4" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="20"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 18l4-8h6l-2 8"/><line x1="10" y1="10" x2="14" y2="10"/></svg>'
  ];
  const MIN=40, MAX=60;
  const wrap=document.createElement('div');
  wrap.className='travel-particles';
  document.body.appendChild(wrap);
  let parts=[];
  const rand=(a,b)=>a+Math.random()*(b-a);
  function spawn(){
    const size=rand(18,28), color=COLORS[Math.floor(Math.random()*COLORS.length)];
    const el=document.createElement('div');
    el.className='tp';
    el.style.width=size+'px'; el.style.height=size+'px'; el.style.color=color;
    el.style.opacity=rand(0.5,0.8).toFixed(2);
    el.style.animationDuration=rand(5,9).toFixed(1)+'s';
    el.style.animationDelay=(-rand(0,6)).toFixed(1)+'s';
    el.innerHTML=ICONS[Math.floor(Math.random()*ICONS.length)];
    const x=rand(0,window.innerWidth-size), y=rand(0,window.innerHeight-size);
    el.style.left=x+'px'; el.style.top=y+'px';
    const p={el,x,y,color,dead:false};
    el.addEventListener('click',()=>pop(p));
    wrap.appendChild(el); parts.push(p);
  }
  function pop(p){
    if(p.dead) return; p.dead=true;
    const el=p.el;
    el.style.animation='none';
    el.style.transition='transform .14s ease';
    el.style.transform='scale(1.4)';
    setTimeout(()=>{
      el.style.transform='scale(0.6)';
      setTimeout(()=>{
        const n=4+Math.floor(Math.random()*3);
        for(let i=0;i<n;i++){
          const d=document.createElement('div'); d.className='tp-dot';
          const ds=rand(4,7);
          d.style.width=ds+'px'; d.style.height=ds+'px'; d.style.background=p.color;
          d.style.left=(p.x+10)+'px'; d.style.top=(p.y+10)+'px'; d.style.opacity='0.6';
          wrap.appendChild(d);
          const ang=Math.random()*Math.PI*2, dist=rand(18,40);
          d.style.transition='transform .5s ease, opacity .5s ease';
          requestAnimationFrame(()=>{ d.style.transform=`translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist}px)`; d.style.opacity='0'; });
          setTimeout(()=>d.remove(),520);
        }
        el.style.transition='opacity .3s ease'; el.style.opacity='0';
        setTimeout(()=>{ el.remove(); const idx=parts.indexOf(p); if(idx>-1) parts.splice(idx,1); },320);
      },140);
    },140);
  }
  function build(){ wrap.innerHTML=''; parts=[]; const n=Math.floor(rand(MIN,MAX)); for(let i=0;i<n;i++) spawn(); }
  build();
  let rt;
  window.addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(build,300); });
})();
