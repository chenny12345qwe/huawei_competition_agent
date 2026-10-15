const BAIDU_AK = '5PDLRUD4exDVKbSuwdzRRdsX4GywtPks';

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
  "喀什":[39.4704,75.9898]
};

// shortcut: 百度地图JS API不可用时降级为直线距离×1.3
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

let _bmap=null;
function waitBMap(t=5000){
  return new Promise(r=>{
    if(window.BMap) return r(true);
    const s=Date.now();
    const c=setInterval(()=>{ if(window.BMap){clearInterval(c);r(true);} else if(Date.now()-s>t){clearInterval(c);r(false);} },100);
  });
}

function getBaiduDistance(from,to){
  return Promise.race([
    new Promise(r=>{
      try{
        if(!_bmap) _bmap=new BMap.Map('baiduMap');
        const [lat1,lng1]=CITY_COORDS[from], [lat2,lng2]=CITY_COORDS[to];
        const s=new BMap.DrivingRoute(_bmap,{renderOptions:{autoViewport:false}});
        s.setSearchCompleteCallback(function(){
          if(s.getStatus()===BMAP_STATUS_SUCCESS){
            const p=s.getResults().getPlan(0);
            r({distance:p.getDistance(false),duration:p.getDuration(false)});
          } else r(null);
        });
        s.search(new BMap.Point(lng1,lat1),new BMap.Point(lng2,lat2));
      }catch(e){r(null);}
    }),
    new Promise(r=>setTimeout(()=>r(null),8000))
  ]);
}

function initCostCalc(){
  const from=document.getElementById('costFrom'), to=document.getElementById('costTo');
  Object.keys(CITY_COORDS).sort().forEach(c=>{
    from.appendChild(new Option(c,c));
    to.appendChild(new Option(c,c));
  });
  to.value='上海';
  document.getElementById('costBtn').addEventListener('click', calcCost);
}

async function calcCost(){
  const from=document.getElementById('costFrom').value;
  const to=document.getElementById('costTo').value;
  const mode=document.getElementById('costMode').value;
  const result=document.getElementById('costResult');
  if(from===to){ result.innerHTML='<p class="cost-error">出发地和目的地相同，请重新选择</p>'; return; }

  result.innerHTML='<p class="cost-tip">⏳ 正在获取路线…</p>';

  const [lat1,lng1]=CITY_COORDS[from], [lat2,lng2]=CITY_COORDS[to];
  const t=TRANSPORT[mode];
  let distance, hours, source;

  if(mode==='plane'){
    distance=Math.round(haversine(lat1,lng1,lat2,lng2)*1.1);
    hours=Math.round(distance/t.speed+t.extraTime);
    source='直线距离';
  } else {
    const ok=await waitBMap();
    let bd=null;
    if(ok) bd=await getBaiduDistance(from,to);
    if(bd){
      distance=Math.round(bd.distance/1000);
      hours=Math.round(bd.duration/3600);
      source='百度地图实测';
    } else {
      distance=Math.round(haversine(lat1,lng1,lat2,lng2)*1.3);
      hours=Math.round(distance/t.speed+t.extraTime);
      source='直线距离估算';
    }
  }

  const cost=Math.round(distance*t.costPerKm+t.baseCost);
  let html=`<div class="cost-card">
    <div class="cost-route">${from} → ${to}</div>
    <div class="cost-distance">📏 约 ${distance} 公里 <span class="cost-source">（${source}）</span></div>
    <div class="cost-detail">
      <div class="cost-item"><span class="ci-label">出行方式</span><span class="ci-value">${t.name}（${t.note}）</span></div>
      <div class="cost-item"><span class="ci-label">预估花费</span><span class="ci-value cost-price">💰 约 ${cost} 元/人</span></div>
      <div class="cost-item"><span class="ci-label">预估耗时</span><span class="ci-value">⏱️ 约 ${hours} 小时</span></div>
    </div>`;
  if(mode==='plane'&&distance<500) html+=`<p class="cost-tip">💡 短途建议选高铁，飞机可能无直飞</p>`;
  if(mode==='plane'&&distance>2000) html+=`<p class="cost-tip">💡 长途机票实际可能有折扣，建议查携程/飞猪比价</p>`;
  if(mode==='gaotie'&&distance>1500) html+=`<p class="cost-tip">💡 超长距离可能无直达高铁，需中转</p>`;
  if(mode==='car'&&distance>1000) html+=`<p class="cost-tip">💡 超长自驾建议中途休息，疲劳驾驶危险</p>`;
  if(source.includes('估算')) html+=`<p class="cost-tip">⚠️ 百度地图未可用，距离为估算值。请在百度地图控制台启用 JS API 并配置域名白名单</p>`;
  html+=`<p class="cost-disclaimer">* 花费为基于距离的估算，实际受季节、班次、油价等影响，仅供参考</p></div>`;
  result.innerHTML=html;
}

initCostCalc();