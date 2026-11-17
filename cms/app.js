(() => {
'use strict';
const root=document.getElementById('app'),toastEl=document.getElementById('toast');
const originSite='https://armtournest.com';
const NAV=[
  {key:'dashboard',title:'Overview',icon:'◫',hint:'Workspace overview'},
  {key:'tours',title:'Tours',icon:'⛰',hint:'Itineraries, prices and photos'},
  {key:'cars',title:'Rental cars',icon:'🚙',hint:'Vehicles, rates and galleries'},
  {key:'transfers',title:'Transfers',icon:'⇄',hint:'Airport and intercity trips'},
  {key:'hotels',title:'Hotels & stays',icon:'⌂',hint:'Accommodation and stays'},
  {key:'pages',title:'Website pages',icon:'▤',hint:'Homepage and landing pages'},
  {key:'site',title:'Site settings',icon:'⚙',hint:'Contacts, social and branding'}
];
const TITLES={id:'URL slug',slug:'Public URL slug',name:'Name',headline:'Main headline',summary:'Short description',description:'Description',status:'Publication status',featured:'Featured on homepage',category:'Category',image:'Cover photograph',images:'Vehicle photographs',gallery:'Photo gallery',heroImage:'Header image',pricing:'Pricing',dailyRate:'Daily rental rate (AMD)',minimumDays:'Minimum rental days',securityDeposit:'Security deposit',from:'Starting price',unit:'Price for',seats:'Passenger seats',bags:'Luggage capacity',doors:'Doors',durationHours:'Duration (hours)',departureCity:'Departure city',itinerary:'Tour stops',included:'Included',excluded:'Excluded',pickupLocations:'Pickup locations',seo:'SEO / search',brand:'Brand identity',contacts:'Contacts and social media',settings:'Website settings',home:'Homepage',services:'Services',address:'Address',copy:'Page translations',why:'Why choose us',navigation:'Navigation links',isIndicative:'Price is indicative',imageUsage:'Photography note',meta:'Metadata'};
const LABELS={en:'English',ru:'Русский',hy:'Հայերեն'};
const SELECTIONS={status:['draft','published','archived'],category:{cars:['sedan','suv','economy','premium','compact','minivan','van','luxury','4x4'],tours:['private','group','outgoing']},currency:['AMD','USD','EUR'],transmission:['automatic','manual'],drive:['AWD','4WD','FWD','RWD','2WD'],fuel:['petrol','diesel','hybrid','electric'],unit:['person','group'],defaultLanguage:['en','ru','hy'],bookingMode:['enquiry']};
const S={auth:null,area:'dashboard',rows:[],cache:{},query:'',editor:null,id:null,sha:null,tab:'main',lang:'en',busy:false,dirty:false,editing:false,loginError:'',loginBusy:false};
const el=(q)=>document.querySelector(q);
const h=(s)=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]||'&#39;'));
const title=(key)=>TITLES[key] || String(key).replace(/([A-Z])/g,' $1').replace(/^./,v=>v.toUpperCase());
const req=async(url,opts)=>{const r=await fetch(url,{credentials:'same-origin',headers:{'Accept':'application/json',...(opts?.body?{'Content-Type':'application/json'}:{})},...opts});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Request failed');return j};
const notice=(message,error=false)=>{toastEl.textContent=message;toastEl.className='show'+(error?' error':'');clearTimeout(notice.timer);notice.timer=setTimeout(()=>toastEl.className='',3500)};
const pathAttr=(path)=>encodeURIComponent(JSON.stringify(path));
const readPath=(input)=>JSON.parse(decodeURIComponent(input));
const at=(obj,path)=>path.reduce((a,k)=>a?.[k],obj);
function assign(obj,path,value){let v=obj;for(let i=0;i<path.length-1;i++){if(v[path[i]]==null)v[path[i]]=typeof path[i+1]==='number'?[]:{};v=v[path[i]];}v[path[path.length-1]]=value;}
const imageUrl=(p)=>!p?'':p.startsWith('/')?originSite+p:p.startsWith('media/')?originSite+'/'+p:p;
function image(p,alt){return p?'<img src="'+h(imageUrl(p))+'" loading="lazy" alt="'+h(alt||'Preview')+'">':'<span aria-hidden="true">▧</span>'}
function login(){
 return '<main class="login"><section class="login-card"><div class="logo-mark">A</div><div class="eyebrow">ARMTOURNEST · CONTENT STUDIO</div><h1>Welcome back</h1><p>Edit tours, cars, prices, photos and translations from your own dashboard.</p>'+
 (S.auth?.configured?'<form id="cms-login-form">'+
 '<label class="login-field">Username<input name="username" type="text" autocomplete="username" placeholder="Editor username" maxlength="128" required></label>'+
 '<label class="login-field">Password<input name="password" type="password" autocomplete="current-password" placeholder="Your password" maxlength="256" required></label>'+
 (S.loginError?'<div class="login-error" role="alert">'+h(S.loginError)+'</div>':'')+
 '<button type="submit" class="btn primary" '+(S.loginBusy?'disabled':'')+'>'+(S.loginBusy?'Signing in…':'Sign in to dashboard →')+'</button></form>':
 '<div class="notice"><b>Staff login activation pending.</b><div style="margin-top:7px">Ask the website owner to activate your editor account. Only your editor username and password are needed.</div></div>')+
 '<a class="btn" href="'+originSite+'" target="_blank" rel="noopener">View public website ↗</a>'+
 '<p class="code-note">Private ArmTourNest workspace</p></section></main>';
}
function navBar(){return '<aside class="sidebar" id="sidebar"><div class="logo"><div class="logo-mark">A</div><div><div class="logo-name">ArmTourNest</div><div class="logo-sub">Content Studio</div></div><button type="button" class="menu-toggle" data-action="menu" aria-label="Toggle navigation">☰</button></div><div class="nav-main"><div class="nav-label">WORKSPACE</div>'+NAV.map(n=>'<button class="nav-btn '+(S.area===n.key?'active':'')+'" data-area="'+n.key+'"><span class="glyph">'+n.icon+'</span>'+h(n.title)+(S.cache[n.key]?'<span class="count">'+S.cache[n.key].length+'</span>':'')+'</button>').join('')+'</div><div class="sidebar-footer"><a href="'+originSite+'" target="_blank" rel="noopener">↗ View live website</a><button class="nav-btn" data-action="logout"><span class="glyph">⇥</span>Log out</button></div></aside>';}
function shell(content,page){root.innerHTML='<div class="shell">'+navBar()+'<div class="layout"><header class="topbar"><div><div class="crumb">ArmTourNest / Admin</div><strong>'+h(page||'Content Studio')+'</strong></div><div class="top-actions"><span class="user-pill">● '+h(S.auth?.user||'Admin')+'</span><a class="btn small" href="'+originSite+'" target="_blank" rel="noopener">↗ Live site</a></div></header><main class="workspace">'+content+'<p class="footer-info">Secure staff workspace · Updates publish automatically · ArmTourNest © 2026</p></main></div></div>';}
function dashboard(){const cards=NAV.filter(n=>['tours','cars','transfers','hotels'].includes(n.key));return '<div class="page-head"><div><div class="eyebrow">WELCOME BACK</div><h1>Manage your tourism business</h1><p>Make changes without touching website code. Save an entry to publish the website updates.</p></div><button class="btn primary" data-area="cars">Manage rental cars →</button></div><div class="stat-grid">'+cards.map(n=>'<button class="stat" data-area="'+n.key+'" style="text-align:left;cursor:pointer"><div class="symbol">'+n.icon+'</div><strong>'+(S.cache[n.key]?.length??'—')+'</strong><span>'+h(n.title)+'</span></button>').join('')+'</div><div class="panel"><h2>Quick editing</h2><p>Pick a section to change content. Changes publish automatically when saved.</p><div class="quick-grid">'+NAV.filter(n=>n.key!=='dashboard').map(n=>'<button class="quick-card" data-area="'+n.key+'" style="text-align:left;cursor:pointer"><span class="glyph">'+n.icon+'</span><b>'+h(n.title)+' ↗</b><span>'+h(n.hint)+'</span></button>').join('')+'</div></div><div class="panel"><h2>Publishing workflow</h2><p>Choose content → Edit → Preview → Save → Publish</p><div class="publish-note">Your original public site remains separate and continues to operate even if the admin editor is unavailable.</div></div>';}
function card(row,type){const details=[row.id,row.status].filter(Boolean).join(' · ');let money=typeof row.price==='number'?row.price.toLocaleString('en-US')+' AMD':'';return '<article class="item"><div class="item-thumb">'+image(row.image,row.title)+'<span class="status '+h(row.status)+'">'+h(row.status||'page')+'</span></div><div class="item-body"><h3>'+h(row.title)+'</h3><div class="sub">'+h(details)+'</div><div class="item-bottom"><strong>'+h(money)+'</strong><button class="btn small" data-open="'+h(row.id)+'">Edit →</button></div></div></article>';}
function list(){const info=NAV.find(n=>n.key===S.area)||NAV[0];let rows=S.rows.filter(x=>(x.title+' '+x.id).toLowerCase().includes(S.query.toLowerCase()));return '<div class="page-head"><div><div class="eyebrow">CONTENT LIBRARY</div><h1>'+h(info.title)+'</h1><p>'+h(info.hint)+'. Search and edit your existing content.</p></div>'+(S.area==='site'||S.area==='pages'?'':'<button class="btn primary" data-new="1">＋ Add '+h(S.area==='cars'?'vehicle':'entry')+'</button>')+'</div><div class="toolbar"><div class="search-wrap"><input class="search" id="filter-search" type="search" placeholder="Search by title or URL…" value="'+h(S.query)+'"></div><strong>'+rows.length+' items</strong></div>'+(rows.length?'<div class="item-grid">'+rows.map(x=>card(x,S.area)).join('')+'</div>':'<div class="empty">No results. Try another search or create a new entry.</div>');}
const isLocalized=(x)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).some(k=>['en','ru','hy'].includes(k))&&Object.keys(x).every(k=>['en','ru','hy'].includes(k));
function editorGroup(key){if(['image','images','gallery','heroImage','background','logo'].includes(key))return 'images';if(['pricing','price'].includes(key))return 'pricing';if(key==='seo')return 'seo';if(['id','slug','name','status','featured','category','headline','summary','description','title','eyebrow','subtitle'].includes(key))return 'main';return 'details';}
function optionList(key){let val=SELECTIONS[key];if(key==='category')val=val?.[S.area];return Array.isArray(val)?val:null;}
function field(value,key,path,depth=0) {
 const attr='data-path="'+pathAttr(path)+'"';
 if(depth>8)return '<p class="code-note">Nested field too deep for editor</p>';
 if(isLocalized(value)) return '<div class="field"><label>'+h(title(key))+'</label><div class="langbox"><div class="langtabs">'+Object.entries(LABELS).map(([k,label])=>'<button type="button" class="langbtn '+(S.lang===k?'active':'')+'" data-language="'+k+'">'+h(label)+'</button>').join('')+'</div>'+field(value[S.lang]??'',S.lang,[...path,S.lang],depth+1)+'</div></div>';
 if(Array.isArray(value))return '<fieldset class="group"><legend>'+h(title(key))+' ('+value.length+')</legend>'+value.map((item,index)=>'<div class="listrow"><div class="listhead"><b>Item '+(index+1)+'</b><button class="btn small danger" data-remove="'+pathAttr([...path,index])+'">Remove</button></div>'+field(item,String(index),[...path,index],depth+1)+'</div>').join('')+'<button class="btn small" data-add="'+pathAttr(path)+'">＋ Add item</button></fieldset>';
 if(value&&typeof value==='object')return '<fieldset class="group"><legend>'+h(title(key))+'</legend>'+Object.entries(value).map(([k,v])=>field(v,k,[...path,k],depth+1)).join('')+'</fieldset>';
 if(typeof value==='boolean')return '<label class="field-check"><input type="checkbox" '+attr+' '+(value?'checked':'')+'>'+h(title(key))+'</label>';
 const isImage=['image','heroImage','logo','background'].includes(key)||((key==='images'||key==='gallery')&&typeof value==='string')||(typeof value==='string'&&path.some(p=>p==='images'||p==='gallery'));
 const label=LABELS[key]||title(key);
 const sel=optionList(key);
 if(sel)return '<div class="field"><label>'+h(label)+'</label><select class="control" '+attr+'>'+sel.map(v=>'<option value="'+h(v)+'" '+(String(value)===v?'selected':'')+'>'+h(title(v))+'</option>').join('')+'</select></div>';
 if(typeof value==='number')return '<div class="field"><label>'+h(label)+'</label><input class="control" '+attr+' type="number" min="0" step="any" value="'+h(value)+'"></div>';
 const multiline=typeof value==='string'&&(value.length>170||['summary','description','body','imageUsage','message'].includes(key));
 let control=multiline?'<textarea class="control" rows="4" '+attr+'>'+h(value)+'</textarea>':'<input class="control" '+attr+' type="text" value="'+h(value??'')+'" '+(key==='id'&&S.sha?'readonly':'')+'>';
 if(isImage)control+='<div class="image-preview">'+image(String(value||''),label)+'</div><div class="upload-row"><label class="btn small">Upload photo <input type="file" accept="image/jpeg,image/png,image/webp" data-upload="'+pathAttr(path)+'" hidden></label><small>Auto-resized to 1600px; maximum 2 MB.</small></div>';
 return '<div class="field"><label>'+h(label)+'</label>'+control+'</div>';
}
function liveHref(){if(S.area==='cars'||S.area==='tours')return originSite+'/#/'+S.area+'/'+encodeURIComponent(S.id||S.editor?.id||'');if(S.area==='pages')return originSite+'/#/'+(S.id==='home'?'':S.id);return originSite;}
function form(){const tabs=[['main','Main content'],['images','Photos'],['pricing','Prices'],['details','Details'],['seo','SEO']].filter(([id])=>Object.keys(S.editor).some(k=>editorGroup(k)===id));if(!tabs.find(t=>t[0]===S.tab))S.tab=tabs[0]?.[0]||'details';const titleText=(typeof S.editor.name==='object'&&S.editor.name.en)||S.id||S.editor.id||'New entry';let contents=Object.entries(S.editor).filter(([k])=>editorGroup(k)===S.tab).map(([k,v])=>field(v,k,[k])).join('');return '<div class="editor-top"><button class="btn" data-back="1">← '+h(NAV.find(n=>n.key===S.area)?.title||'Items')+'</button><div class="top-actions"><a class="btn" target="_blank" rel="noopener" href="'+h(liveHref())+'">↗ Preview page</a><button class="btn primary" id="save-entry" data-save="1">'+(S.busy?'Saving…':'Save changes')+'</button></div></div><div class="editor-head"><div><div class="eyebrow">'+h(S.area.toUpperCase())+' EDITOR</div><h1>'+h(titleText)+'</h1><p>'+h(S.sha?'Editing existing content':'Create a new entry')+' · '+(S.dirty?'Unsaved changes':'All changes saved')+'</p></div></div><div class="editor-grid"><div class="editor-main"><div class="tabs">'+tabs.map(([id,label])=>'<button class="tab '+(S.tab===id?'active':'')+'" data-tab="'+id+'">'+label+'</button>').join('')+'</div><div class="panel">'+(contents||'<div class="empty">No fields in this section.</div>')+'</div></div><aside class="editor-side"><div class="panel"><div class="savebox"><strong>Publishing</strong><p>Save your changes here. The public website will update automatically after publishing.</p><div class="publish-note">✓ Only you can sign in and make changes.</div><button class="btn primary" data-save="1" '+(S.busy?'disabled':'')+'>Save & publish</button><a class="site-link" target="_blank" rel="noopener" href="'+h(liveHref())+'">View live content ↗</a></div></div><div class="panel"><strong>Image guidelines</strong><p class="code-note">Landscape cover photos work best. Photos are compressed before upload; the website build also validates and optimizes them.</p></div></aside></div>';}
function newEntry(type){
 const local=()=>({en:'',ru:'',hy:''});
 const shared={id:'',status:'draft',name:local(),summary:local(),image:''};
 if(type==='cars')return {id:'',slug:'',status:'draft',name:local(),category:'sedan',transmission:'automatic',drive:'FWD',seats:5,bags:2,fuel:'petrol',doors:4,images:[],pricing:{currency:'AMD',dailyRate:0,minimumDays:1,securityDeposit:0,isIndicative:true},pickupLocations:['yerevan'],features:[],description:local(),seo:{title:local(),description:local()}};
 if(type==='tours')return {...shared,featured:false,category:'private',destination:'yerevan',gallery:[],itinerary:[],pricing:{currency:'AMD',from:0,unit:'person',isIndicative:true},durationHours:4,departureCity:'Yerevan',languages:['en'],included:[],excluded:[],seo:{title:local(),description:local()}};
 if(type==='transfers')return {...shared,price:0};
 if(type==='hotels')return {...shared,price:0};
 return null;
}
async function load(type) {
 S.area=type;S.query='';S.editor=null;S.id=null;S.sha=null;S.dirty=false;
 if(type==='dashboard'){shell(dashboard(),'Overview');return;}
 shell('<div class="loading-panel"><div class="spinner" style="margin:0 auto 12px"></div>Loading '+h(type)+'…</div>',title(type));
 try {
   const json=await req('/api/data?type='+encodeURIComponent(type));
   S.rows=json.rows||[];S.cache[type]=S.rows;render();
 }catch(e){shell('<div class="message"><h2>Could not load content</h2><p>'+h(e.message)+'</p><button class="btn" data-area="'+h(type)+'">Try again</button></div>',title(type));notice(e.message,true);}
}
function render(){if(!S.auth?.authenticated){root.innerHTML=login();return;}shell(S.editor?form():(S.area==='dashboard'?dashboard():list()),NAV.find(n=>n.key===S.area)?.title);}
async function openEntry(id){
 S.id=id;S.editor=null;S.sha=null;S.dirty=false;S.tab='main';shell('<div class="loading-panel">Opening editor…</div>','Editing');
 try {
  const json=await req('/api/data?type='+S.area+'&id='+encodeURIComponent(id));
  S.editor=json.data;S.sha=json.sha;render();
 }catch(e){notice(e.message,true);await load(S.area);}
}
async function submit(){
 if(S.busy||!S.editor)return;
 const id=S.area==='site'?'site':String(S.editor.id||S.id||'').trim();
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)){notice('Enter a valid URL slug: lowercase letters, numbers and hyphens.',true);S.tab='main';render();return;}
 if(S.sha&&id!==(S.area==='site'?'site':S.id)){notice('URL slugs of existing entries cannot be changed here.',true);return;}
 S.busy=true;render();
 try{
  const data=await req('/api/data',{method:'POST',body:JSON.stringify({action:'save',type:S.area,id,sha:S.sha,entry:S.editor})});
  S.sha=data.sha;S.id=id;S.dirty=false;notice('Saved. Website publishing started.');render();
 }catch(e){notice(e.message+(e.message.includes('409')?' Reload this entry before editing again.':''),true);}
 finally{S.busy=false;render();}
}
function setValue(path,value){assign(S.editor,path,value);S.dirty=true;const note=el('.editor-head p');if(note)note.textContent='Unsaved changes';}
async function uploadImage(input){
 const path=readPath(input.dataset.upload);let file=input.files?.[0];if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)){notice('Only JPG, PNG, and WebP are supported.',true);return;}
 if(file.size>8*1024*1024){notice('Source image must be smaller than 8 MiB.',true);return;}
 try {
   notice('Optimizing and uploading photograph…');
   const bitmap=await createImageBitmap(file);
   if(bitmap.width>8192||bitmap.height>8192||bitmap.width*bitmap.height>36e6)throw new Error('Image exceeds 8192 pixels or 36 megapixels');
   const scale=Math.min(1,1600/bitmap.width,1100/bitmap.height);
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const cx=canvas.getContext('2d');cx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
   let blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.78));
   if(!blob||blob.size>2e6)blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.54));
   if(!blob||blob.size>2e6)throw new Error('Unable to compress image below 2 MiB');
   const buffer=await blob.arrayBuffer();const bytes=new Uint8Array(buffer);
   let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
   const out=await req('/api/data',{method:'POST',body:JSON.stringify({action:'upload',mime:'image/webp',base64:btoa(binary),type:S.area})});
   setValue(path,out.path);render();notice('Photo uploaded to media library. Save your entry to publish it.');
 }catch(e){notice('Upload failed: '+e.message,true);}
}
function arrayAdd(path){
 const a=at(S.editor,path);if(!Array.isArray(a))return;
 const key=path.at(-1);let blank='';
 if(['itinerary'].includes(key))blank={order:a.length+1,title:{en:'',ru:'',hy:''}};
 else if(a.length&&typeof a[0]==='number')blank=0;
 else if(a.length&&a[0]&&typeof a[0]==='object')blank=Object.fromEntries(Object.keys(a[0]).map(k=>[k,typeof a[0][k]==='object'?{en:'',ru:'',hy:''}:'']));
 a.push(blank);S.dirty=true;render();
}
document.addEventListener('submit',async e=>{
 if(e.target?.id!=='cms-login-form')return;
 e.preventDefault();if(S.loginBusy)return;
 const form=e.target,username=String(form.elements.username?.value||'').trim(),password=String(form.elements.password?.value||'');
 if(!username||!password)return;
 S.loginBusy=true;S.loginError='';
 const btn=form.querySelector('button[type="submit"]');if(btn){btn.disabled=true;btn.textContent='Signing in…';}
 try{
  const r=await req('/api/auth?action=login',{method:'POST',body:JSON.stringify({username,password})});
  S.auth={configured:true,authenticated:true,user:r.user};S.loginBusy=false;S.loginError='';
  await load('dashboard');
 }catch(err){S.loginError=err.message||'Sign in failed';S.loginBusy=false;render();}
});
document.addEventListener('click',async e=>{
 let node=e.target.closest('[data-area]');if(node){await load(node.dataset.area);return;}
 node=e.target.closest('[data-action]');if(node){if(node.dataset.action==='menu'){el('#sidebar')?.classList.toggle('open');return;}if(node.dataset.action==='logout'){try{await req('/api/auth?action=logout',{method:'POST',body:'{}'})}finally{location.href='/';}return;}}
 node=e.target.closest('[data-open]');if(node){await openEntry(node.dataset.open);return;}
 node=e.target.closest('[data-new]');if(node){S.editor=newEntry(S.area);S.id=null;S.sha=null;S.tab='main';S.dirty=true;render();return;}
 node=e.target.closest('[data-back]');if(node){if(S.dirty&&!confirm('Leave without saving?'))return;S.editor=null;S.sha=null;S.id=null;S.dirty=false;render();return;}
 node=e.target.closest('[data-save]');if(node){await submit();return;}
 node=e.target.closest('[data-tab]');if(node){S.tab=node.dataset.tab;render();return;}
 node=e.target.closest('[data-language]');if(node){S.lang=node.dataset.language;render();return;}
 node=e.target.closest('[data-add]');if(node){arrayAdd(readPath(node.dataset.add));return;}
 node=e.target.closest('[data-remove]');if(node){const p=readPath(node.dataset.remove);const a=at(S.editor,p.slice(0,-1));if(Array.isArray(a)){a.splice(p.at(-1),1);S.dirty=true;render();}return;}
});
document.addEventListener('input',e=>{
 if(e.target.id==='filter-search'){S.query=e.target.value;let position=e.target.selectionStart;const field=e.target;const cards=el('.item-grid');const section=el('.empty');if(cards||section){const all=S.rows.filter(x=>(x.title+' '+x.id).toLowerCase().includes(S.query.toLowerCase()));if(cards){cards.innerHTML=all.map(x=>card(x,S.area)).join('');cards.style.display=all.length?'grid':'none';}if(section)section.textContent=all.length?'':'No matching entries';}return;}
 const p=e.target.dataset.path;if(!p||!S.editor)return;
 const path=readPath(p);let val=e.target.type==='checkbox'?e.target.checked:e.target.type==='number'?(e.target.value===''?0:Number(e.target.value)):e.target.value;
 setValue(path,val);
});
document.addEventListener('change',e=>{if(e.target.dataset.upload)uploadImage(e.target);else if(e.target.dataset.path&&S.editor){const p=readPath(e.target.dataset.path);let val=e.target.type==='checkbox'?e.target.checked:e.target.type==='number'?Number(e.target.value):e.target.value;setValue(p,val);}});
window.addEventListener('beforeunload',e=>{if(S.dirty){e.preventDefault();e.returnValue='';}});
async function boot(){try{S.auth=await req('/api/auth?action=session');}catch(e){S.auth={configured:false,authenticated:false};}render();}
boot();
})();