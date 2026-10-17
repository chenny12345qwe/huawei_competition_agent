// 旅行手账：本地草稿(localStorage) + 公共广场(Supabase)
// ============================================================
// Supabase 配置：把下面两个常量填入你申请到的项目密钥
//   1) 登录 https://supabase.com 新建项目
//   2) 在 SQL Editor 执行建表(见下方 SQL)
//   3) 在 Project Settings > API 取 URL 和 anon public key，填入此处
//   SUPABASE_URL https://awsxyldbbasuvuselkxof.supabase.co，例如 https://xxxx.supabase.co
//   SUPABASE_ANON_KEY 填 sb_publishable__NdocSIaLAb1hFxO6EVd7g_eQPD-gjV
//
// 建表 SQL：
//   create table journals (
//     id bigint generated always as identity primary key,
//     title text not null, content text, images jsonb,
//     city text, cat text, rating int, loc jsonb, loc_name text,
//     nickname text, created_at timestamptz default now()
//   );
//   alter table journals enable row level security;
//   create policy "anon select" on journals for select using (true);
//   create policy "anon insert" on journals for insert with check (true);
//
// 演示说明：本项目使用 Supabase 免费配额 BaaS 提供公共存储，
//   免费版存在访问与存储额度限制，仅供大赛作品演示，不作为正式线上服务。
// ============================================================
const SUPABASE_URL='https://awsxyldbbasuvuselkxof.supabase.co';       // TODO: 填入你的 Supabase 项目 URL
const SUPABASE_ANON_KEY='sb_publishable__NdocSIaLAb1hFxO6EVd7g_eQPD-gjV';  // TODO: 填入你的 Supabase anon public key

const JOURNAL_KEY='travelJournals';
const NICK_KEY='journalNick';
const JOURNAL_CATS={
  food:{name:'🍜 美食',color:'#FFF4E6',text:'#C97B1F'},
  sight:{name:'🏞️ 景点',color:'#E8F8E8',text:'#3A8A3A'},
  experience:{name:'🎉 体验',color:'#F0E8FF',text:'#7B3FC9'},
  hotel:{name:'🏨 住宿',color:'#E8F0FF',text:'#2670B8'},
  tips:{name:'💡 贴士',color:'#FFF9E6',text:'#C97B1F'}
};
let _pickMap=null,_pickMarker=null,_editImages=[],_editRating=0,_editCat='food',_editLoc=null;
let _squareLoaded=false,_squareOffset=0,_squareLoading=false,_squareEnd=false;

function getJournals(){ try{return JSON.parse(localStorage.getItem(JOURNAL_KEY))||[]}catch(e){return []} }
function saveJournals(a){ localStorage.setItem(JOURNAL_KEY,JSON.stringify(a)); }
function getNick(){ let n=localStorage.getItem(NICK_KEY); if(!n){n='旅人'+Math.random().toString(36).slice(2,6).toUpperCase();localStorage.setItem(NICK_KEY,n);} return n; }

function initJournal(){
  createCitySearch(document.getElementById('journalCity'),{placeholder:'搜索城市',onPick:flyToCity});
  document.getElementById('journalNew').addEventListener('click',openJournalEditor);
  document.getElementById('journalCancel').addEventListener('click',closeJournalEditor);
  document.getElementById('journalSave').addEventListener('click',saveJournal);
  document.getElementById('journalPublish').addEventListener('click',publishJournal);
  document.getElementById('journalFilter').addEventListener('change',renderJournalList);
  document.getElementById('journalImgInput').addEventListener('change',handleImgUpload);
  document.getElementById('journalLocName').addEventListener('input',_locDebounce);
  document.getElementById('journalDetailClose').addEventListener('click',()=>document.getElementById('journalDetail').classList.add('hidden'));
  document.getElementById('journalCatTags').addEventListener('click',e=>{
    const t=e.target.closest('.journal-cat-tag');if(!t)return;
    document.querySelectorAll('.journal-cat-tag').forEach(b=>b.classList.remove('active'));
    t.classList.add('active');_editCat=t.dataset.cat;
  });
  document.getElementById('subtabMine').addEventListener('click',()=>switchSubtab('mine'));
  document.getElementById('subtabSquare').addEventListener('click',()=>switchSubtab('square'));
  renderJournalList();
}

function switchSubtab(which){
  const mine=document.getElementById('subtabMine'),sq=document.getElementById('subtabSquare');
  mine.classList.toggle('active',which==='mine');
  sq.classList.toggle('active',which==='square');
  document.getElementById('journalMine').classList.toggle('hidden',which!=='mine');
  document.getElementById('journalSquare').classList.toggle('hidden',which!=='square');
  if(which==='square'&&!_squareLoaded)loadSquare();
}

function renderJournalList(){
  const filter=document.getElementById('journalFilter').value;
  const list=getJournals().filter(j=>filter==='all'||j.cat===filter).sort((a,b)=>b.ts-a.ts);
  const box=document.getElementById('journalList');
  if(!list.length){box.innerHTML='<div class="journal-empty"><div class="big">📔</div>还没有手账，点击「写手账」记录你的旅行吧</div>';return;}
  box.innerHTML=list.map(j=>journalCardHtml(j,false)).join('');
  box.querySelectorAll('.journal-card').forEach(c=>c.addEventListener('click',()=>showJournalDetail(c.dataset.id,false)));
}

function journalCardHtml(j,isSquare){
  const cat=JOURNAL_CATS[j.cat]||JOURNAL_CATS.food;
  const thumb=j.images&&j.images[0]?`<img class="journal-thumb" src="${j.images[0]}">`:'';
  const stars='★'.repeat(j.rating||0)+'☆'.repeat(5-(j.rating||0));
  const nick=isSquare?`<div class="j-nick">by ${escHtml(j.nickname||'匿名')}</div>`:'';
  return `<div class="journal-card square-card" data-id="${j.id}">
    ${thumb}<div class="journal-info">
      <span class="journal-cat" style="background:${cat.color};color:${cat.text}">${cat.name}</span>
      <h4>${escHtml(j.title||'无标题')}</h4>
      <div class="j-city">📍 ${escHtml(j.city||'')} ${j.locName||j.loc_name?'· '+escHtml(j.locName||j.loc_name):''}</div>
      <div class="j-excerpt">${escHtml((j.content||'').slice(0,60))}</div>
      <div class="j-stars">${stars}</div>${nick}
    </div></div>`;
}

function openJournalEditor(){
  document.getElementById('journalTitle').value='';
  document.getElementById('journalContent').value='';
  document.getElementById('journalLocName').value='';
  document.getElementById('journalCity').value='';
  document.querySelectorAll('.journal-cat-tag').forEach(b=>b.classList.toggle('active',b.dataset.cat==='food'));
  _editImages=[];_editRating=0;_editCat='food';_editLoc=null;
  renderImgPreview();renderRating();
  document.getElementById('journalEditor').classList.remove('hidden');
  setTimeout(initPickMap,50);
}
function closeJournalEditor(){document.getElementById('journalEditor').classList.add('hidden');if(_pickMap){_pickMap.remove();_pickMap=null;_pickMarker=null;}}

function initPickMap(){
  if(_pickMap){_pickMap.invalidateSize();return;}
  _pickMap=L.map('journalPickMap',{zoomControl:true,attributionControl:false}).setView([35,108],4);
  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',{
    subdomains:['1','2','3','4'],maxZoom:18
  }).addTo(_pickMap);
  _pickMap.on('click',e=>{
    if(_pickMarker)_pickMarker.setLatLng(e.latlng);
    else _pickMarker=L.marker(e.latlng).addTo(_pickMap);
    _editLoc={lat:e.latlng.lat,lng:e.latlng.lng};
  });
  setTimeout(()=>_pickMap.invalidateSize(),100);
}

function _setMarker(lat,lng,zoom){
  if(!_pickMap)return;
  _pickMap.flyTo([lat,lng],zoom);
  if(_pickMarker)_pickMarker.setLatLng([lat,lng]);
  else _pickMarker=L.marker([lat,lng]).addTo(_pickMap);
  _editLoc={lat,lng};
}
function flyToCity(city){
  if(!CITY_COORDS[city])return;
  const [lat,lng]=CITY_COORDS[city];
  _setMarker(lat,lng,11);
}
// shortcut: Nominatim免费地理编码,国内覆盖一般且限1req/s,失败静默保持当前地图
let _locTimer=null;
function _locDebounce(){ clearTimeout(_locTimer); _locTimer=setTimeout(geocodeAndFly,600); }
async function geocodeAndFly(){
  const name=document.getElementById('journalLocName').value.trim();
  if(!name||!_pickMap)return;
  const city=document.getElementById('journalCity').value.trim();
  const q=city?`${name},${city},中国`:`${name},中国`;
  try{
    const res=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=zh&q=${encodeURIComponent(q)}`);
    const arr=await res.json();
    if(arr[0])_setMarker(+arr[0].lat,+arr[0].lon,15);
  }catch(e){}
}

// shortcut: 图片压缩为base64,公共广场直接存jsonb会吃Supabase配额,大图建议接Storage时升级
function compressImage(file,maxW,quality){
  return new Promise(res=>{
    const r=new FileReader();r.onload=()=>{
      const img=new Image();img.onload=()=>{
        let{width:w,height:h}=img;
        if(w>maxW){h=h*maxW/w;w=maxW;}
        const c=document.createElement('canvas');c.width=w;c.height=h;
        c.getContext('2d').drawImage(img,0,0,w,h);
        res(c.toDataURL('image/jpeg',quality));
      };img.src=r.result;
    };r.readAsDataURL(file);
  });
}
async function handleImgUpload(e){
  const files=Array.from(e.target.files);
  for(const f of files){if(_editImages.length>=9)break;_editImages.push(await compressImage(f,800,0.7));}
  e.target.value='';renderImgPreview();
}
function renderImgPreview(){
  document.getElementById('journalImgPreview').innerHTML=_editImages.map((src,i)=>
    `<div class="j-del" data-i="${i}"><img src="${src}"></div>`).join('');
  document.querySelectorAll('#journalImgPreview .j-del').forEach(d=>d.addEventListener('click',()=>{
    _editImages.splice(+d.dataset.i,1);renderImgPreview();
  }));
}
function renderRating(){
  const box=document.getElementById('journalRating');
  box.innerHTML=Array.from({length:5},(_,i)=>`<span class="star${i<_editRating?' active':''}" data-n="${i+1}">★</span>`).join('');
  box.querySelectorAll('.star').forEach(s=>s.addEventListener('click',()=>{_editRating=+s.dataset.n;renderRating();}));
}

function collectEditData(){
  const title=document.getElementById('journalTitle').value.trim();
  const content=document.getElementById('journalContent').value.trim();
  if(!title){alert('请填写标题');return null;}
  if(title.length>50){alert('标题过长（限50字）');return null;}
  if(content.length>2000){alert('正文过长（限2000字）');return null;}
  return {
    title,content,cat:_editCat,
    city:document.getElementById('journalCity').value.trim(),
    images:_editImages,rating:_editRating,
    loc:_editLoc,locName:document.getElementById('journalLocName').value.trim()
  };
}

function saveJournal(){
  const d=collectEditData();if(!d)return;
  const list=getJournals();
  list.push({id:'j'+Date.now()+Math.random().toString(36).slice(2,6),ts:Date.now(),...d});
  saveJournals(list);closeJournalEditor();renderJournalList();
}

async function publishJournal(){
  if(!SUPABASE_URL||!SUPABASE_ANON_KEY){alert('未配置 Supabase，请在 journal.js 顶部填写 SUPABASE_URL 和 SUPABASE_ANON_KEY');return;}
  const d=collectEditData();if(!d)return;
  const btn=document.getElementById('journalPublish');btn.disabled=true;btn.textContent='发布中…';
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/journals`,{
      method:'POST',
      headers:{'apikey':SUPABASE_ANON_KEY,'Authorization':`Bearer ${SUPABASE_ANON_KEY}`,'Content-Type':'application/json','Prefer':'return=representation'},
      body:JSON.stringify({...d,nickname:getNick()})
    });
    if(!res.ok)throw new Error('HTTP '+res.status);
    alert('✅ 已发布到公共广场');
    closeJournalEditor();
    _squareLoaded=false;_squareOffset=0;_squareEnd=false;
    if(!document.getElementById('journalSquare').classList.contains('hidden'))loadSquare();
    else switchSubtab('square');
  }catch(e){alert('发布失败：'+e.message+'\n（可能是 Supabase 配额或网络问题）');}
  finally{btn.disabled=false;btn.textContent='🌐 发布到广场';}
}

async function loadSquare(){
  if(_squareLoading||_squareEnd)return;
  if(!SUPABASE_URL||!SUPABASE_ANON_KEY){
    document.getElementById('squareList').innerHTML='<div class="square-loading">未配置 Supabase，无法加载公共广场。请在 journal.js 顶部填写 SUPABASE_URL 和 SUPABASE_ANON_KEY。</div>';return;
  }
  _squareLoading=true;
  const box=document.getElementById('squareList');
  if(_squareOffset===0)box.innerHTML='<div class="square-loading">⏳ 加载中…</div>';
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/journals?select=*&order=created_at.desc&limit=20&offset=${_squareOffset}`,{
      headers:{'apikey':SUPABASE_ANON_KEY,'Authorization':`Bearer ${SUPABASE_ANON_KEY}`}
    });
    if(!res.ok)throw new Error('HTTP '+res.status);
    const rows=await res.json();
    _squareLoaded=true;
    if(_squareOffset===0)box.innerHTML='';
    if(!rows.length){_squareEnd=true;if(_squareOffset===0)box.innerHTML='<div class="square-loading">广场还没有手账，快来发布第一条吧</div>';return;}
    box.insertAdjacentHTML('beforeend',rows.map(j=>journalCardHtml(j,true)).join(''));
    box.querySelectorAll('.square-card').forEach(c=>c.addEventListener('click',()=>showJournalDetail(c.dataset.id,true)));
    if(rows.length<20){_squareEnd=true;box.insertAdjacentHTML('beforeend','<div class="square-end">· 没有更多了 ·</div>');}
    else _squareOffset+=20;
  }catch(e){
    if(_squareOffset===0)box.innerHTML='<div class="square-loading">加载失败：'+e.message+'（可能是配额或网络问题）</div>';
  }finally{_squareLoading=false;}
}

function showJournalDetail(id,isSquare){
  if(isSquare){showSquareDetail(id);return;}
  const j=getJournals().find(x=>x.id===id);if(!j)return;
  const cat=JOURNAL_CATS[j.cat]||JOURNAL_CATS.food;
  const stars='★'.repeat(j.rating||0)+'☆'.repeat(5-(j.rating||0));
  const imgs=(j.images||[]).map(s=>`<img src="${s}">`).join('');
  const mapHtml=(j.loc&&j.loc.lat)?`<div class="journal-detail-map" id="jDetailMap"></div><div class="d-loc">📍 ${escHtml(j.locName||'标记位置')}</div>`:'';
  document.getElementById('journalDetailContent').innerHTML=`
    <h3>${escHtml(j.title)}</h3>
    <div class="d-meta"><span class="journal-cat" style="background:${cat.color};color:${cat.text}">${cat.name}</span> 📍 ${escHtml(j.city||'')} · ${new Date(j.ts).toLocaleDateString('zh-CN')} · ${stars}</div>
    <div class="d-content">${escHtml(j.content||'')}</div>
    ${imgs?`<div class="d-imgs">${imgs}</div>`:''}
    ${mapHtml}
    <div class="d-actions"><button class="d-del" data-id="${j.id}">🗑️ 删除</button></div>`;
  document.getElementById('journalDetail').classList.remove('hidden');
  const delBtn=document.querySelector('#journalDetailContent .d-del');
  if(delBtn)delBtn.addEventListener('click',()=>{
    if(!confirm('确定删除这条手账？'))return;
    saveJournals(getJournals().filter(x=>x.id!==id));
    document.getElementById('journalDetail').classList.add('hidden');renderJournalList();
  });
  if(j.loc&&j.loc.lat){
    setTimeout(()=>{
      const m=L.map('jDetailMap',{zoomControl:true,attributionControl:false}).setView([j.loc.lat,j.loc.lng],13);
      L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',{
        subdomains:['1','2','3','4'],maxZoom:18
      }).addTo(m);
      L.marker([j.loc.lat,j.loc.lng]).addTo(m);
      setTimeout(()=>m.invalidateSize(),100);
    },50);
  }
}

async function showSquareDetail(id){
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/journals?id=eq.${id}&select=*`,{
      headers:{'apikey':SUPABASE_ANON_KEY,'Authorization':`Bearer ${SUPABASE_ANON_KEY}`}
    });
    const rows=await res.json();const j=rows[0];if(!j)return;
    const cat=JOURNAL_CATS[j.cat]||JOURNAL_CATS.food;
    const stars='★'.repeat(j.rating||0)+'☆'.repeat(5-(j.rating||0));
    const imgs=(j.images||[]).map(s=>`<img src="${s}">`).join('');
    const loc=j.loc||null;
    const mapHtml=(loc&&loc.lat)?`<div class="journal-detail-map" id="jDetailMap"></div><div class="d-loc">📍 ${escHtml(j.loc_name||j.locName||'标记位置')}</div>`:'';
    document.getElementById('journalDetailContent').innerHTML=`
      <h3>${escHtml(j.title)}</h3>
      <div class="d-meta"><span class="journal-cat" style="background:${cat.color};color:${cat.text}">${cat.name}</span> 📍 ${escHtml(j.city||'')} · by ${escHtml(j.nickname||'匿名')} · ${new Date(j.created_at).toLocaleDateString('zh-CN')} · ${stars}</div>
      <div class="d-content">${escHtml(j.content||'')}</div>
      ${imgs?`<div class="d-imgs">${imgs}</div>`:''}
      ${mapHtml}`;
    document.getElementById('journalDetail').classList.remove('hidden');
    if(loc&&loc.lat){
      setTimeout(()=>{
        const m=L.map('jDetailMap',{zoomControl:true,attributionControl:false}).setView([loc.lat,loc.lng],13);
        L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',{
          subdomains:['1','2','3','4'],maxZoom:18
        }).addTo(m);
        L.marker([loc.lat,loc.lng]).addTo(m);
        setTimeout(()=>m.invalidateSize(),100);
      },50);
    }
  }catch(e){alert('加载详情失败：'+e.message);}
}

function escHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

initJournal();

// 滚动加载广场
new IntersectionObserver(es=>{if(es[0].isIntersecting)loadSquare();}).observe(document.getElementById('squareSentinel'));