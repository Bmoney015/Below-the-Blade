(()=>{'use strict';
const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={pending:'Awaiting Evidence',confirmed:'Confirmed Shoey',sidestep:'Successful Sidestep',abandoned:'Abandonment'};
const image=x=>x.image_path?.startsWith('shoey/')?x.image_path:x.image_path?btbSupabase.storage.from('shoey-photos').getPublicUrl(x.image_path).data.publicUrl:'';
let rows=[],chops=[],rosters=[];
async function refresh(){
 const grid=$('shoeyLiveGrid');if(!grid)return;
 try{
  const a=await btbSupabase.from('shoey_exhibits').select('*').order('week');
  if(a.error)throw new Error('shoey_exhibits: '+a.error.message);
  rows=a.data||[];
  if(!rows.length){grid.textContent='No Shoey exhibits have been added yet.';return;}
  render();
  const [b,c]=await Promise.all([
   btbSupabase.from('finalized_chops').select('week,owner_name,score').order('week'),
   btbSupabase.from('chopped_rosters').select('week,owner_name,player_name').order('week')
  ]);
  if(b.error)console.warn('Shoey score linkage:',b.error.message);
  if(c.error)console.warn('Shoey roster linkage:',c.error.message);
  chops=b.data||[];rosters=c.data||[];
  for(const chop of chops){const w=Number(chop.week);if(w>=1&&w<=17&&!rows.some(x=>Number(x.week)===w))rows.push({week:w,name:chop.owner_name,status:'pending',title:'Awaiting Evidence',description:'The blade has fallen. The evidence has not yet arrived.',image_path:'',video_url:''})}
  rows.sort((x,y)=>Number(x.week)-Number(y.week));render();
 }catch(e){console.error('Shoey exhibit load:',e);grid.textContent='Shoey exhibits could not load: '+(e?.message||String(e));}
}
function render(){const confirmed=rows.filter(x=>x.status==='confirmed').length,side=rows.filter(x=>x.status==='sidestep').length,abandoned=rows.filter(x=>x.status==='abandoned').length;
 $('shoeyMem').textContent=confirmed+' / '+rows.length;$('shoeySide').textContent=side;$('shoeyAbandon').textContent=abandoned;$('shoeySeasonCount').textContent=confirmed+' / 17';$('shoeyProgress').style.width=100*confirmed/17+'%';$('shoeyCollectionNote').textContent=`${rows.filter(x=>x.status==='pending').length} awaiting evidence · ${Math.max(0,17-rows.length)} eliminations remaining · Sidesteps do not count as completed shoeys.`;
 $('shoeyLiveGrid').innerHTML=rows.map(x=>`<article class="shoey-card ${image(x)?'':'shoey-pending-card'}"><button type="button" class="shoey-photo-btn" data-week="${Number(x.week)}" aria-label="Open Week ${Number(x.week)} exhibit">${image(x)?`<img src="${esc(image(x))}" alt="Week ${Number(x.week)} ${esc(x.name)} exhibit" loading="lazy">`:'<span>👟<br>Awaiting Evidence</span>'}<span class="shoey-week">WEEK ${Number(x.week)}</span></button><div class="shoey-card-body"><h3>${esc(x.name)}</h3><div class="shoey-epithet">${esc(x.title||'Awaiting Evidence')}</div><span class="shoey-status ${esc(x.status)}">${esc(labels[x.status]||labels.pending)}</span><p>${esc(x.description||'')}</p></div></article>`).join('');
 $('shoeyLiveGrid').querySelectorAll('[data-week]').forEach(b=>b.addEventListener('click',()=>open(Number(b.dataset.week))));}
function open(w){const x=rows.find(x=>Number(x.week)===w);if(!x)return;const chop=chops.find(c=>Number(c.week)===w),roster=rosters.filter(r=>Number(r.week)===w&&chop&&r.owner_name===chop.owner_name);$('shoeyNewWeek').textContent='2026 · WEEK '+w+' ELIMINATION EXHIBIT';$('shoeyNewName').textContent=x.name;$('shoeyNewTitle').textContent=x.title||'';$('shoeyNewDesc').textContent=x.description||'';$('shoeyNewStatus').textContent=labels[x.status]||labels.pending;$('shoeyNewStatus').className='shoey-status '+x.status;$('shoeyNewScore').textContent=chop&&chop.score!=null&&Number.isFinite(Number(chop.score))?Number(chop.score).toFixed(2):'Not linked';$('shoeyNewFinish').textContent=w===17?'2nd':(19-w)+(19-w===3?'rd':'th');$('shoeyNewRoster').innerHTML=roster.length?roster.map(r=>'<div>'+esc(r.player_name)+'</div>').join(''):'Roster not yet available for this elimination.';
 const video=x.video_url||'';$('shoeyNewVideo').innerHTML=/^https:\/\//i.test(video)?'<a class="shoey-video-link" target="_blank" rel="noopener noreferrer" href="'+esc(video)+'">▶ Watch Original Clip ↗</a>':'';const src=image(x);$('shoeyNewImage').src=src;$('shoeyNewImage').style.display=src?'block':'none';$('shoeyNewModal').hidden=false;document.body.style.overflow='hidden';}
function close(){if($('shoeyNewModal'))$('shoeyNewModal').hidden=true;document.body.style.overflow='';}
if($('shoeyLiveGrid')){$('shoeyNewClose').addEventListener('click',close);$('shoeyNewModal').addEventListener('click',e=>{if(e.target===$('shoeyNewModal'))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});refresh();document.querySelector('[data-page="shoey"]')?.addEventListener('click',refresh);}
})();