export default function handler(_req,res){
 res.setHeader('Cache-Control','no-store');
 return res.status(410).json({error:'This CMS uses username and password sign-in.'});
}
