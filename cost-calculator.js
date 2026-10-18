const CITY_COORDS = {
  "北京":[39.9042,116.4074],"天津":[39.0842,117.2009],"承德":[40.9510,117.9622],
  "北戴河":[39.8350,119.4930],"大同":[40.0768,113.3001],"平遥":[37.1897,112.1756],
  "哈尔滨":[45.8038,126.5350],"长春":[43.8171,125.3235],"沈阳":[41.8057,123.4315],
  "大连":[38.9140,121.6147],"延吉":[42.8910,129.5096],"漠河":[53.4771,122.5316],
  "上海":[31.2304,121.4737],"杭州":[30.2741,120.1551],"苏州":[31.2989,120.5853],
  "南京":[32.0603,118.7969],"扬州":[32.3942,119.4126],"黄山":[29.7147,117.6431],
  "婺源":[29.2456,117.5630],"厦门":[24.8471,118.5627],"泉州":[24.8741,118.6757],
  "福州":[26.0745,119.2965],"青岛":[36.0671,120.3826],"威海":[37.4638,122.1946],
  "济南":[36.6512,117.1201],"泰山":[36.2000,117.0889],"武汉":[30.5928,114.3055],
  "长沙":[28.2282,112.9388],"张家界":[29.1172,110.0793],"洛阳":[34.6197,112.4540],
  "开封":[34.7974,114.3474],"神农架":[31.7447,110.6738],"广州":[23.1291,113.2644],
  "深圳":[22.5431,113.9260],"珠海":[22.2710,113.5767],"南宁":[22.8170,108.3669],
  "桂林":[25.2734,110.2907],"北海":[21.4850,109.1228],"海口":[20.0440,110.1989],
  "三亚":[18.2528,109.5120],"成都":[30.5728,104.0668],"重庆":[29.5630,106.5516],
  "贵阳":[26.6470,106.6302],"昆明":[25.0389,102.7183],"大理":[25.6065,100.2675],
  "丽江":[26.8721,100.2258],"拉萨":[29.6500,91.1400],"乐山":[29.5524,103.7660],
  "西安":[34.3416,108.9398],"兰州":[36.0611,103.8343],"敦煌":[40.1421,94.6620],
  "银川":[38.4872,106.2309],"西宁":[36.6171,101.7782],"乌鲁木齐":[43.8256,87.6168],
  "喀什":[39.4704,75.9898],
  "淄博":[36.80,118.05],"天水":[34.58,105.72],"阿勒泰":[47.85,88.14],"芒市":[24.43,98.59],
  "景德镇":[29.27,117.18],"正定":[38.15,114.57],"汕头":[23.35,116.68],"潮州":[23.39,116.63],
  "西昌":[27.90,102.26],"牡丹江":[44.55,129.63],"丹东":[40.00,124.35],"伊春":[47.73,128.90],
  "呼伦贝尔":[49.21,119.77],"稻城":[28.41,100.33],"香格里拉":[27.83,99.71],"腾冲":[25.02,98.49],
  "西双版纳":[22.00,100.80],"平潭":[25.50,119.79],"武夷山":[27.76,117.99],"涠洲岛":[21.03,109.15],
  "长白山":[42.02,128.08],"万宁":[18.80,110.39],"舟山":[30.03,122.11],"丽水":[28.45,119.92],
  "黑河":[50.24,127.53],"林芝":[29.65,94.36]
};

function haversine(lat1,lng1,lat2,lng2){
  const R=6371, toRad=d=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

const TRANSPORT = {
  plane:{name:"✈️ 飞机",costPerKm:1.1,baseCost:50,speed:800,extraTime:2,note:"经济舱+燃油基建费"},
  gaotie:{name:"🚄 高铁",costPerKm:0.46,baseCost:0,speed:250,extraTime:0.5,note:"二等座"},
  train:{name:"🚂 火车",costPerKm:0.15,baseCost:0,speed:100,extraTime:0.5,note:"硬座"},
  car:{name:"🚗 自驾",costPerKm:1.1,baseCost:0,speed:80,extraTime:0,note:"油费+过路费"},
  bus:{name:"🚌 大巴",costPerKm:0.3,baseCost:0,speed:70,extraTime:0.5,note:"长途大巴"}
};

// 三档单价：住宿元/晚/间、餐饮元/天/人、门票元/天/人、交通相对系数
const COST_TIERS = [
  {key:'low',  name:'最低', hotel:200, food:60,  ticket:100, tFactor:0.9},
  {key:'mid',  name:'参考', hotel:350, food:100, ticket:180, tFactor:1.0},
  {key:'high', name:'宽松', hotel:600, food:150, ticket:280, tFactor:1.3},
];

// shortcut: OSRM公共服务器国内可能不稳定,失败时降级Haversine直线
async function getOSRMDistance(from,to){
  const [lat1,lng1]=CITY_COORDS[from], [lat2,lng2]=CITY_COORDS[to];
  const url=`https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
  try{
    const res=await Promise.race([fetch(url),new Promise((_,r)=>setTimeout(()=>r(),8000))]);
    if(!res) return null;
    const data=await res.json();
    if(data.code==='Ok'&&data.routes.length>0){
      return {distance:data.routes[0].distance, duration:data.routes[0].duration, coords:data.routes[0].geometry.coordinates};
    }
  }catch(e){}
  return null;
}

let _map=null, _routeLayer=null, _markers=[];
function updateMapPreview(from,to,osrmCoords,mode){
  const mapEl=document.getElementById('costMap');
  if(!from||!to||from===to||mapEl.offsetWidth===0) return;
  if(!_map){
    _map=L.map('costMap',{zoomControl:true,attributionControl:false});
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',{
      subdomains:['1','2','3','4'], maxZoom:18
    }).addTo(_map);
  }
  _markers.forEach(m=>_map.removeLayer(m));
  if(_routeLayer){ _map.removeLayer(_routeLayer); _routeLayer=null; }
  _markers=[];
  const [lat1,lng1]=CITY_COORDS[from], [lat2,lng2]=CITY_COORDS[to];
  _markers.push(L.marker([lat1,lng1]).addTo(_map).bindPopup('📍 '+from));
  _markers.push(L.marker([lat2,lng2]).addTo(_map).bindPopup('📍 '+to));
  let midLat,midLng;
  if(osrmCoords){
    const latlngs=osrmCoords.map(c=>[c[1],c[0]]);
    _routeLayer=L.polyline(latlngs,{color:'#5B8FF9',weight:5,opacity:0.9}).addTo(_map);
    const mid=osrmCoords[Math.floor(osrmCoords.length/2)];
    midLat=mid[1]; midLng=mid[0];
    _map.fitBounds(latlngs,{padding:[60,60]});
  } else {
    _routeLayer=L.polyline([[lat1,lng1],[lat2,lng2]],{color:'#5B8FF9',weight:3,opacity:0.8,dashArray:'8,12'}).addTo(_map);
    midLat=(lat1+lat2)/2; midLng=(lng1+lng2)/2;
    _map.fitBounds([[lat1,lng1],[lat2,lng2]],{padding:[60,60]});
  }
  if(mode){
    const emoji={plane:'✈️',gaotie:'🚄',train:'🚂',car:'🚗',bus:'🚌'}[mode];
    if(emoji){
      const icon=L.divIcon({className:'cost-mode-icon',html:`<span class="mode-emoji">${emoji}</span>`,iconSize:[44,44],iconAnchor:[22,22]});
      _markers.push(L.marker([midLat,midLng],{icon}).addTo(_map));
    }
  }
  setTimeout(()=>_map.invalidateSize(),100);
}

function initCostCalc(){
  const from=document.getElementById('costFrom'), to=document.getElementById('costTo'), mode=document.getElementById('costMode');
  createCitySearch(from,{current:'北京',placeholder:'搜索出发城市',onPick:c=>updateMapPreview(c,to.value,null,mode.value)});
  createCitySearch(to,{current:'上海',placeholder:'搜索目的城市',onPick:c=>updateMapPreview(from.value,c,null,mode.value)});
  const onMode=()=>updateMapPreview(from.value,to.value,null,mode.value);
  mode.addEventListener('change',onMode);
  document.getElementById('costBtn').addEventListener('click', calcCost);
}

async function calcCost(){
  const from=document.getElementById('costFrom').value;
  const to=document.getElementById('costTo').value;
  const mode=document.getElementById('costMode').value;
  const people=Math.max(1,parseInt(document.getElementById('costPeople').value)||1);
  const days=Math.max(1,parseInt(document.getElementById('costDays').value)||1);
  const dateStr=document.getElementById('costDate').value;
  const result=document.getElementById('costResult');
  if(from===to){ result.innerHTML='<p class="cost-error">出发地和目的地相同，请重新选择</p>'; return; }
  if(!CITY_COORDS[from]||!CITY_COORDS[to]){ result.innerHTML='<p class="cost-error">请从下拉建议中选择有效城市</p>'; return; }

  result.innerHTML='<p class="cost-tip">⏳ 正在获取路线…</p>';
  updateMapPreview(from,to,null,mode);

  const [lat1,lng1]=CITY_COORDS[from], [lat2,lng2]=CITY_COORDS[to];
  const t=TRANSPORT[mode];
  let distance, hours, source;

  if(mode==='plane'){
    distance=Math.round(haversine(lat1,lng1,lat2,lng2)*1.1);
    hours=Math.round(distance/t.speed+t.extraTime);
    source='直线距离';
  } else {
    const osrm=await getOSRMDistance(from,to);
    if(osrm){
      distance=Math.round(osrm.distance/1000);
      hours=Math.round(osrm.duration/3600);
      source='OSRM实测路线';
      updateMapPreview(from,to,osrm.coords,mode);
    } else {
      distance=Math.round(haversine(lat1,lng1,lat2,lng2)*1.3);
      hours=Math.round(distance/t.speed+t.extraTime);
      source='直线距离估算';
    }
  }

  // 单程交通费/人 → 往返×人数 得交通基础值，再按档系数分档
  const baseTransport=Math.round(distance*t.costPerKm+t.baseCost);
  const nights=Math.max(0,days-1);
  const rooms=Math.ceil(people/2);

  const tiers=COST_TIERS.map(tier=>{
    const transport=Math.round(baseTransport*2*people*tier.tFactor);
    const hotel=nights*rooms*tier.hotel;
    const food=days*people*tier.food;
    const ticket=days*people*tier.ticket;
    return {...tier, transport, hotel, food, ticket, total:transport+hotel+food+ticket};
  });
  const mid=tiers[1];

  let html=`<div class="cost-card">
    <div class="cost-route">${from} → ${to}${dateStr?` · 📅 ${dateStr}`:''}</div>
    <div class="cost-distance">📏 约 ${distance} 公里 <span class="cost-source">（${source}）</span> · ⏱️ 约 ${hours} 小时</div>
    <div class="cost-breakdown">
      <h4 class="cost-bd-title">分项估算（${people}人 · ${days}天 · 往返）<span class="src-tag">模型估算</span></h4>
      <div class="cost-item"><span class="ci-label">🚉 交通</span><span class="ci-value">${t.name} · 约 ${mid.transport} 元</span><span class="cost-basis">${t.note}，往返×2×${people}人</span></div>
      <div class="cost-item"><span class="ci-label">🏨 住宿</span><span class="ci-value">约 ${mid.hotel} 元</span><span class="cost-basis">经济型酒店 350 元/晚/间，2人一间，住 ${nights} 晚</span></div>
      <div class="cost-item"><span class="ci-label">🍚 餐饮</span><span class="ci-value">约 ${mid.food} 元</span><span class="cost-basis">人均 100 元/天（早20+午30+晚50）×${days}天×${people}人</span></div>
      <div class="cost-item"><span class="ci-label">🎫 门票</span><span class="ci-value">约 ${mid.ticket} 元</span><span class="cost-basis">人均 180 元/天（含景区交通）×${days}天×${people}人</span></div>
    </div>
    <div class="cost-tiers">
      <div class="cost-tier cost-tier-low"><span class="ct-label">最低</span><span class="ct-value">💰 ${tiers[0].total} 元</span></div>
      <div class="cost-tier cost-tier-mid"><span class="ct-label">参考</span><span class="ct-value">💰 ${tiers[1].total} 元</span></div>
      <div class="cost-tier cost-tier-high"><span class="ct-label">宽松</span><span class="ct-value">💰 ${tiers[2].total} 元</span></div>
    </div>`;
  if(mode==='plane'&&distance<500) html+=`<p class="cost-tip">💡 短途建议选高铁，飞机可能无直飞</p>`;
  if(mode==='plane'&&distance>2000) html+=`<p class="cost-tip">💡 长途机票实际可能有折扣，建议查携程/飞猪比价</p>`;
  if(mode==='gaotie'&&distance>1500) html+=`<p class="cost-tip">💡 超长距离可能无直达高铁，需中转</p>`;
  if(mode==='car'&&distance>1000) html+=`<p class="cost-tip">💡 超长自驾建议中途休息，疲劳驾驶危险</p>`;
  if(dateStr){
    const m=parseInt(dateStr.slice(5,7)), d=parseInt(dateStr.slice(8,10));
    if(m===7||m===8) html+=`<p class="cost-tip">💡 暑期旺季，机票/酒店可能上浮，建议提前预订</p>`;
    if(m===10&&d<=7) html+=`<p class="cost-tip">💡 国庆黄金周，价格普遍上浮 30-50%，务必提前订</p>`;
    if(m===1&&d>=28||m===2&&d<=10) html+=`<p class="cost-tip">💡 春节假期，交通/住宿价格高位，尽量避开</p>`;
  }
  html+=`<p class="cost-disclaimer">以上为估算，实际价格以预订时为准</p></div>`;
  result.innerHTML=html;
}

initCostCalc();