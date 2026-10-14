const tripApp = document.getElementById('tripApp');
const tabs = document.getElementById('cityTabs');
let currentCity = '';

tabs.addEventListener('click', e=>{
  const t = e.target.closest('[data-city]'); if(!t) return;
  selectCity(t.dataset.city);
});

function renderTabs(){
  tabs.innerHTML = TRIP_DATA.cities.map(c =>
    `<button class="city-tab ${c.city===currentCity?'active':''}" data-city="${c.city}">${c.city}</button>`
  ).join('');
}

function selectCity(city){
  currentCity = city;
  renderTabs();
  const data = TRIP_DATA.cities.find(c => c.city === city);
  if(!data) return;
  let html = `<h2>${city} · 共 ${data.trips.length} 条行程</h2><div class="trip-grid">`;
  data.trips.forEach(t => {
    html += `<div class="trip-card">
      <div class="trip-info">
        <div class="trip-day">Day ${t.day}</div>
        <div class="trip-spot">${t.spot}</div>
        <div class="trip-intro">${t.intro}</div>
      </div>
    </div>`;
  });
  tripApp.innerHTML = html + `</div>`;
  window.scrollTo(0, 0);
}

selectCity(TRIP_DATA.cities[0].city);