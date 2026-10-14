const REPO='chenny12345qwe/huawei_competition_agent',BRANCH='main',DIR='uploads';
function initPhotoWall(){
  document.getElementById('photoUpload').addEventListener('change',handleUpload);
  document.getElementById('photoCamera').addEventListener('change',handleUpload);
  const camWrap=document.getElementById('camWrap');
  const camTip=document.getElementById('camTip');
  if(/Mobile|Android|iPhone/i.test(navigator.userAgent)) camWrap.classList.remove('hidden');
  else camTip.classList.remove('hidden');
  document.getElementById('photoToken').value=localStorage.getItem('gh_token')||'';
  renderPhotos();
}
async function handleUpload(e){
  const f=e.target.files[0];if(!f)return;
  const vis=document.querySelector('input[name="vis"]:checked').value;
  const b64=await compressImage(f);
  if(vis==='local'){saveLocal(b64);}else{await uploadGitHub(b64);}
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
async function uploadGitHub(b64){
  const t=document.getElementById('photoToken').value.trim();
  if(!t){alert('请先输入 GitHub Token');return;}
  localStorage.setItem('gh_token',t);
  const fn=`photo_${Date.now()}.jpg`;
  const r=await fetch(`https://api.github.com/repos/${REPO}/contents/${DIR}/${fn}`,{method:'PUT',headers:{'Authorization':`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify({message:'上传旅友照片',content:b64,branch:BRANCH})});
  if(!r.ok){const e=await r.json().catch(()=>({}));alert('上传失败: '+(e.message||r.status));return;}
  alert('上传成功！');
}
async function renderPhotos(){
  const wall=document.getElementById('photoGrid');
  let photos=JSON.parse(localStorage.getItem('photos')||'[]');
  const t=localStorage.getItem('gh_token');
  if(t){
    try{
      const r=await fetch(`https://api.github.com/repos/${REPO}/contents/${DIR}?ref=${BRANCH}`,{headers:{'Authorization':`Bearer ${t}`}});
      if(r.ok){const fs=await r.json();fs.forEach(f=>{if(!photos.find(p=>p.src===f.download_url))photos.push({src:f.download_url,public:true});});}
    }catch(e){}
  }
  wall.innerHTML=photos.length?photos.map(p=>`<div class="photo-item"><img src="${p.src}" loading="lazy"></div>`).join(''):'<p class="empty-tip">还没有照片，快来上传第一张吧 📷</p>';
}
initPhotoWall();