import crypto from 'node:crypto';
import { OWNER, REPO, ready, serviceToken, authVersion, session, cookieHeader, encrypt, github, reply, csrf } from '../lib/server.mjs';
const failures=new Map(), windowMs=15*60*1000;
const ip=req=>crypto.createHash('sha256').update(String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'unknown').split(',')[0]).digest('hex').slice(0,20);
const same=(a,b)=>crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(),crypto.createHash('sha256').update(String(b)).digest());
export default async function handler(req,res){
 const action=String(req.query.action||'session');
 if(req.method==='GET'&&action==='session'){
  const s=session(req);return reply(res,200,{configured:ready(),authenticated:Boolean(s),user:s?.user||null});
 }
 if(req.method==='POST'&&action==='login'){
  if(!csrf(req))return reply(res,403,{error:'Invalid origin'});
  if(!ready())return reply(res,503,{error:'Staff account setup is incomplete. Contact the site owner.'});
  let data=req.body;try{if(typeof data==='string')data=JSON.parse(data)}catch{data=null}
  const username=String(data?.username||'').trim(),password=String(data?.password||'');
  if(!username||!password||username.length>128||password.length>256)return reply(res,400,{error:'Enter a valid username and password'});
  const key=ip(req),row=failures.get(key),now=Date.now();
  if(row&&row.count>=8&&now-row.since<windowMs)return reply(res,429,{error:'Too many attempts. Try again later.'});
  if(!same(username,process.env.CMS_EDITOR_USERNAME)||!same(password,process.env.CMS_EDITOR_PASSWORD)){
   if(failures.size>1000)failures.clear();
   failures.set(key,row&&now-row.since<windowMs?{since:row.since,count:row.count+1}:{since:now,count:1});
   await new Promise(done=>setTimeout(done,650));
   return reply(res,401,{error:'Invalid username or password'});
  }
  try{
   const repository=await github(serviceToken(),'/repos/'+OWNER+'/'+REPO);
   if(!repository.permissions?.push)throw Error('Repository token lacks write access');
  }catch(e){console.error('CMS repository:',e.status||e.message);
   return reply(res,503,{error:'Publishing connection needs setup. Contact the site owner.'})}
  failures.delete(key);
  const maxAge=4*3600,user=process.env.CMS_EDITOR_USERNAME;
  res.setHeader('Set-Cookie',cookieHeader('__Host-armtournest_session',encrypt({user,version:authVersion(),exp:Date.now()+maxAge*1000}),maxAge));
  return reply(res,200,{authenticated:true,user});
 }
 if(req.method==='POST'&&action==='logout'){
  if(!csrf(req))return reply(res,403,{error:'Invalid origin'});
  res.setHeader('Set-Cookie',cookieHeader('__Host-armtournest_session','',0));
  return reply(res,200,{ok:true});
 }
 return reply(res,404,{error:'Unknown action'});
}
