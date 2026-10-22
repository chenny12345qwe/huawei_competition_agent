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
const _spotImgCache=new Map();
// 热门景点图直链（手动配置：键=景点名与route一致，值=图片URL）。未配置的景点用 picsum 通用风景图兜底。
// 配置示例："圣索菲亚教堂":"https://upload.wikimedia.org/wikipedia/commons/thumb/.../400px-....jpg"
const SPOT_IMAGES = {
  "故宫":"https://img.dpm.org.cn/Uploads/Picture/2023/07/30/s64c651dcd70e8.jpg",
  "景山":"http://vip-public.people.com.cn/photo/2023/9/15/72a6196c521a48d2b9cca8b1e2c3af2aPo9d_m.jpg",
  "王府井":"https://n.sinaimg.cn/sinacn12/640/w1280h960/20180416/5b2e-fzcyxmv3208289.jpg",
  "长城":"https://pic2.zhimg.com/v2-eab9cc345ce464423ba3ed4639f59513_r.jpg?source=172ae18b",
  "鸟巢水立方":"https://pic3.zhimg.com/v2-45e118429e5f125df1fe4bd7fd28ace4_r.jpg?source=172ae18b",
  "颐和园":"http://vip-public.people.com.cn/photo/2023/9/15/72a6196c521a48d2b9cca8b1e2c3af2aPo9d_m.jpg",
  "圆明园":"http://vip-public.people.com.cn/photo/2023/9/15/72a6196c521a48d2b9cca8b1e2c3af2aPo9d_m.jpg",
  "清华北大":"https://pic3.zhimg.com/v2-45e118429e5f125df1fe4bd7fd28ace4_r.jpg?source=172ae18b",
  "天坛":"https://n.sinaimg.cn/sinakd20108/300/w2000h1500/20221025/2e1d-b8969b745172d15608562ad47a1b6ae0.jpg",
  "南锣鼓巷":"https://pic3.zhimg.com/v2-45e118429e5f125df1fe4bd7fd28ace4_r.jpg?source=172ae18b",
  "什刹海胡同":"https://pic3.zhimg.com/v2-45e118429e5f125df1fe4bd7fd28ace4_r.jpg?source=172ae18b",
  "五大道":"https://youimg1.c-ctrip.com/target/100711000000rdolz3AEB_D_10000_1200.jpg?proc=autoorient",
  "瓷房子":"https://youimg1.c-ctrip.com/target/100j0b0000005zcwiADE0.jpg",
  "意式风情区":"https://pic4.zhimg.com/v2-dfdeb4f6fee785ed02c3322310321593_r.jpg",
  "天津之眼":"https://pic1.zhimg.com/v2-ea1adada212f3f2b5bbaa45f13a277b7_1440w.jpg?source=172ae18b",
  "古文化街":"http://www.ubrzd.cn/wp-content/uploads/2023/12/2022123109130098.jpg",
  "鼓楼":"https://youimg1.c-ctrip.com/target/10081b000001a6lm6BE8A.jpg",
  "听相声":"http://www.borezang.com/wp-content/uploads/2024/08/08.jpg",
  "避暑山庄":"https://pic1.zhimg.com/v2-7d861e201a303003fe49ea781e3743e0_r.jpg",
  "外八庙":"https://pic1.zhimg.com/v2-7c04fc6cc732a269f44de3e4c1a578c8_r.jpg",
  "鸽子窝公园":"https://xhsc.app.xinhuanet.com/cms/article/image/5bbfe2e868074e35b764cca0877cefd5.jpg",
  "老虎石浴场":"https://nfassetoss.southcn.com/__asset/1d56950053/8d78be9022.jpeg",
  "山海关":"https://nfassetoss.southcn.com/__asset/1d56950053/8d78be9022.jpeg",
  "老龙头":"https://nfassetoss.southcn.com/__asset/1d56950053/8d78be9022.jpeg",
  "南戴河":"https://nfassetoss.southcn.com/__asset/1d56950053/8d78be9022.jpeg",
  "阿那亚":"https://xhsc.app.xinhuanet.com/cms/article/image/5bbfe2e868074e35b764cca0877cefd5.jpg",
  "云冈石窟":"https://pic3.zhimg.com/v2-3347a50c3d256bab7b72b543343a5cda_r.jpg",
  "大同古城墙":"https://ask-fd.zol-img.com.cn/g5/M00/07/07/ChMkJlnoBS6IZt0PAABs4B8PZbkAAhYpQCUrRkAAGz4331.jpg",
  "悬空寺":"https://picx.zhimg.com/v2-61dd6286e6fac411a7ff1349ae80d8d4_r.jpg?source=1def8aca",
  "恒山":"https://img-baofun.zhhainiao.com/market/5/248719.jpg",
  "古城墙":"https://pic2.zhimg.com/v2-11878c564499b80be2aa102d99aa7e32_b.jpg",
  "日升昌票号":"http://k.sinaimg.cn/n/sinacn/w577h357/20180201/86b3-fyrcsrw3640833.jpg/w700d1q75cms.jpg",
  "明清街":"https://pic2.zhimg.com/v2-b7b3a5399d74c4aa6a9f98bc1eb33fe9_r.jpg",
  "双林寺":"https://www.zc.gov.cn/gzzcxf/img/0/416/416755/7337645.jpg",
  "镇国寺":"https://img.alicdn.com/bao/uploaded/i3/2210009485023/O1CN01lZwy2y1myaHoO5K13_!!2210009485023.jpg",
  "又见平遥":"https://p2.itc.cn/q_70/images03/20221220/fe1cb21562fa44959e12de2b017a9003.png",
  "中央大街":"https://pic3.zhimg.com/v2-4417846d13e2b7edc02d31da72771d6a_r.jpg",
  "圣索菲亚教堂":"https://n.sinaimg.cn/sinakd20123/300/w1620h1080/20220513/211d-96574fd1b7a247a8463c1237d62b046a.jpg",
  "松花江冰面":"https://pic2.zhimg.com/v2-8298068c750226ac538b947b71ea45a1_1440w.jpg?source=172ae18b",
  "冰雪大世界":"https://www.hlj.gov.cn/hlj/c108520/202212/31464412/images/3-20221218152108869.jpg",
  "太阳岛雪博会":"https://pic1.zhimg.com/v2-10e1e23f29adbf10a0ebdf7010f08d4a_1440w.jpg?source=172ae18b",
  "东北虎林园":"https://pic2.zhimg.com/v2-8298068c750226ac538b947b71ea45a1_1440w.jpg?source=172ae18b",
  "伪满皇宫":"https://youimg1.c-ctrip.com/target/0104e120005zeufdkB9E4_D_10000_1200.jpg?proc=autoorient",
  "长影旧址":"https://youimg1.c-ctrip.com/target/100e1f000001gt2inBFBA_W_10000_1200.jpg?proc=autoorient",
  "净月潭森林公园":"https://youimg1.c-ctrip.com/target/100e1f000001gt2inBFBA_W_10000_1200.jpg?proc=autoorient",
  "沈阳故宫":"https://pica.zhimg.com/v2-dc3559779db90c7cc695d3b5b12e1e5c_1440w.jpg",
  "张氏帅府":"https://pic4.zhimg.com/v2-3273029c90784f8ac89dc0de27229bcb_r.jpg",
  "中街":"https://youimg1.c-ctrip.com/target/100p13000000tnqnh1D81.jpg",
  "北陵公园":"https://pica.zhimg.com/v2-dc3559779db90c7cc695d3b5b12e1e5c_1440w.jpg",
  "九一八纪念馆":"https://pica.zhimg.com/v2-dc3559779db90c7cc695d3b5b12e1e5c_1440w.jpg",
  "星海广场":"https://n.sinaimg.cn/sinacn10108/71/w2048h1223/20191203/d4ef-ikcacer7872860.jpg",
  "滨海路":"https://pic2.zhimg.com/v2-3fd7fc6fa881cff8e4f88e83d64f0c2f_r.jpg?source=1940ef5c",
  "老虎滩":"https://pic4.zhimg.com/v2-0f29935748f441a2dfb1491d622c8e64_r.jpg?source=1940ef5c",
  "金石滩地质公园":"https://pic4.zhimg.com/v2-0f29935748f441a2dfb1491d622c8e64_r.jpg?source=1940ef5c",
  "旅顺口白玉山":"https://pic4.zhimg.com/v2-0f29935748f441a2dfb1491d622c8e64_r.jpg?source=1940ef5c",
  "军港":"https://pic4.zhimg.com/v2-0f29935748f441a2dfb1491d622c8e64_r.jpg?source=1940ef5c",
  "延边大学网红墙":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g5/M00/07/00/ChMkJ1fpx3qIcYk1AAn9igbP9XcAAWZEQAxfmAACf2i969.jpg",
  "水上市场":"https://k.sinaimg.cn/n/sinakd20106/384/w2048h1536/20230831/43b0-34ec9b8d3e037091b2747fc7e1a29a9c.jpg/w700d1q75cms.jpg",
  "帽儿山":"https://www.toopic.cn/public/uploads/small/1634204767855163420476772.jpg",
  "朝鲜族民俗园":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g5/M00/07/00/ChMkJ1fpx3qIcYk1AAn9igbP9XcAAWZEQAxfmAACf2i969.jpg",
  "北极村":"https://p0.itc.cn/q_70/images03/20221213/0157a108a40f44e8a5806146f129156e.png",
  "最北邮局":"https://www.saac.gov.cn/daj/gqzt/img/a05/68/02.jpg",
  "北红村":"https://iopwiki.com/images/thumb/2/2c/Infobox_border.png/128px-Infobox_border.png",
  "龙江第一湾":"https://p0.itc.cn/q_70/images03/20221213/0157a108a40f44e8a5806146f129156e.png",
  "漠河县城":"https://p0.itc.cn/q_70/images03/20221213/0157a108a40f44e8a5806146f129156e.png",
  "松苑公园":"https://p0.itc.cn/q_70/images03/20221213/0157a108a40f44e8a5806146f129156e.png",
  "外滩":"https://n.sinaimg.cn/sinakd20113/0/w2048h1152/20230205/dd2a-e2f832bada5affcaedc5240ea82c1791.jpg",
  "南京路":"https://www.shio.gov.cn/TrueCMS/shxwbgs/zwbydd/syyongdc/201712201127083857.jpg",
  "陆家嘴三件套":"https://www.shio.gov.cn/TrueCMS/shxwbgs/zwbydd/syyongdc/201712201127083857.jpg",
  "豫园":"http://youimg1.c-ctrip.com/target/1005060000001sw6v2148.jpg",
  "城隍庙":"https://n.sinaimg.cn/sinacn10111/150/w2000h1350/20200206/24d5-inzcrxs9009303.jpg",
  "田子坊":"https://www.shio.gov.cn/TrueCMS/shxwbgs/zwbydd/syyongdc/201712201127083857.jpg",
  "新天地":"https://youimg1.c-ctrip.com/target/100u13000000v229o921B.jpg",
  "迪士尼":"https://pica.zhimg.com/50/v2-493721c8477a64eda98b2f17b8d8fedc_720w.jpg?source=1940ef5c",
  "武康路":"https://youimg1.c-ctrip.com/target/100213000000uil6r111F.jpg",
  "安福路":"https://www.shio.gov.cn/TrueCMS/shxwbgs/zwbydd/syyongdc/201712201127083857.jpg",
  "西湖":"https://pic3.zhimg.com/v2-71eaff66299d9d788f2285e62ba0d84e_r.jpg",
  "断桥":"https://pic3.zhimg.com/v2-71eaff66299d9d788f2285e62ba0d84e_r.jpg",
  "苏堤":"https://pic3.zhimg.com/v2-71eaff66299d9d788f2285e62ba0d84e_r.jpg",
  "花港":"https://pic3.zhimg.com/v2-71eaff66299d9d788f2285e62ba0d84e_r.jpg",
  "雷峰塔":"https://p2.itc.cn/images03/20200529/223d28617b784cd5829b3d9904c988a6.jpeg",
  "灵隐寺":"https://youimg1.c-ctrip.com/target/10090n000000e2tjiAAF1_D_10000_1200.jpg?proc=autoorient",
  "飞来峰":"https://pic3.zhimg.com/v2-71eaff66299d9d788f2285e62ba0d84e_r.jpg",
  "龙井村":"https://pic3.zhimg.com/v2-71eaff66299d9d788f2285e62ba0d84e_r.jpg",
  "西溪湿地":"https://pic3.zhimg.com/v2-71eaff66299d9d788f2285e62ba0d84e_r.jpg",
  "宋城":"https://pic3.zhimg.com/v2-71eaff66299d9d788f2285e62ba0d84e_r.jpg",
  "拙政园":"https://n.sinaimg.cn/sinakd10112/709/w2000h1109/20210610/8c5e-krhvrxt4792942.jpg",
  "苏州博物馆":"https://pic2.zhimg.com/v2-bfad868a9ff6b2168ea32e6d83d42215_r.jpg",
  "平江路":"https://pic2.zhimg.com/v2-bfad868a9ff6b2168ea32e6d83d42215_r.jpg",
  "虎丘":"https://pic2.zhimg.com/v2-bfad868a9ff6b2168ea32e6d83d42215_r.jpg",
  "山塘街":"https://pic1.zhimg.com/v2-3109052492b80975ccfda23bed6940c2_r.jpg?source=172ae18b",
  "寒山寺":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g7/M00/0C/05/ChMkLGR6pu2IB4e3AARv7kvw30sAAQwSQNHa84ABHAG738.jpg",
  "周庄":"https://n.sinaimg.cn/sinacn20117/120/w1440h1080/20191130/674e-ikcaceq8081921.jpg",
  "同里水乡":"https://pic2.zhimg.com/v2-bfad868a9ff6b2168ea32e6d83d42215_r.jpg",
  "中山陵":""https://p9.itc.cn/q_70",
  "明孝陵":"https://n.sinaimg.cn/sinakd10103/534/w2000h934/20221011/370a-dc73954590973ad0d6997eaa3ebd716c.jpg",
  "美龄宫":"https://n.sinaimg.cn/sinacn20115/67/w1000h667/20190129/98dd-hshmsth8273435.jpg",
  "总统府":"https://youimg1.c-ctrip.com/target/100t0b0000005zleyF8F9.jpg",
  "1912":"https://n.sinaimg.cn/sinacn20122/298/w1618h1080/20191022/af0b-ihfpfwa7135734.jpg",
  "夫子庙秦淮河":"https://n.sinaimg.cn/sinacn20122/298/w1618h1080/20191022/af0b-ihfpfwa7135734.jpg",
  "南京博物院":"https://n.sinaimg.cn/sinacn20122/298/w1618h1080/20191022/af0b-ihfpfwa7135734.jpg",
  "玄武湖":"https://n.sinaimg.cn/sinakd20110/301/w1621h1080/20220407/ad24-de7336d65ac0ba1c12dc7d44817ab011.jpg",
  "瘦西湖":"https://n.sinaimg.cn/sinacn20121/300/w1620h1080/20190513/6d25-hwzkfpt9413506.jpg",
  "大明寺":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g5/M00/06/0B/ChMkJlulhKaIe5jyAAMPt2Z6pWMAAr7qgJeUV8AAw_P740.jpg",
  "个园":"https://n.sinaimg.cn/sinakd20230216ac/133/w2000h1333/20230216/9432-c88d807a7e39cdd7644b09b712f4d702.jpg",
  "东关街":"https://n.sinaimg.cn/sinacn20121/300/w1620h1080/20190513/6d25-hwzkfpt9413506.jpg",
  "何园":"https://n.sinaimg.cn/sinacn20121/300/w1620h1080/20190513/6d25-hwzkfpt9413506.jpg",
  "屯溪老街":"https://k.sinaimg.cn/n/spider20231223/559/w1080h1879/20231223/e728-3bf544b525c227fe7088b6261e9b7e1e.jpg/w700d1q75cms.jpg?by=cms_fixed_width",
  "呈坎":"https://n.sinaimg.cn/sinakd20221207s/199/w1080h719/20221207/926f-cd4469d482c0191298b1c83d947f753e.png",
  "黄山":"https://n.sinaimg.cn/sinakd20221207s/199/w1080h719/20221207/926f-cd4469d482c0191298b1c83d947f753e.png",
  "玉屏楼":"https://n.sinaimg.cn/sinakd20221207s/199/w1080h719/20221207/926f-cd4469d482c0191298b1c83d947f753e.png",
  "迎客松":"https://n.sinaimg.cn/sinakd20113/598/w1080h1918/20220210/1cba-d91f04b17c17ce996833ef5f0a0a31fd.jpg",
  "光明顶":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g5/M00/00/0F/ChMkJlrnGqaIDWovAAOHfUKE4UUAAn-agKtL7kAA4eV181.jpg",
  "飞来石":"https://youimg1.c-ctrip.com/target/10041b000001aptus958C.jpg",
  "宏村":"https://n.sinaimg.cn/sinakd20221207s/199/w1080h719/20221207/926f-cd4469d482c0191298b1c83d947f753e.png",
  "西递":"https://n.sinaimg.cn/sinakd20221207s/199/w1080h719/20221207/926f-cd4469d482c0191298b1c83d947f753e.png",
  "李坑":"https://pic1.zhimg.com/v2-5e10a181a9b645425a6f51f61732fd93_r.jpg?source=1940ef5c",
  "江岭":"https://pic1.zhimg.com/v2-5e10a181a9b645425a6f51f61732fd93_r.jpg?source=1940ef5c",
  "晓起":"https://pic1.zhimg.com/v2-5e10a181a9b645425a6f51f61732fd93_r.jpg?source=1940ef5c",
  "思溪延村":"https://gbres.dfcfw.com/Files/iimage/20250926/C10B03E88898A9E7AEBB726AB37A2D14_w1000h1334.jpg",
  "彩虹桥":"https://pic1.zhimg.com/v2-5e10a181a9b645425a6f51f61732fd93_r.jpg?source=1940ef5c",
  "理坑":"https://pic1.zhimg.com/v2-5e10a181a9b645425a6f51f61732fd93_r.jpg?source=1940ef5c",
  "鼓浪屿":"https://youimg1.c-ctrip.com/target/100l190000017ig2j62F8.jpg",
  "日光岩":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g7/M00/01/0E/ChMkK2RAdwSIF_qNAAL81uHtXq8AAPGhwCfxy4AAvzu126.jpg",
  "菽庄花园":"https://pic4.zhimg.com/80/v2-9bb5d8cfc83c4f9a60f81515c3b57e9e_qhd.jpg",
  "龙头路":"https://youimg1.c-ctrip.com/target/100k10000000pkvuk8E65.jpg",
  "南普陀":"https://pic4.zhimg.com/80/v2-9bb5d8cfc83c4f9a60f81515c3b57e9e_qhd.jpg",
  "厦大":"https://pic3.zhimg.com/v2-877994698a365dfcd8eeb70a1b30cbe4_1440w.jpg?source=172ae18b",
  "环岛路":"https://pic3.zhimg.com/v2-877994698a365dfcd8eeb70a1b30cbe4_1440w.jpg?source=172ae18b",
  "曾厝垵":"https://pic4.zhimg.com/80/v2-9bb5d8cfc83c4f9a60f81515c3b57e9e_qhd.jpg",
  "集美学村":"https://pic4.zhimg.com/80/v2-9bb5d8cfc83c4f9a60f81515c3b57e9e_qhd.jpg",
  "开元寺":"https://n.sinaimg.cn/sinakd20106/600/w1920h1080/20220712/4680-e19549853fe66fdea773ecef26c80004.jpg",
  "西街":"https://pic1.zhimg.com/v2-ba32153c6ee7769ae2876d023f095f7a_r.jpg?source=1940ef5c",
  "清净寺":"https://pic1.zhimg.com/v2-ba32153c6ee7769ae2876d023f095f7a_r.jpg?source=1940ef5c",
  "关帝庙":"https://pic4.zhimg.com/v2-b0fb207071b831e450fa04be4e3485c2_r.jpg?source=1940ef5c",
  "清源山":"https://n.sinaimg.cn/sinakd20106/600/w1920h1080/20220712/4680-e19549853fe66fdea773ecef26c80004.jpg",
  "蟳埔村簪花围":"https://n.sinaimg.cn/sinakd20106/600/w1920h1080/20220712/4680-e19549853fe66fdea773ecef26c80004.jpg",
  "三坊七巷":"https://p2.itc.cn/q_70/images01/20221010/9fa0f061e6494c46afc473adb34014c9.jpeg",
  "林则徐纪念馆":"https://pica.zhimg.com/v2-5ebd6f4481334fb3cab63c741d9e9b4d_1440w.jpg?source=172ae18b",
  "西湖公园":"https://n.sinaimg.cn/sinakd20210112ac/477/w759h518/20210112/9b36-khmynua6112876.png",
  "鼓山":"https://pica.zhimg.com/v2-5ebd6f4481334fb3cab63c741d9e9b4d_1440w.jpg?source=172ae18b",
  "闽江":"https://pica.zhimg.com/v2-5ebd6f4481334fb3cab63c741d9e9b4d_1440w.jpg?source=172ae18b",
  "栈桥":"https://n.sinaimg.cn/sinacn10118/577/w885h492/20191105/191c-ihyxcrp5849212.jpg",
  "八大关":"https://n.sinaimg.cn/sinakd20106/350/w690h460/20221022/859a-a4d905810a79ef6904895b5945b91622.jpg",
  "五四广场":"https://img.alicdn.com/imgextra/i4/578383292/O1CN01vzBXj61aBmP3d85Ss_!!578383292.jpg",
  "奥帆中心":"https://pic2.zhimg.com/v2-6c10d41213babc413243070807680b3f_r.jpg?source=172ae18b",
  "崂山":"https://pic2.zhimg.com/v2-6c10d41213babc413243070807680b3f_r.jpg?source=172ae18b",
  "石老人浴场":"https://pic2.zhimg.com/v2-6c10d41213babc413243070807680b3f_r.jpg?source=172ae18b",
  "啤酒博物馆":"https://pic.nximg.cn/file/20201228/29480918_153327604036_2.jpg",
  "台东夜市":"https://pic2.zhimg.com/v2-6c10d41213babc413243070807680b3f_r.jpg?source=172ae18b",
  "刘公岛":"https://k.sinaimg.cn/n/sinakd20116/515/w799h516/20200307/4af9-iqmtvwv7460091.jpg/w700d1q75cms.jpg",
  "定远舰":"https://pica.zhimg.com/v2-30e2d277026138d6dab21be14bab135f_r.jpg?source=1940ef5c",
  "国际海水浴场":"https://pica.zhimg.com/v2-30e2d277026138d6dab21be14bab135f_r.jpg?source=1940ef5c",
  "猫头山环海路":"https://pica.zhimg.com/v2-30e2d277026138d6dab21be14bab135f_r.jpg?source=1940ef5c",
  "趵突泉":"https://www.bowumi.com/wp-content/uploads/tupianbd/2/253/4259483352/2634302800.jpg",
  "大明湖":"https://p4.itc.cn/images01/20210716/b57672715f7945d88c04f13ee7998598.jpeg",
  "五龙潭":"https://pic4.zhimg.com/v2-e115f094cc50e56939c4d74cde0e4a0f_r.jpg",
  "千佛山":"https://p8.itc.cn/images01/20220926/4ee70072e4f640e481d17d30b3178d09.png",
  "泉城广场":"https://k.sinaimg.cn/n/sinacn10114/344/w1751h993/20191120/a5cb-iipztff5722293.jpg/w700d1q75cms.jpg",
  "芙蓉街":"https://youimg1.c-ctrip.com/target/01025120009dgr1qu5F08_W_10000_1200.jpg?proc=autoorient",
  "泰山":"https://youimg1.c-ctrip.com/target/100w14000000w6va940A4.jpg",
  "红门":"https://img.alicdn.com/imgextra/i4/2309854897/O1CN01KslVmv1m2sHq28Uxx_!!2309854897.jpg",
  "中天门":"https://youimg1.c-ctrip.com/target/100j16000000z76ymB59E.jpg",
  "南天门":"https://youimg1.c-ctrip.com/target/100w1g000001hijc2C8AA.jpg",
  "岱庙":"http://5b0988e595225.cdn.sohucs.com/images/20181106/a5c0b45a44264a2487ac383f37c29468.jpeg",
  "黄鹤楼":"https://5b0988e595225.cdn.sohucs.com/images/20190622/bfeccf07e43d44faab7da7c905855807.jpeg",
  "户部巷":"https://pic1.zhimg.com/50/v2-89561282c917f37171ad313ec673afd0_hd.jpg?source=1940ef5c",
  "长江大桥":"http://vip-public.people.com.cn/photo/2021/10/12/6ca766ac816946148062654eca6395efheqp_m.jpg",
  "轮渡":"https://pic1.zhimg.com/50/v2-89561282c917f37171ad313ec673afd0_hd.jpg?source=1940ef5c",
  "东湖":"https://www.hubei.gov.cn/jmct/hbms/wh_9034/201508/W020150825585638490746.jpg",
  "武汉大学":"https://pic1.zhimg.com/50/v2-89561282c917f37171ad313ec673afd0_hd.jpg?source=1940ef5c",
  "省博":"https://www.wuhan.gov.cn/zjwh/whly/202510/W020251014624089368441.jpg",
  "江汉路":"https://pic1.zhimg.com/50/v2-89561282c917f37171ad313ec673afd0_hd.jpg?source=1940ef5c",
  "汉口江滩":"https://pic1.zhimg.com/50/v2-89561282c917f37171ad313ec673afd0_hd.jpg?source=1940ef5c",
  "橘子洲":"https://pic2.zhimg.com/v2-85957a4a5fd49bfaf2e3b0be65e9537d_720w.jpg?source=172ae18b",
  "岳麓山":"https://pic2.zhimg.com/v2-85957a4a5fd49bfaf2e3b0be65e9537d_720w.jpg?source=172ae18b",
  "岳麓书院":"https://pic2.zhimg.com/v2-85957a4a5fd49bfaf2e3b0be65e9537d_720w.jpg?source=172ae18b",
  "湖南博":"https://pic2.zhimg.com/v2-85957a4a5fd49bfaf2e3b0be65e9537d_720w.jpg?source=172ae18b",
  "IFS国金中心":"https://pic2.zhimg.com/v2-85957a4a5fd49bfaf2e3b0be65e9537d_720w.jpg?source=172ae18b",
  "太平街":"https://pic2.zhimg.com/v2-85957a4a5fd49bfaf2e3b0be65e9537d_720w.jpg?source=172ae18b",
  "坡子街":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g7/M00/0B/0D/ChMkLGMDhg-IHSKXAAljpbYK-4oAAGu-QPkx2sACWO9706.jpg",
  "超级文和友":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g7/M00/0B/0D/ChMkLGMDhg-IHSKXAAljpbYK-4oAAGu-QPkx2sACWO9706.jpg",
  "国家森林公园":"https://pic3.zhimg.com/8081ed57c53ad342126cd4eb267e3c16_r.jpg",
  "袁家界":"https://pic3.zhimg.com/8081ed57c53ad342126cd4eb267e3c16_r.jpg",
  "乾坤柱":"https://pic3.zhimg.com/8081ed57c53ad342126cd4eb267e3c16_r.jpg",
  "天下第一桥":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g5/M00/09/05/ChMkJlsA0gmIJhsqAAfsLW4vqFQAAofvQKFbR8AB-xF933.jpg",
  "天门山":"https://pic4.zhimg.com/v2-84d825059db5b085195da56d1d0bc4db_b.jpg",
  "玻璃栈道":"https://pic3.zhimg.com/8081ed57c53ad342126cd4eb267e3c16_r.jpg",
  "大峡谷玻璃桥":"https://pic3.zhimg.com/8081ed57c53ad342126cd4eb267e3c16_r.jpg",
  "龙门石窟":"https://www.med-credit.org.cn/uploadfile/hospital/photo/7116.jpg",
  "白园":"https://pic3.zhimg.com/v2-d1f733345b0d11ea4d1bde0e2511dbc8_720w.jpg?source=172ae18b",
  "洛邑古城":"https://www.shhk.gov.cn/shhk/fb926e6b-e723-406e-b9ac-27c6f203b110/f734ad30-3326-47c1-ac96-499593b7a130/20240502183912040813.jpg",
  "白马寺":"https://n.sinaimg.cn/sinacn10108/680/w2048h1032/20190711/b541-hzrevpz8383255.jpg",
  "洛阳博物馆":"https://picx.zhimg.com/50/v2-01361da21da5561f1de3a545b9cc66e2_720w.jpg?source=1940ef5c",
  "清明上河园":"https://bhxb.buaa.edu.cn/fileBJHKHTDXXB/journal/article/bjhkhtdxxb/2024/3/2022-0378-2.jpg",
  "开封府":"https://pic4.zhimg.com/v2-8b6bfe46410d9bef3b67ac4cd3c4c4e3_r.jpg?source=1940ef5c",
  "大相国寺":"https://pic3.zhimg.com/v2-1bccebca5207698e963f6553a7d85afa_r.jpg",
  "鼓楼夜市":"https://pic4.zhimg.com/v2-8b6bfe46410d9bef3b67ac4cd3c4c4e3_r.jpg?source=1940ef5c",
  "神农顶":"http://n.sinaimg.cn/sinacn/w595h585/20171207/facd-fypnsin7541132.jpg",
  "金猴岭":"https://youimg1.c-ctrip.com/target/100f1g000001hay433B0D.jpg",
  "小龙潭":"https://youimg1.c-ctrip.com/target/100f1g000001hay433B0D.jpg",
  "大九湖":"http://www.ubrzd.cn/wp-content/uploads/2024/08/11.jpg",
  "天燕景区":"https://youimg1.c-ctrip.com/target/100f1g000001hay433B0D.jpg",
  "陈家祠":"https://n.sinaimg.cn/sinakd10102/410/w1200h810/20200324/ba9e-ireifzi2099464.jpg",
  "沙面":"https://nfassetoss.southcn.com/__asset/0bdf1f0b31/ad59790e0b.jpeg",
  "永庆坊":"https://pic1.zhimg.com/v2-844336a79522a9654e509371fcb95abc_r.jpg",
  "越秀公园":"https://www.102lou.net/data/attachment/forum/202610/20/212709msganw0cnnkctynd.jpg",
  "中山纪念堂":"https://nfassetoss.southcn.com/__asset/0bdf1f0b31/ad59790e0b.jpeg",
  "北京路":"https://nfassetoss.southcn.com/__asset/0bdf1f0b31/ad59790e0b.jpeg",
  "长隆":"https://nfassetoss.southcn.com/__asset/0bdf1f0b31/ad59790e0b.jpeg",
  "小蛮腰":"https://img.soufunimg.com/news/2017_09/05/home/1504605961049_000.jpg",
  "珠江":"https://nfassetoss.southcn.com/__asset/0bdf1f0b31/ad59790e0b.jpeg",
  "世界之窗":"https://youimg1.c-ctrip.com/target/100d050000000wqtnF431.jpg",
  "欢乐谷":"https://www.szgm.gov.cn/attachment/1/1395/1395520/11928458.jpg",
  "大梅沙":"https://pic3.zhimg.com/v2-f748fdb9e0ee521a6484c5143690ede2_r.jpg",
  "东部华侨城":"https://pic3.zhimg.com/v2-f748fdb9e0ee521a6484c5143690ede2_r.jpg",
  "大鹏所城":"https://www.szgm.gov.cn/attachment/1/1395/1395520/11928458.jpg",
  "较场尾":"https://pic3.zhimg.com/v2-f748fdb9e0ee521a6484c5143690ede2_r.jpg",
  "长隆海洋王国":"https://pic4.zhimg.com/v2-53a3c069d31a655f6af348e45c01a51b_r.jpg",
  "情侣路":"https://pic3.zhimg.com/v2-aad2d4cd6db9bb28412ad7babb3f96c0_1440w.jpg?source=172ae18b",
  "渔女":"https://media.9game.cn/gamebase/ieu-eagle-docking-service/images/20240819/14/30/0dd39d767d2d82d0dda34340730d745c.jpeg",
  "日月贝":"https://pic3.zhimg.com/v2-aad2d4cd6db9bb28412ad7babb3f96c0_1440w.jpg?source=172ae18b",
  "外伶仃岛":"https://pic3.zhimg.com/v2-aad2d4cd6db9bb28412ad7babb3f96c0_1440w.jpg?source=172ae18b",
  "青秀山":"https://n.sinaimg.cn/sinakd20230226s/400/w1200h800/20230226/1509-85c33441651fe69047b9c8a7954bea2c.jpg",
  "南湖公园":"https://n.sinaimg.cn/sinakd10111/150/w2000h1350/20200515/c2d4-itriats2497362.jpg",
  "三街两巷":"https://n.sinaimg.cn/sinacn20101/299/w1619h1080/20191116/eeec-iikmuti2841294.jpg",
  "广西博物馆":"https://n.sinaimg.cn/sinakd10111/150/w2000h1350/20200515/c2d4-itriats2497362.jpg",
  "德天瀑布":"https://n.sinaimg.cn/sinakd10111/150/w2000h1350/20200515/c2d4-itriats2497362.jpg",
  "象鼻山":"http://5b0988e595225.cdn.sohucs.com/images/20180923/87fabc1583644a83b359a3c426a6f84f.jpeg",
  "两江四湖":"https://youimg1.c-ctrip.com/target/01061120005qzcs8tF943_D_10000_1200.jpg?proc=autoorient",
  "漓江竹筏":"https://youimg1.c-ctrip.com/target/100r16000000z8hzeB3DA.jpg",
  "杨堤":"https://youimg1.c-ctrip.com/target/01061120005qzcs8tF943_D_10000_1200.jpg?proc=autoorient",
  "兴坪":"https://youimg1.c-ctrip.com/target/01061120005qzcs8tF943_D_10000_1200.jpg?proc=autoorient",
  "阳朔西街":"https://n.sinaimg.cn/sinacn12/108/w1024h684/20180319/7252-fyskeuc0980848.jpg",
  "遇龙河":"https://youimg1.c-ctrip.com/target/01061120005qzcs8tF943_D_10000_1200.jpg?proc=autoorient",
  "十里画廊":"https://youimg1.c-ctrip.com/target/01061120005qzcs8tF943_D_10000_1200.jpg?proc=autoorient",
  "银滩":"https://k.sinaimg.cn/n/sinakd20240626s/554/w600h754/20240626/6270-f0bb9830a736f8e4a6e78dc89d2ef74a.png/w700d1q75cms.jpg?by=cms_fixed_width",
  "老街":"https://youimg1.c-ctrip.com/target/fd/tg/g5/M08/B8/E8/CggYsFchlN-AdWZ_ADZem5fi1qM705.jpg",
  "侨港":"https://k.sinaimg.cn/n/sinakd20240626s/554/w600h754/20240626/6270-f0bb9830a736f8e4a6e78dc89d2ef74a.png/w700d1q75cms.jpg?by=cms_fixed_width",
  "涠洲岛":"https://k.sinaimg.cn/n/sinakd20240626s/554/w600h754/20240626/6270-f0bb9830a736f8e4a6e78dc89d2ef74a.png/w700d1q75cms.jpg?by=cms_fixed_width",
  "鳄鱼山":"https://k.sinaimg.cn/n/sinakd20240626s/554/w600h754/20240626/6270-f0bb9830a736f8e4a6e78dc89d2ef74a.png/w700d1q75cms.jpg?by=cms_fixed_width",
  "滴水丹屏":"https://iishangwangiai.com/wp-content/uploads/2024/06/jtdsy31.png",
  "石螺口":"https://picb.zhimg.com/v2-e04fc1595d62e36d15ae55297db2a985_r.jpg",
  "骑楼老街":"https://rmt-data.hinews.cn/common/img/IMG_cfb81f3ac6ec4d6b8822d697c83271ec.jpeg",
  "钟楼":"https://youimg1.c-ctrip.com/target/0106g120005yueaemADD8_W_10000_1200.jpg?proc=autoorient",
  "海口湾":"https://youimg1.c-ctrip.com/target/0106g120005yueaemADD8_W_10000_1200.jpg?proc=autoorient",
  "火山口地质公园":"https://youimg1.c-ctrip.com/target/0106g120005yueaemADD8_W_10000_1200.jpg?proc=autoorient",
  "假日海滩":"https://n.sinaimg.cn/sinacn10113/214/w2048h1366/20190207/3f75-hsqyiwu0189505.jpg",
  "亚龙湾":"https://n.sinaimg.cn/sinacn/w1600h1144/20180209/c4f1-fyrkuxs7528060.jpg",
  "热带天堂森林公园":"https://n.sinaimg.cn/sinacn10/608/w1280h928/20181026/acd7-hmxrkzx0420531.jpg",
  "蜈支洲岛":"https://n.sinaimg.cn/sinacn/w1600h1144/20180209/c4f1-fyrkuxs7528060.jpg",
  "南山寺":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g5/M00/0B/09/ChMkJlf4Ys2IEkngAAMO4tBAIYcAAWrdgMYBtMAAw76133.jpg",
  "天涯海角":"http://n.sinaimg.cn/sinacn10119/0/w1000h600/20190731/f03f-iaqfzyv4360135.jpg",
  "呀诺达雨林":"https://n.sinaimg.cn/sinacn/w1600h1144/20180209/c4f1-fyrkuxs7528060.jpg",
  "免税店":"https://n.sinaimg.cn/sinacn/w1600h1144/20180209/c4f1-fyrkuxs7528060.jpg",
  "大熊猫繁育基地":"http://5b0988e595225.cdn.sohucs.com/images/20190314/d96652c839db4361a4503b281dc408ce.jpeg",
  "武侯祠":"https://n.sinaimg.cn/spider20261020/200/w1080h720/20261020/8001-91fc302270091a30e0984849ec1bf901.jpg",
  "锦里":"https://n.sinaimg.cn/spider20261020/200/w1080h720/20261020/8001-91fc302270091a30e0984849ec1bf901.jpg",
  "杜甫草堂":"https://n.sinaimg.cn/spider20261020/200/w1080h720/20261020/8001-91fc302270091a30e0984849ec1bf901.jpg",
  "宽窄巷子":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g2/M00/07/07/Cg-4WVU_jd2ICcoPABELTinhtwoAACd-AJYU1MAEQtm129.jpg",
  "人民公园":"https://5b0988e595225.cdn.sohucs.com/images/20200217/37639f0bffe149db91df8254a59e2987.jpeg",
  "都江堰":"https://n.sinaimg.cn/sinakd10118/75/w1150h525/20210903/7dd9-23ce59537d9a0278d67ccab0778849c8.jpg",
  "青城山":"https://n.sinaimg.cn/sinakd10118/75/w1150h525/20210903/7dd9-23ce59537d9a0278d67ccab0778849c8.jpg",
  "春熙路太古里":"https://n.sinaimg.cn/spider20261020/200/w1080h720/20261020/8001-91fc302270091a30e0984849ec1bf901.jpg",
  "解放碑":"https://n.sinaimg.cn/sinacn10114/307/w576h531/20190814/71ca-icapxpi4883406.jpg",
  "洪崖洞":"https://picx.zhimg.com/v2-42b52e6c17d9999c955b6a9a015031b9_r.jpg?source=1940ef5c",
  "千厮门大桥":"https://youimg1.c-ctrip.com/target/100d15000000yb4jn7438.jpg",
  "李子坝穿楼":"https://youimg1.c-ctrip.com/target/0100g1200086ns69oB566_D_10000_1200.jpg?proc=autoorient",
  "磁器口":"https://www.cq.gov.cn/zwgk/zfxxgkml/zdlyxxgk/ggwh/ly/zxdt/202409/W020240918596825468651.png",
  "长江索道":"http://youimg1.c-ctrip.com/target/fd/tg/g3/M08/42/F2/CggYGVYfGK2ACncYACQ9Zt5EPk0805.jpg",
  "武隆天坑":"https://n.sinaimg.cn/sinacn20122/298/w1618h1080/20190627/9eb6-hyzpvir6456150.jpg",
  "山城步道":"https://n.sinaimg.cn/sinacn20122/298/w1618h1080/20190627/9eb6-hyzpvir6456150.jpg",
  "黔灵山":"https://n.sinaimg.cn/sinakd20201123s/200/w1080h720/20201123/c610-kefmphc8047286.jpg",
  "甲秀楼":"https://n.sinaimg.cn/sinacn23/215/w2048h1367/20180714/be31-hfhfwmv6358710.jpg",
  "青岩古镇":"https://n.sinaimg.cn/sinakd20201123s/200/w1080h720/20201123/c610-kefmphc8047286.jpg",
  "黄果树瀑布":"https://n.sinaimg.cn/sinakd20201123s/200/w1080h720/20201123/c610-kefmphc8047286.jpg",
  "千户苗寨":"https://n.sinaimg.cn/sinakd20201123s/200/w1080h720/20201123/c610-kefmphc8047286.jpg",
  "滇池":"https://n.sinaimg.cn/sinakd20120/0/w2048h1152/20221003/0c5f-011e64f0930e43b1c7d31324cae0e59c.jpg",
  "海埂公园":"https://n.sinaimg.cn/sinakd20120/0/w2048h1152/20221003/0c5f-011e64f0930e43b1c7d31324cae0e59c.jpg",
  "翠湖":"https://n.sinaimg.cn/sinakd20120/0/w2048h1152/20221003/0c5f-011e64f0930e43b1c7d31324cae0e59c.jpg",
  "石林":"https://n.sinaimg.cn/sinakd10101/150/w2000h1350/20200909/219b-iytwscc2907011.jpg",
  "云南民族村":"https://n.sinaimg.cn/sinakd20120/0/w2048h1152/20221003/0c5f-011e64f0930e43b1c7d31324cae0e59c.jpg",
  "金马碧鸡":"https://n.sinaimg.cn/sinakd20120/0/w2048h1152/20221003/0c5f-011e64f0930e43b1c7d31324cae0e59c.jpg",
  "大理古城":"https://pic2.zhimg.com/v2-c8cd5da7b2b0f570fd0a7aefef518d6a_r.jpg",
  "崇圣寺三塔":"https://pic2.zhimg.com/v2-c8cd5da7b2b0f570fd0a7aefef518d6a_r.jpg",
  "洱海":"https://youimg1.c-ctrip.com/target/100o1f000001gp5da5B10_D_10000_1200.jpg?proc=autoorient",
  "才村":"https://pic2.zhimg.com/v2-c8cd5da7b2b0f570fd0a7aefef518d6a_r.jpg",
  "喜洲":"https://pic2.zhimg.com/v2-c8cd5da7b2b0f570fd0a7aefef518d6a_r.jpg",
  "海舌":"https://pic2.zhimg.com/v2-c8cd5da7b2b0f570fd0a7aefef518d6a_r.jpg",
  "双廊":"https://pic2.zhimg.com/v2-c8cd5da7b2b0f570fd0a7aefef518d6a_r.jpg",
  "苍山索道":"https://pic2.zhimg.com/v2-c8cd5da7b2b0f570fd0a7aefef518d6a_r.jpg",
  "大研古城":"https://pic2.zhimg.com/v2-c5a49608599cbcdb9f09e7f4a3d4d726_1440w.jpg?source=172ae18b",
  "木府":"https://pic2.zhimg.com/v2-c5a49608599cbcdb9f09e7f4a3d4d726_1440w.jpg?source=172ae18b",
  "四方街":"https://youimg1.c-ctrip.com/target/1004180000015gjym48F8.jpg",
  "玉龙雪山":"https://pic2.zhimg.com/v2-c5a49608599cbcdb9f09e7f4a3d4d726_1440w.jpg?source=172ae18b",
  "蓝月谷":"https://pic2.zhimg.com/v2-c5a49608599cbcdb9f09e7f4a3d4d726_1440w.jpg?source=172ae18b",
  "束河古镇":"https://pic2.zhimg.com/v2-c5a49608599cbcdb9f09e7f4a3d4d726_1440w.jpg?source=172ae18b",
  "白沙壁画":"https://pic2.zhimg.com/v2-c5a49608599cbcdb9f09e7f4a3d4d726_1440w.jpg?source=172ae18b",
  "布达拉宫":"https://p0.itc.cn/images01/20230207/3dd29747d0384ab1bcfbc0a133cf9a9d.jpeg",
  "药王山":"https://www.lasa.gov.cn/lasa/xhtml/images/yx/04.jpg",
  "大昭寺":"https://www.lasa.gov.cn/lasa/xhtml/images/yx/04.jpg",
  "八廓街":"https://www.lasa.gov.cn/lasa/xhtml/images/yx/04.jpg",
  "色拉寺":"https://www.lasa.gov.cn/lasa/xhtml/images/yx/04.jpg",
  "纳木错":"https://www.lasa.gov.cn/lasa/xhtml/images/yx/04.jpg",
  "羊卓雍措":"https://www.lasa.gov.cn/lasa/xhtml/images/yx/04.jpg",
  "乐山大佛":"https://p4.itc.cn/images01/20210515/c4007e0b4acc4569a620fc3c5e5c0933.jpeg",
  "张公桥":"https://p4.itc.cn/images01/20210515/c4007e0b4acc4569a620fc3c5e5c0933.jpeg",
  "峨眉山":"https://p4.itc.cn/images01/20210515/c4007e0b4acc4569a620fc3c5e5c0933.jpeg",
  "金顶":"https://p4.itc.cn/images01/20210515/c4007e0b4acc4569a620fc3c5e5c0933.jpeg",
  "兵马俑":"https://youimg1.c-ctrip.com/target/100n0b0000005zitjB2CF.jpg",
  "华清宫":"https://n.sinaimg.cn/sinakd10100/600/w1500h700/20220614/3bc9-64208bfd3290196721c7a2b5c18913db.jpg",
  "古城墙":"https://n.sinaimg.cn/sinakd20108/46/w1434h1012/20220302/f13f-e5533e9d7fd9c2fc112e38b881c9f99f.jpg",
  "钟鼓楼":"https://n.sinaimg.cn/sinakd10100/600/w1500h700/20220614/3bc9-64208bfd3290196721c7a2b5c18913db.jpg",
  "回民街":"https://n.sinaimg.cn/sinakd10100/600/w1500h700/20220614/3bc9-64208bfd3290196721c7a2b5c18913db.jpg",
  "陕历博":"https://n.sinaimg.cn/sinakd10100/600/w1500h700/20220614/3bc9-64208bfd3290196721c7a2b5c18913db.jpg",
  "大雁塔":"https://n.sinaimg.cn/sinakd20110/300/w1620h1080/20201023/9221-kavypmq5572410.jpg",
  "大唐不夜城":"https://n.sinaimg.cn/sinacn10117/383/w2048h1535/20190202/ea1f-hsmkfyn8004098.jpg",
  "黄河母亲像":"https://n.sinaimg.cn/sinakd10122/159/w640h319/20200310/19e5-iqrhckn1944774.jpg",
  "中山桥":"https://p7.itc.cn/q_70/images03/20200613/67c7d33bebc54a88b6bacd4f8f616f5e.jpeg",
  "水车园":"https://n.sinaimg.cn/sinakd10122/159/w640h319/20200310/19e5-iqrhckn1944774.jpg",
  "白塔山":"http://youimg1.c-ctrip.com/target/fd/tg/g5/M0A/04/2F/CggYr1dAPtOAE0GVAAGRlzpuEos001.jpg",
  "甘肃省博":"https://n.sinaimg.cn/sinakd10122/159/w640h319/20200310/19e5-iqrhckn1944774.jpg",
  "正宁路夜市":"https://n.sinaimg.cn/sinakd10122/159/w640h319/20200310/19e5-iqrhckn1944774.jpg",
  "莫高窟":"https://pic3.zhimg.com/v2-10c9c1373353df23f7697247f5dafc5c_1200x500.jpg",
  "敦煌博物馆":"https://n.sinaimg.cn/sinakd20121/725/w2000h1125/20201003/c268-izwfpyt8756709.jpg",
  "鸣沙山月牙泉":"https://k.sinaimg.cn/n/default/1_img/upload/967b5637/750/w930h620/20221006/b0b6-b9d67fb0795b783b26b94092d6f466a0.jpg/w640slw.jpg",
  "沙洲夜市":"https://n.sinaimg.cn/sinakd20121/725/w2000h1125/20201003/c268-izwfpyt8756709.jpg",
  "西夏王陵":"https://www.nx.gov.cn/ssjn/zycs/202302/W020230216613117383967.png",
  "贺兰山岩画":"https://www.nx.gov.cn/ssjn/zycs/202302/W020230216613117383967.png",
  "沙湖":"https://www.nx.gov.cn/ssjn/zycs/202302/W020230216613117383967.png",
  "镇北堡西部影城":"https://www.nx.gov.cn/ssjn/zycs/202302/W020230216613117383967.png",
  "塔尔寺":"https://pic2.zhimg.com/v2-fbdedd88ba73b353bebcb68845272f2d_1440w.jpg?source=172ae18b",
  "东关清真大寺":"https://pic2.zhimg.com/v2-fbdedd88ba73b353bebcb68845272f2d_1440w.jpg?source=172ae18b",
  "莫家街":"https://pic2.zhimg.com/v2-fbdedd88ba73b353bebcb68845272f2d_1440w.jpg?source=172ae18b",
  "青海湖":"https://pic2.zhimg.com/v2-fbdedd88ba73b353bebcb68845272f2d_1440w.jpg?source=172ae18b",
  "日月山":"https://picx.zhimg.com/v2-26794c245271d643d33c84ea6926498d_r.jpg?source=1940ef5c",
  "二郎剑":"https://pic2.zhimg.com/v2-fbdedd88ba73b353bebcb68845272f2d_1440w.jpg?source=172ae18b",
  "国际大巴扎":"https://pic1.zhimg.com/v2-06d4e6f93149230d124e6cc4b63c23ac_b.jpg",
  "红山公园":"https://pic1.zhimg.com/v2-06d4e6f93149230d124e6cc4b63c23ac_b.jpg",
  "新疆博物馆":"https://pic1.zhimg.com/v2-06d4e6f93149230d124e6cc4b63c23ac_b.jpg",
  "天山天池":"https://pic1.zhimg.com/v2-06d4e6f93149230d124e6cc4b63c23ac_b.jpg",
  "吐鲁番":"https://pic1.zhimg.com/v2-06d4e6f93149230d124e6cc4b63c23ac_b.jpg",
  "火焰山":"https://pic1.zhimg.com/v2-06d4e6f93149230d124e6cc4b63c23ac_b.jpg",
  "葡萄沟":"https://pic1.zhimg.com/v2-06d4e6f93149230d124e6cc4b63c23ac_b.jpg",
  "喀什古城":"https://n.sinaimg.cn/sinakd20210802s/737/w1080h457/20210802/ddf5-667fdbd9837b5a16d56611686991184c.png",
  "高台民居":"https://picx.zhimg.com/50/v2-a51dc506f422b6a431969be79bbad886_720w.jpg?source=1940ef5c",
  "艾提尕尔清真寺":"https://n.sinaimg.cn/sinakd20210802s/737/w1080h457/20210802/ddf5-667fdbd9837b5a16d56611686991184c.png",
  "大巴扎":"https://n.sinaimg.cn/sinakd20210802s/737/w1080h457/20210802/ddf5-667fdbd9837b5a16d56611686991184c.png",
  "帕米尔高原":"https://n.sinaimg.cn/sinakd20210802s/737/w1080h457/20210802/ddf5-667fdbd9837b5a16d56611686991184c.png",
  "白沙湖":"https://n.sinaimg.cn/sinakd20210802s/737/w1080h457/20210802/ddf5-667fdbd9837b5a16d56611686991184c.png",
  "慕士塔格峰":"https://n.sinaimg.cn/sinakd20210802s/737/w1080h457/20210802/ddf5-667fdbd9837b5a16d56611686991184c.png",
  "八大局便民市场":"https://p2.itc.cn/q_70/images03/20210211/3694c9acef2e4269ac224868262bfaf9.jpeg",
  "海月楼":"https://p2.itc.cn/q_70/images03/20210211/3694c9acef2e4269ac224868262bfaf9.jpeg",
  "周村古商城":"https://youimg1.c-ctrip.com/target/100u14000000vz08qECF1.jpg",
  "临淄齐文化博物馆":"https://p2.itc.cn/q_70/images03/20210211/3694c9acef2e4269ac224868262bfaf9.jpeg",
  "麦积山石窟":"https://pic3.zhimg.com/v2-abab4aadd69a4a051c10e6accadcaf4e_r.jpg",
  "仙人崖":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g3/M07/0D/02/Cg-4WFSqpreIfAskAAlYaYU79CIAASsCQHoxWoACViB044.jpg",
  "伏羲庙":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g7/M00/0B/0A/ChMkLGMpvkmIaLDPAEHTMIPRH5cAAHuLgCGacgAQdNI472.jpg",
  "胡氏古民居":"https://n.sinaimg.cn/sinakd10110/200/w1080h720/20210320/fe2b-kmrcukz2021888.jpg",
  "四合院":"https://pic.nximg.cn/file/20220825/33331825_003626027127_2.jpg",
  "喀纳斯":"http://k.sinaimg.cn/n/sinakd20111/38/w1024h1414/20240526/914b-be04b466190abd105c7fb3c7bb4fdb66.jpg/w700d1q75cms.jpg?by=cms_fixed_width",
  "三湾":"http://k.sinaimg.cn/n/sinakd20111/38/w1024h1414/20240526/914b-be04b466190abd105c7fb3c7bb4fdb66.jpg/w700d1q75cms.jpg?by=cms_fixed_width",
  "观鱼台":"http://k.sinaimg.cn/n/sinakd20111/38/w1024h1414/20240526/914b-be04b466190abd105c7fb3c7bb4fdb66.jpg/w700d1q75cms.jpg?by=cms_fixed_width",
  "禾木村":"http://k.sinaimg.cn/n/sinakd20111/38/w1024h1414/20240526/914b-be04b466190abd105c7fb3c7bb4fdb66.jpg/w700d1q75cms.jpg?by=cms_fixed_width",
  "白桦林":"http://k.sinaimg.cn/n/sinakd20111/38/w1024h1414/20240526/914b-be04b466190abd105c7fb3c7bb4fdb66.jpg/w700d1q75cms.jpg?by=cms_fixed_width",
  "白哈巴":"http://k.sinaimg.cn/n/sinakd20111/38/w1024h1414/20240526/914b-be04b466190abd105c7fb3c7bb4fdb66.jpg/w700d1q75cms.jpg?by=cms_fixed_width",
  "可可托海":"http://k.sinaimg.cn/n/sinakd20111/38/w1024h1414/20240526/914b-be04b466190abd105c7fb3c7bb4fdb66.jpg/w700d1q75cms.jpg?by=cms_fixed_width",
  "勐焕大金塔":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g7/M00/04/09/ChMkK2RF8BqILsf8ABjmFJ6B7dIAAPRVgNVz-IAGOYs233.jpg",
  "银塔":"https://n.sinaimg.cn/sinakd20122/0/w2048h1152/20240518/52f3-b515df8e23322ba3da686ca837d9179f.jpg",
  "树包塔":"https://shuyi-tech-blog.oss-cn-shenzhen.aliyuncs.com/halo_blog_system_file/16163697023413.jpg",
  "芒市夜市":"https://youimg1.c-ctrip.com/target/10031c000001d20p6DED9.jpg",
  "三台山德昂族":"https://pic3.zhimg.com/v2-5ae36cce494d967494c55715fc6d5006_r.jpg",
  "古窑民俗博览区":"https://n.sinaimg.cn/sinacn16/213/w2048h1365/20180611/8c75-hcufqih0207174.jpg",
  "御窑厂":"https://youimg1.c-ctrip.com/target/100e0v000000k1nt7C3C8.jpg",
  "陶溪川文创街区":"https://p9.itc.cn/q_70/images03/20220228/8243a0d5c8b248b6a1b431891cbe2c8d.jpeg",
  "三宝村":"https://pica.zhimg.com/v2-4506c2422b862b8c910a2977496203e2_720w.jpg?source=172ae18b",
  "夜市":"https://pica.zhimg.com/v2-4506c2422b862b8c910a2977496203e2_720w.jpg?source=172ae18b",
  "隆兴寺":"https://picb.zhimg.com/v2-8d0117a908c55fc4b8b2001e43674a71_r.jpg",
  "开元寺须弥塔":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g7/M00/0B/05/ChMkLGMCv_uId7DgAAKs31O9lO8AAGs9wDNkwMAAqz3883.jpg",
  "广惠寺华塔":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g7/M00/0B/05/ChMkLGMCv_uId7DgAAKs31O9lO8AAGs9wDNkwMAAqz3883.jpg",
  "荣国府":"https://youimg1.c-ctrip.com/target/100i0x000000l3g4zADD7.jpg",
  "南城门":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g7/M00/0B/05/ChMkLGMCv_uId7DgAAKs31O9lO8AAGs9wDNkwMAAqz3883.jpg",
  "小公园老骑楼":"https://pic.nfapp.southcn.com/nfplus/ossfs/pic/xy/202308/03/013bb4efabcd4906b27c384c9fdd1f1f_batchwm.jpg",
  "老妈宫":"https://pic.nfapp.southcn.com/nfplus/ossfs/pic/xy/202308/03/013bb4efabcd4906b27c384c9fdd1f1f_batchwm.jpg",
  "南澳岛":"https://pic4.zhimg.com/v2-b597e8c9443fa008b06d28883e1040c6_720w.jpg?source=172ae18b",
  "青澳湾":"https://pic.nfapp.southcn.com/nfplus/ossfs/pic/xy/202308/03/013bb4efabcd4906b27c384c9fdd1f1f_batchwm.jpg",
  "风车山":"https://pic.nfapp.southcn.com/nfplus/ossfs/pic/xy/202308/03/013bb4efabcd4906b27c384c9fdd1f1f_batchwm.jpg",
  "总兵府":"https://pic.nfapp.southcn.com/nfplus/ossfs/pic/xy/202308/03/013bb4efabcd4906b27c384c9fdd1f1f_batchwm.jpg",
  "广济桥":"https://pic.nfapp.southcn.com/nfplus/ossfs/pic/xy/202011/17/b4259fccf7364bef8e01b1381a1562fd.jpg",
  "韩文公祠":"http://n.sinaimg.cn/sinacn18/200/w1080h720/20180417/f19d-fzihnep0367093.jpg",
  "牌坊街":"https://youimg1.c-ctrip.com/target/100q1f000001grkel4BC3_W_10000_1200.jpg?proc=autoorient",
  "开元寺":"http://n.sinaimg.cn/sinacn18/200/w1080h720/20180417/f19d-fzihnep0367093.jpg",
  "潮州西湖":"http://n.sinaimg.cn/sinacn18/200/w1080h720/20180417/f19d-fzihnep0367093.jpg",
  "淡浮院":"http://n.sinaimg.cn/sinacn18/200/w1080h720/20180417/f19d-fzihnep0367093.jpg",
  "邛海湿地公园":"https://p2.img.cctvpic.com/photoworkspace/contentimg/2022/12/08/2022120811113123497.jpg",
  "泸山":"https://p2.img.cctvpic.com/photoworkspace/contentimg/2022/12/08/2022120811113123497.jpg",
  "卫星发射中心":"https://p2.img.cctvpic.com/photoworkspace/contentimg/2022/12/08/2022120811113123497.jpg",
  "建昌古城":"https://p2.itc.cn/q_70/images03/20221104/191a89b4fcc74dac82255a58583c2a1e.jpeg",
  "镜泊湖":"https://foruma.tx538.app/data/attachment/forum/202603/13/163805t1laqq4a6dm4kem2.jpg",
  "吊水楼瀑布":"https://pic4.zhimg.com/v2-0e6fa18dff46337061129365642a7b7b_r.jpg",
  "雪乡":"https://imgk.pospal.cn/docs/创新功能/小程序/微信小程序/小程序备案攻略/025.png",
  "双峰林场":"https://pic3.zhimg.com/v2-e7845ab57e7d424b90fd67cfbbbc930e_b.jpg",
  "横道河子虎园":"https://pic4.zhimg.com/v2-6b8db2814627a8f4d9cdbad91383e71b_b.jpg",
  "鸭绿江断桥":"https://whly.ln.gov.cn/whly/imageDir/2025/12/img_pc_site/2025120115504056489.png",
  "中朝友谊桥":"https://whly.ln.gov.cn/whly/imageDir/2025/12/img_pc_site/2025120115504056489.png",
  "锦江公园":"https://whly.ln.gov.cn/whly/imageDir/2025/12/img_pc_site/2025120115504056489.png",
  "凤凰山":"https://whly.ln.gov.cn/whly/imageDir/2025/12/img_pc_site/2025120115504056489.png",
  "虎山长城":"https://whly.ln.gov.cn/whly/imageDir/2025/12/img_pc_site/2025120115504056489.png",
  "一步跨":"https://whly.ln.gov.cn/whly/imageDir/2025/12/img_pc_site/2025120115504056489.png",
  "五营国家森林公园":"https://pic2.zhimg.com/v2-55acc7f95b0612b3b4501c783bea00e3_r.jpg?source=1940ef5c",
  "天赐湖":"https://pic2.zhimg.com/v2-55acc7f95b0612b3b4501c783bea00e3_r.jpg?source=1940ef5c",
  "汤旺河石林":"https://pic2.zhimg.com/v2-55acc7f95b0612b3b4501c783bea00e3_r.jpg?source=1940ef5c",
  "嘉荫恐龙地质公园":"https://pic2.zhimg.com/v2-55acc7f95b0612b3b4501c783bea00e3_r.jpg?source=1940ef5c",
  "海拉尔":"https://pic1.zhimg.com/v2-0f7acb5de4865ddd2e362f6c7b58e53a_r.jpg?source=172ae18b",
  "莫日格勒河":"https://pic1.zhimg.com/v2-0f7acb5de4865ddd2e362f6c7b58e53a_r.jpg?source=172ae18b",
  "额尔古纳湿地":"https://pic1.zhimg.com/v2-0f7acb5de4865ddd2e362f6c7b58e53a_r.jpg?source=172ae18b",
  "恩和":"https://pic1.zhimg.com/v2-0f7acb5de4865ddd2e362f6c7b58e53a_r.jpg?source=172ae18b",
  "室韦":"https://pic1.zhimg.com/v2-0f7acb5de4865ddd2e362f6c7b58e53a_r.jpg?source=172ae18b",
  "满洲里套娃广场":"https://pic1.zhimg.com/v2-0f7acb5de4865ddd2e362f6c7b58e53a_r.jpg?source=172ae18b",
  "呼伦湖":"https://pic1.zhimg.com/v2-0f7acb5de4865ddd2e362f6c7b58e53a_r.jpg?source=172ae18b",
  "稻城白塔":"https://n.sinaimg.cn/sinakd20110/134/w2000h1334/20211212/375c-16c7cd8a6c53c27d74782e0e57a0b6e5.jpg",
  "红草地":"https://n.sinaimg.cn/sinakd20110/134/w2000h1334/20211212/375c-16c7cd8a6c53c27d74782e0e57a0b6e5.jpg",
  "亚丁":"https://n.sinaimg.cn/sinakd20110/134/w2000h1334/20211212/375c-16c7cd8a6c53c27d74782e0e57a0b6e5.jpg",
  "冲古寺":"https://n.sinaimg.cn/sinakd20110/134/w2000h1334/20211212/375c-16c7cd8a6c53c27d74782e0e57a0b6e5.jpg",
  "洛绒牛场":"https://picb.zhimg.com/v2-086ffc2a08b7bbcf59347300c782b2f4_r.jpg",
  "牛奶海":"https://infojiao.cc/wp-content/uploads/2024/07/17186663737468.jpg",
  "五色海":"https://infojiao.cc/wp-content/uploads/2024/07/17186663737468.jpg",
  "珍珠海":"https://www.kengdodo.com/wp-content/uploads/2024/07/7709.png",
  "傍河青杨林":"https://img0.miaoshoucdn.com/ueditor/php/upload/image/20221009/1665303991954520.png",
  "普达措国家公园":"https://img.alicdn.com/bao/uploaded/i3/1027194698/O1CN01r2yBIL1kZjXX5F65C_!!1027194698.jpg",
  "属都湖":"https://pic1.zhimg.com/v2-248358174ce324d78d5d9b0ea402f284_r.jpg",
  "碧塔海":"https://img.shetu66.com/2023/06/13/1686646664308543.jpg",
  "噶丹松赞林寺":"https://img.alicdn.com/bao/uploaded/i1/399203802/O1CN012LQuVr1dxMiDIj9Jb_!!399203802.jpg",
  "独克宗古城":"https://k.sinaimg.cn/n/sinacn/w690h460/20180113/ec7b-fyqrewh6969594.jpg/w700d1q75cms.jpg",
  "纳帕海":"https://picx.zhimg.com/v2-b3917b16a62b24ba1bfbfa89bb7dd06a_r.jpg?source=1def8aca",
  "火山地质公园":"https://pic3.zhimg.com/v2-fbc44f8e51248ce16e8a6eb9d3b83faa_r.jpg",
  "热海":"https://pic3.zhimg.com/v2-fbc44f8e51248ce16e8a6eb9d3b83faa_r.jpg",
  "大滚锅":"https://pic3.zhimg.com/v2-fbc44f8e51248ce16e8a6eb9d3b83faa_r.jpg",
  "温泉":"https://pic3.zhimg.com/v2-fbc44f8e51248ce16e8a6eb9d3b83faa_r.jpg",
  "和顺古镇":"https://pic3.zhimg.com/v2-fbc44f8e51248ce16e8a6eb9d3b83faa_r.jpg",
  "银杏村":"https://n.sinaimg.cn/sinakd20118/400/w1200h800/20201215/4300-kffctcc4526810.jpg",
  "中科院植物园":"https://pic4.zhimg.com/v2-3751b90e20636b8240a0e78f3f9c74d5_r.jpg?source=1940ef5c",
  "傣族园":"https://pic4.zhimg.com/v2-3751b90e20636b8240a0e78f3f9c74d5_r.jpg?source=1940ef5c",
  "野象谷":"https://pic4.zhimg.com/v2-3751b90e20636b8240a0e78f3f9c74d5_r.jpg?source=1940ef5c",
  "原始森林公园":"https://pic4.zhimg.com/v2-3751b90e20636b8240a0e78f3f9c74d5_r.jpg?source=1940ef5c",
  "告庄西双景":"https://pic4.zhimg.com/v2-3751b90e20636b8240a0e78f3f9c74d5_r.jpg?source=1940ef5c",
  "澜沧江":"https://pic4.zhimg.com/v2-3751b90e20636b8240a0e78f3f9c74d5_r.jpg?source=1940ef5c",
  "龙凤头海滨":"https://pic4.zhimg.com/v2-8882092dfb173e757ec43fec910ce238_r.jpg?source=172ae18b",
  "坛南湾":"https://pic4.zhimg.com/v2-8882092dfb173e757ec43fec910ce238_r.jpg?source=172ae18b",
  "北港石头厝":"https://pic4.zhimg.com/v2-8882092dfb173e757ec43fec910ce238_r.jpg?source=172ae18b",
  "长屿岛":"https://pic4.zhimg.com/v2-8882092dfb173e757ec43fec910ce238_r.jpg?source=172ae18b",
  "猴研岛":"https://pic4.zhimg.com/v2-8882092dfb173e757ec43fec910ce238_r.jpg?source=172ae18b",
  "九曲溪竹筏":"http://vip-public.people.com.cn/photo/2022/12/8/8a74808882124ea4882a30539828f45acmqX_m.jpg",
  "天游峰":"https://newbbs-fd.zol-img.com.cn/t_s1200x5000/g2/M00/0B/0B/ChMlWlz5vvmILQoJAA3Y1xBI3bcAAKoZQAGV7MADdjv681.jpg",
  "大红袍景区":"https://img.mianfeiwendang.com/pic/dab7a3fd9e41319709c08f2600f978412ea471cf/1-1068-jpg_6_0_______-791-0-0-791.jpg",
  "下梅古村":"https://5b0988e595225.cdn.sohucs.com/images/20200108/8e9d7aea7d344f17b48c6d8ac5b607af.jpeg",
  "鳄鱼山火山公园":"http://k.sinaimg.cn/n/front/129/w628h301/20190307/lCSf-htwhfzs9562191.jpg/w700d1q75cms.jpg",
  "滴水丹屏":"https://pic2.zhimg.com/v2-f12d595064a91a7a51fd6c0f24ea8bbd_r.jpg",
  "灯塔":"https://pic.nximg.cn/file/20230531/5148852_112850624103_2.jpg",
  "石螺口海滩":"http://k.sinaimg.cn/n/sinakd20230831s/416/w864h1152/20230831/2aee-326380c8838eeb7147a59a90e35210e1.jpg/w700d1q75cms.jpg",
  "天主教堂":"https://k.sinaimg.cn/www/dy/slidenews/61_img/2016_04/40602_1326788_224147.jpg/w640slw.jpg",
  "暮色海滩":"https://pic1.zhimg.com/v2-0d2a521d57b90d1dc521792e688c1310_r.jpg",
  "北坡天池":"https://n.sinaimg.cn/sinakd20220112s/126/w1080h1446/20220112/32b5-2c28efb393624d65da3375151297b819.jpg",
  "长白瀑布":"https://www.dipmoban.com/up/法国艾克斯马赛学院.jpg",
  "绿渊潭":"https://pic3.zhimg.com/v2-4713704f045a6ad942b647b26f8d50ec_1440w.jpg",
  "地下森林":"http://5b0988e595225.cdn.sohucs.com/images/20180519/340f301dac3947a7be4148291ff3224b.png",
  "西坡天池":"https://pic4.zhimg.com/v2-b4d2cd12be3c4e89c1f0492686cf0feb_r.jpg",
  "日月湾":"https://picx.zhimg.com/v2-0f4a594db462ff19d6d1d58dc7adf282_720w.jpg?source=172ae18b",
  "神州半岛":"https://youimg1.c-ctrip.com/target/100n10000000q2w73E48C.jpg",
  "兴隆热带植物园":"https://picx.zhimg.com/v2-0f4a594db462ff19d6d1d58dc7adf282_720w.jpg?source=172ae18b",
  "普陀山":"https://pic3.zhimg.com/v2-7dc9b8d914e658a6f44d788d4c1cd8ee_r.jpg",
  "普济寺":"https://pic4.zhimg.com/v2-5c26a173c3b76e3b6114b38c487600f2_r.jpg",
  "南海观音":"https://pic4.zhimg.com/v2-5c26a173c3b76e3b6114b38c487600f2_r.jpg",
  "百步沙":"https://qh.sz.gov.cn/img/4/4454/4454447/12852708.png",
  "东极岛":"https://pic4.zhimg.com/v2-5c26a173c3b76e3b6114b38c487600f2_r.jpg",
  "朱家尖南沙":"https://pic4.zhimg.com/v2-5c26a173c3b76e3b6114b38c487600f2_r.jpg",
  "缙云仙都":"https://n.sinaimg.cn/sinakd20122/106/w2048h1258/20220411/29e6-80bb9b653170303c57a7ade51de46271.jpg",
  "鼎湖峰":"https://n.sinaimg.cn/sinakd20221007s/200/w640h360/20221007/eb60-f0bb25362abef79fde0963b1de79e72f.jpg",
  "朱潭山":"https://youimg1.c-ctrip.com/target/0103h120008bwcjt9A0BA_D_10000_1200.jpg?proc=autoorient",
  "缙云烧饼":"http://k.sinaimg.cn/n/sinacn17/246/w660h386/20180710/6b44-hezpzwu8780651.jpg/w700d1q75cms.jpg",
  "古堰画乡":"https://n.sinaimg.cn/sinakd10118/182/w1128h654/20221029/ddc3-a4d086c02a6726da6231adfb42c06e56.jpg",
  "云和梯田":"https://pub.chineseheadlinenews.com/upload_files/image/202601/20260129_17697255535615.webp",
  "瑷珲历史陈列馆":"https://p0.itc.cn/q_70/images03/20210219/d3c04fcf757d42118c7f39988e2ae542.png",
  "黑龙江公园":"https://p0.itc.cn/q_70/images03/20210219/d3c04fcf757d42118c7f39988e2ae542.png",
  "中俄互市贸易区":"https://p0.itc.cn/q_70/images03/20210219/d3c04fcf757d42118c7f39988e2ae542.png",
  "五大连池":"https://pic1.zhimg.com/v2-1df1b9678f24ae6c2b89034760d801e8_r.jpg",
  "逊克":"https://p0.itc.cn/q_70/images03/20210219/d3c04fcf757d42118c7f39988e2ae542.png",
  "雅鲁藏布大峡谷":"https://pic4.zhimg.com/v2-232e47ec472ead43ffbc339cafd1c447_b.jpg",
  "南迦巴瓦观景台":"https://pic4.zhimg.com/v2-ebf1f7f771b5db9565cd959cca647fdf_r.jpg",
  "索松村":"https://pic3.zhimg.com/v2-350adeb86b6c77f376d06148593f1ec2_1440w.jpg",
  "巴松措":"https://pic.nximg.cn/file/20160515/8952533_170704988000_2.jpg",
  "鲁朗林海":"http://jl.people.com.cn/NMediaFile/2025/0417/LOCAL1744896478473EHDM3QVASH.jpg",
};
function loadSpotImages(){
  document.querySelectorAll('.spot-img:not([data-loaded])').forEach(box=>{
    box.setAttribute('data-loaded','1');
    const city=box.dataset.city, spot=box.dataset.spot, key=city+'|'+spot;
    if(_spotImgCache.has(key)){box.innerHTML=_spotImgCache.get(key);return;}
    const url=SPOT_IMAGES[spot]||`https://picsum.photos/seed/${encodeURIComponent(city+spot)}/400/300`;
    const h=`<img src="${url}" loading="lazy" decoding="async" alt="${spot}">`;
    _spotImgCache.set(key,h);box.innerHTML=h;
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
