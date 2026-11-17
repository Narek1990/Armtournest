import crypto from 'node:crypto';
import { OWNER, REPO, BRANCH, TYPES, safeId, csrf, requireAdmin, github, reply, pathFor, readFile, message, serviceToken } from '../lib/server.mjs';

const allowedMime = new Set(['image/png', 'image/jpeg', 'image/webp']);
const entries = ['cars','tours','transfers','hotels','pages'];
const cover = x => {
  const v = x.images?.[0] || x.image || x.heroImage || '';
  return typeof v === 'string' ? v : '';
};
const friendly = x => (typeof x.name === 'object' ? (x.name.ru || x.name.en || x.name.hy) : x.name) ||
  x.title?.en || x.headline?.en || x.id || 'Unnamed item';
function checkImage(bytes, mime) {
  if (mime === 'image/png') return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === 'image/jpeg') return bytes.length > 4 && bytes[0] === 255 && bytes[1] === 216 && bytes.at(-2) === 255 && bytes.at(-1) === 217;
  if (mime === 'image/webp') return bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
  return false;
}
async function contents(token, path) {
  return github(token, '/repos/' + OWNER + '/' + REPO + '/contents/' + path + '?ref=' + BRANCH);
}
async function list(token, type) {
  if (type === 'site') {
    const file = await readFile(token, 'content/site.json');
    return [{ id:'site', title:'Website settings & contacts', status:'settings', data:file.data, sha:file.sha }];
  }
  const rows = await contents(token, 'content/' + type);
  if (!Array.isArray(rows)) throw new Error('Expected GitHub content directory');
  const files = rows.filter(r=>r.type==='file'&&r.name.endsWith('.json')&&safeId(r.name.slice(0,-5)));
  return Promise.all(files.map(async file => {
    try {
      const rec = await readFile(token, file.path);
      const x = rec.data;
      return {
        id: file.name.slice(0,-5),
        title: friendly(x), status:x.status||'page', image:cover(x),
        price:x.pricing?.dailyRate ?? x.pricing?.from ?? x.price ?? null,
        featured:x.featured===true, sha:rec.sha
      };
    } catch(e) { return {id:file.name.slice(0,-5),title:file.name,status:'error',error:message(e)}; }
  }));
}
async function save(token, body) {
  const type = String(body.type || '');
  const id = String(body.id || '');
  const path = pathFor(type,id);
  if (!body.entry || typeof body.entry !== 'object' || Array.isArray(body.entry)) throw Object.assign(new Error('Content must be an object'), { status:422 });
  if (type!=='site' && body.entry.id && body.entry.id!==id && type!=='pages') throw Object.assign(new Error('Entry slug does not match file name'), {status:422});
  if (!body.sha && type==='site') throw Object.assign(new Error('Missing file version'), {status:422});
  const source = JSON.stringify(body.entry,null,2)+'\n';
  if (Buffer.byteLength(source,'utf8')>150000) throw Object.assign(new Error('Content entry is too large'),{status:413});
  if (type==='cars' && (!Number.isFinite(body.entry.pricing?.dailyRate) || body.entry.pricing.dailyRate < 0)) throw Object.assign(new Error('Enter a valid daily price'),{status:422});
  if (type==='tours' && (!Number.isFinite(body.entry.pricing?.from) || body.entry.pricing.from < 0)) throw Object.assign(new Error('Enter a valid tour price'),{status:422});
  const payload = { message:'cms: '+(body.sha?'update ':'create ')+path, content:Buffer.from(source).toString('base64'), branch:BRANCH };
  if(body.sha) payload.sha=String(body.sha);
  const result = await github(token,'/repos/'+OWNER+'/'+REPO+'/contents/'+path,{method:'PUT',body:payload});
  return {sha:result.content?.sha, commit:result.commit?.sha};
}
async function upload(token, body) {
  const mime=String(body.mime||'').toLowerCase();
  if(!allowedMime.has(mime)) throw Object.assign(new Error('Use a JPEG, PNG or WebP image'),{status:422});
  const b64=String(body.base64||'');
  if(!b64 || b64.length>2_900_000 || !/^[a-zA-Z0-9+/=]+$/.test(b64)) throw Object.assign(new Error('Image exceeds 2 MiB maximum'),{status:413});
  const bytes=Buffer.from(b64,'base64');
  if (bytes.length<100 || bytes.length>2_000_000 || !checkImage(bytes,mime)) throw Object.assign(new Error('Invalid image or image is too large (max 2 MiB)'),{status:422});
  const folder=String(body.type||'').toLowerCase();
  if(!TYPES.has(folder)) throw Object.assign(new Error('Invalid content category'),{status:422});
  const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[mime];
  const name='cms-'+folder+'-'+Date.now()+'-'+crypto.randomBytes(4).toString('hex')+'.'+ext;
  const path='media/'+name;
  await github(token, '/repos/'+OWNER+'/'+REPO+'/contents/'+path, {
    method:'PUT', body:{message:'cms: upload '+name,content:bytes.toString('base64'),branch:BRANCH}
  });
  return {path:'/'+path, name};
}
export default async function handler(req,res) {
  const s=await requireAdmin(req,res);if(!s)return;
  try {
    if(req.method==='GET') {
      const type=String(req.query.type||'');
      if(!TYPES.has(type)) return reply(res,400,{error:'Unknown collection'});
      const id=req.query.id;
      if(id || type==='site') {
        const path=pathFor(type,type==='site'?'site':String(id));
        const result=await readFile(serviceToken(),path);
        return reply(res,200,{id:type==='site'?'site':String(id),...result});
      }
      return reply(res,200,{rows:await list(serviceToken(),type)});
    }
    if(req.method==='POST') {
      if(!csrf(req))return reply(res,403,{error:'Invalid origin'});
      const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
      if(!body||typeof body!=='object')return reply(res,400,{error:'Invalid request'});
      if(body.action==='save')return reply(res,200,await save(serviceToken(),body));
      if(body.action==='upload')return reply(res,200,await upload(serviceToken(),body));
      return reply(res,400,{error:'Unknown action'});
    }
    return reply(res,405,{error:'Method not allowed'});
  }catch(e) {
    console.error('CMS API:',e.status||500,message(e));
    return reply(res,e.status&&e.status>=400&&e.status<500?e.status:502,{error:message(e)});
  }
}
