// 旅行手账：本地草稿(localStorage)
const JOURNAL_KEY='travelJournals';
const JOURNAL_CATS={
  food:{name:'🍜 美食',color:'#FFF4E6',text:'#C97B1F'},
  sight:{name:'🏞️ 景点',color:'#E8F8E8',text:'#3A8A3A'},
  experience:{name:'🎉 体验',color:'#F0E8FF',text:'#7B3FC9'},
  hotel:{name:'🏨 住宿',color:'#E8F0FF',text:'#2670B8'},
  tips:{name:'💡 贴士',color:'#FFF9E6',text:'#C97B1F'}
};
let _pickMap=null,_pickMarker=null,_editImages=[],_editRating=0,_editCat='food',_editLoc=null;

function getJournals(){ try{return JSON.parse(localStorage.getItem(JOURNAL_KEY))||[]}catch(e){return []} }
function saveJournals(a){ localStorage.setItem(JOURNAL_KEY,JSON.stringify(a)); }

function initJournal(){
  createCitySearch(document.getElementById('journalCity'),{placeholder:'搜索城市',onPick:flyToCity});
  document.getElementById('journalNew').addEventListener('click',openJournalEditor);
  document.getElementById('journalCancel').addEventListener('click',closeJournalEditor);
  document.getElementById('journalSave').addEventListener('click',saveJournal);
  document.getElementById('journalFilter').addEventListener('change',renderJournalList);
  document.getElementById('journalImgInput').addEventListener('change',handleImgUpload);
  document.getElementById('journalLocName').addEventListener('input',_locDebounce);
  document.getElementById('journalDetailClose').addEventListener('click',()=>document.getElementById('journalDetail').classList.add('hidden'));
  document.getElementById('journalCatTags').addEventListener('click',e=>{
    const t=e.target.closest('.journal-cat-tag');if(!t)return;
    document.querySelectorAll('.journal-cat-tag').forEach(b=>b.classList.remove('active'));
    t.classList.add('active');_editCat=t.dataset.cat;
  });
  renderJournalList();
}

function renderJournalList(){
  const filter=document.getElementById('journalFilter').value;
  const list=getJournals().filter(j=>filter==='all'||j.cat===filter).sort((a,b)=>b.ts-a.ts);
  const box=document.getElementById('journalList');
  if(!list.length){box.innerHTML='<div class="journal-empty"><div class="big">📔</div>还没有手账，点击「写手账」记录你的旅行吧</div>';return;}
  box.innerHTML=list.map(j=>{
    const cat=JOURNAL_CATS[j.cat]||JOURNAL_CATS.food;
    const thumb=j.images&&j.images[0]?`<img class="journal-thumb" src="${j.images[0]}">`:'';
    const stars='★'.repeat(j.rating||0)+'☆'.repeat(5-(j.rating||0));
    return `<div class="journal-card" data-id="${j.id}">
      ${thumb}<div class="journal-info">
        <span class="journal-cat" style="background:${cat.color};color:${cat.text}">${cat.name}</span>
        <h4>${escHtml(j.title||'无标题')}</h4>
        <div class="j-city">📍 ${escHtml(j.city||'')} ${j.locName?'· '+escHtml(j.locName):''}</div>
        <div class="j-excerpt">${escHtml((j.content||'').slice(0,60))}</div>
        <div class="j-stars">${stars}</div>
      </div></div>`;
  }).join('');
  box.querySelectorAll('.journal-card').forEach(c=>c.addEventListener('click',()=>showJournalDetail(c.dataset.id)));
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

// shortcut: 图片压缩为base64存localStorage,大图会占配额(约5MB),需云端存储时升级
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

function saveJournal(){
  const title=document.getElementById('journalTitle').value.trim();
  if(!title){alert('请填写标题');return;}
  const list=getJournals();
  list.push({
    id:'j'+Date.now()+Math.random().toString(36).slice(2,6),
    ts:Date.now(),title,cat:_editCat,
    city:document.getElementById('journalCity').value.trim(),
    content:document.getElementById('journalContent').value.trim(),
    images:_editImages,rating:_editRating,
    loc:_editLoc,locName:document.getElementById('journalLocName').value.trim()
  });
  saveJournals(list);closeJournalEditor();renderJournalList();
}

function showJournalDetail(id){
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

function escHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

initJournal();