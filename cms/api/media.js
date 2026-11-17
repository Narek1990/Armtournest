import { OWNER,REPO,requireAdmin,serviceToken,github,reply } from '../lib/server.mjs';
const mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
export default async function handler(req,res){
 const session=await requireAdmin(req,res);if(!session)return;
 if(req.method!=='GET')return reply(res,405,{error:'Method not allowed'});
 try{
  const raw=String(req.query.path||'');
  const path=raw.startsWith('/')?raw.slice(1):raw;
  if(!new RegExp('^media/[a-zA-Z0-9._-]+[.](?:png|jpe?g|webp)$').test(path)||
     path.includes('..')||path.length>220)return reply(res,400,{error:'Invalid image path'});
  const ext=path.slice(path.lastIndexOf('.')).toLowerCase();
  const api='/repos/'+OWNER+'/'+REPO;
  const metadata=await github(serviceToken(),api+'/contents/'+path+'?ref=main');
  if(metadata.type!=='file'||metadata.size>2200000||!metadata.sha)
    return reply(res,413,{error:'Media file unavailable or too large'});
  let content=metadata.content;
  if(!content||metadata.encoding!=='base64'){
    const blob=await github(serviceToken(),api+'/git/blobs/'+metadata.sha);
    if(blob.encoding!=='base64')throw Error('Unsupported image encoding');
    content=blob.content;
  }
  const bytes=Buffer.from(String(content).replace(new RegExp('\\s','g'),''),'base64');
  if(bytes.length<16||bytes.length>2200000)throw Error('Invalid media payload');
  res.setHeader('Content-Type',mime[ext]);
  res.setHeader('Cache-Control','private, max-age=60');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(200).send(bytes);
 }catch(e){
  console.error('CMS photo preview',e.status||e.message);
  return reply(res,e.status===404?404:502,{error:'Image preview unavailable'});
 }
}
