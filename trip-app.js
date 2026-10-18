const tripApp = document.getElementById('tripApp');
let currentCity = '';

function selectCity(city){
  const data = TRIP_DATA.cities.find(c => c.city === city);
  if(!data) return;
  currentCity = city;
  let html = `<h2>${city} · 共 ${data.trips.length} 条行程</h2><div class="trip-grid">`;
  data.trips.forEach(t => {
    html += `<div class="trip-card">
      <div class="trip-info">
        <div class="trip-day">Day ${t.day}</div>
        <div class="trip-spot">${t.spot}</div>
        <div class="trip-intro">${t.intro}</div>
        <span class="src-tag">平台参考价</span>
      </div>
    </div>`;
  });
  tripApp.innerHTML = html + `</div>`;
  window.scrollTo(0, 0);
}

createCitySearch(document.getElementById('tripCitySearch'), {
  list: TRIP_DATA.cities.map(c=>c.city),
  current: TRIP_DATA.cities[0].city,
  placeholder: '搜索城市，如 北京、三亚',
  onPick: selectCity
});
selectCity(TRIP_DATA.cities[0].city);