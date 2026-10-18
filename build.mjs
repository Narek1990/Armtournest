import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
const root=process.cwd();
const json=(path)=>JSON.parse(readFileSync(join(root,path),'utf8'));
const list=(folder)=>readdirSync(join(root,'content',folder)).filter(f=>f.endsWith('.json')).sort().map(f=>json('content/'+folder+'/'+f));
const published=records=>records.filter(x=>x.status==='published');
const pages=Object.fromEntries(readdirSync(join(root,'content/pages')).filter(f=>f.endsWith('.json')).map(f=>[f.slice(0,-5),json('content/pages/'+f)]));
const pageCopy={};
for(const page of Object.values(pages))for(const [key,val] of Object.entries(page.copy||{}))pageCopy[key]=val;
const site=json('content/site.json');site.home=pages.home;
const data={site,pages,pageCopy,tours:published(list('tours')),cars:published(list('cars')),services:{transfers:published(list('transfers')),hotels:published(list('hotels'))},translations:{en:json('content/i18n/en.json'),ru:json('content/i18n/ru.json'),hy:json('content/i18n/hy.json')}};
for(const category of ['tours','cars']){
 const ids=new Set();for(const entity of data[category]){
  if(!entity.id||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entity.id))throw Error(category+' invalid id: '+entity.id);
  if(ids.has(entity.id))throw Error(category+' duplicate id: '+entity.id);ids.add(entity.id);
  if(!entity.name?.en)throw Error(category+' missing English name: '+entity.id);
  const price=category==='tours'?entity.pricing?.from:entity.pricing?.dailyRate;
  if(!Number.isFinite(price)||price<0)throw Error(category+' invalid price: '+entity.id);
 }
}
mkdirSync(join(root,'dist'),{recursive:true});
mkdirSync(join(root,'dist/content'),{recursive:true});
writeFileSync(join(root,'dist/content/runtime.json'),JSON.stringify(data));
cpSync(join(root,'assets'),join(root,'dist/assets'),{recursive:true});
cpSync(join(root,'media'),join(root,'dist/media'),{recursive:true});
// Create single self-contained HTML for fast deploys and CDN cache consistency.
let html=readFileSync(join(root,'index.html'),'utf8');
const css=readFileSync(join(root,'styles.css'),'utf8');
const app=readFileSync(join(root,'app.js'),'utf8');
const svg=readFileSync(join(root,'assets/logo.svg'),'utf8');
if(site.brand.logo==='assets/logo.svg')site.brand.logo='data:image/svg+xml,'+encodeURIComponent(svg);
const favicon=readFileSync(join(root,'assets/favicon.svg'),'utf8');
html=html.replace('<link rel="stylesheet" href="styles.css">','<style>'+css+'</style>');
let js=app;
const serialized=JSON.stringify(data).replace(/<\//g,'<\\/').replace(/\u2028/g,'\\u2028');
html=html.replace('<script src="app.js" defer></script>',()=>`<script>window.__ARMTOURNEST_DATA__=${serialized};</script><script>${js}</script>`);
html=html.replace('href="assets/favicon.svg"',`href="data:image/svg+xml,${encodeURIComponent(favicon)}"`);
writeFileSync(join(root,'dist/index.html'),html);
writeFileSync(join(root,'ArmTourNest-CMS-preview.html'),html);
console.log('Built CMS website: '+data.tours.length+' tours, '+data.cars.length+' cars, '+data.services.transfers.length+' transfers, '+data.services.hotels.length+' hotels; '+Buffer.byteLength(html)+' HTML bytes');
