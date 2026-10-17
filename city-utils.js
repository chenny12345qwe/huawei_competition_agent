// 城市拼音首字母映射 + 搜索选择组件（轻量，无第三方依赖）
const CITY_PINYIN = {
  "北京":"B","天津":"T","承德":"C","北戴河":"B","大同":"D","平遥":"P",
  "哈尔滨":"H","长春":"C","沈阳":"S","大连":"D","延吉":"Y","漠河":"M",
  "上海":"S","杭州":"H","苏州":"S","南京":"N","黄山":"H","婺源":"W",
  "厦门":"X","泉州":"Q","福州":"F","青岛":"Q","威海":"W","济南":"J",
  "泰山":"T","武汉":"W","长沙":"C","张家界":"Z","洛阳":"L","开封":"K",
  "神农架":"S","广州":"G","深圳":"S","珠海":"Z","南宁":"N","桂林":"G",
  "北海":"B","海口":"H","三亚":"S","成都":"C","重庆":"C","贵阳":"G",
  "昆明":"K","大理":"D","丽江":"L","拉萨":"L","乐山":"L","西安":"X",
  "兰州":"L","敦煌":"D","银川":"Y","西宁":"X","乌鲁木齐":"W","喀什":"K"
};

function cityInitial(city){ return CITY_PINYIN[city] || (city?city.charAt(0).toUpperCase():''); }

function sortedCities(list){
  return (list||Object.keys(CITY_COORDS)).sort((a,b)=>{
    const ia=cityInitial(a), ib=cityInitial(b);
    return ia===ib ? a.localeCompare(b,'zh') : ia.localeCompare(ib);
  });
}

// 把一个 <input> 增强为城市搜索选择框
// opts: { list?:string[], current?:string, placeholder?:string, onPick?:(city)=>void }
function createCitySearch(input, opts){
  opts = opts||{};
  const list = sortedCities(opts.list);
  if(opts.current) input.value = opts.current;
  if(opts.placeholder) input.placeholder = opts.placeholder;
  let wrap = input.parentElement;
  if(!wrap.classList.contains('city-search-wrap')){
    wrap = document.createElement('div');
    wrap.className = 'city-search-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
  }
  let box = wrap.querySelector('.city-search-list');
  if(!box){ box = document.createElement('div'); box.className='city-search-list hidden'; wrap.appendChild(box); }

  function filter(q){
    q = (q||'').trim().toLowerCase();
    const matches = list.filter(c=>{
      if(!q) return true;
      return c.toLowerCase().includes(q) || cityInitial(c).toLowerCase().includes(q);
    });
    if(!matches.length){ box.innerHTML='<div class="city-search-empty">无匹配城市</div>'; }
    else{
      box.innerHTML = matches.map(c=>`<div class="city-search-item" data-city="${c}"><span class="ci-letter">${cityInitial(c)}</span>${c}</div>`).join('');
    }
  }
  function open(){ filter(input.value); box.classList.remove('hidden'); }
  function close(){ box.classList.add('hidden'); }

  input.addEventListener('focus', open);
  input.addEventListener('input', open);
  input.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
  box.addEventListener('click', e=>{
    const item = e.target.closest('.city-search-item'); if(!item) return;
    input.value = item.dataset.city;
    close();
    if(opts.onPick) opts.onPick(item.dataset.city);
  });
  document.addEventListener('click', e=>{ if(!wrap.contains(e.target)) close(); });
  return { open, close, list };
}