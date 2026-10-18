function initPhotoWall(){
  document.getElementById('photoUpload').addEventListener('change',handleUpload);
  document.getElementById('photoCamera').addEventListener('change',handleUpload);
  const camWrap=document.getElementById('camWrap');
  const camTip=document.getElementById('camTip');
  if(/Mobile|Android|iPhone/i.test(navigator.userAgent)) camWrap.classList.remove('hidden');
  else camTip.classList.remove('hidden');
  renderPhotos();
}
async function handleUpload(e){
  const f=e.target.files[0];if(!f)return;
  const b64=await compressImage(f);
  saveLocal(b64);
  e.target.value='';renderPhotos();
}
function compressImage(f){
  return new Promise(r=>{
    const fr=new FileReader();
    fr.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');const s=Math.min(1,800/img.width);c.width=img.width*s;c.height=img.height*s;c.getContext('2d').drawImage(img,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',0.7).split(',')[1]);};img.src=e.target.result;};
    fr.readAsDataURL(f);
  });
}
function saveLocal(b64){
  const p=JSON.parse(localStorage.getItem('photos')||'[]');
  p.push({src:'data:image/jpeg;base64,'+b64,t:Date.now()});
  localStorage.setItem('photos',JSON.stringify(p));
}
function renderPhotos(){
  const wall=document.getElementById('photoGrid');
  const photos=JSON.parse(localStorage.getItem('photos')||'[]');
  wall.innerHTML=photos.length?photos.map(p=>`<div class="photo-item"><img src="${p.src}" loading="lazy"></div>`).join(''):'<p class="empty-tip">还没有照片，快来上传第一张吧 📷</p>';
}
initPhotoWall();