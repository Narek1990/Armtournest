import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import sharp from 'sharp';
export async function optimizeCmsImages(root,data){
 const MAX_UPLOAD_BYTES=8*1024*1024,MAX_PIXELS=36_000_000,MAX_SIDE=8192;
 const allowed=new Set([".png",".jpg",".jpeg",".webp"]);
 const presets={hero:{width:1920,height:1080,bytes:650*1024},detail:{width:1600,height:1100,bytes:450*1024},logo:{width:800,height:800,bytes:150*1024}};
 const outRoot=resolve(root,"dist","media"), sourceRoot=resolve(root,"media")+sep;
 const cache=new Map(),seen=new WeakSet();
 await mkdir(outRoot,{recursive:true});
 async function convert(uri,role){
   if(!uri.startsWith("/media/"))return uri;
   const relativePath=decodeURIComponent(uri.slice(7));
   if(!relativePath||relativePath.startsWith("/")||relativePath.includes("\\")||relativePath.split("/").some(x=>!x||x===".."))throw Error("Invalid CMS media path: "+uri);
   const ext=extname(relativePath).toLowerCase();
   if(!allowed.has(ext))throw Error("Unsupported CMS image: "+uri+"; use JPG, PNG or WebP.");
   const key=relativePath+":"+role;
   if(cache.has(key))return cache.get(key);
   const src=resolve(root,"media",relativePath);
   if(!src.startsWith(sourceRoot))throw Error("Unsafe image path: "+uri);
   let input;
   try{input=await readFile(src)}catch{throw Error("CMS image is missing: "+uri+". Re-select it in Pages CMS.")}
   if(input.length>MAX_UPLOAD_BYTES)throw Error("CMS upload "+uri+" is "+(input.length/1048576).toFixed(1)+" MiB; maximum is 8 MiB.");
   const metadata=await sharp(input,{failOn:"error",limitInputPixels:MAX_PIXELS}).metadata();
   if(!metadata.width||!metadata.height||metadata.width>MAX_SIDE||metadata.height>MAX_SIDE||metadata.width*metadata.height>MAX_PIXELS)throw Error("CMS image "+uri+" exceeds 8192 px per side / 36 MP.");
   const preset=presets[role]||presets.detail;
   let width=preset.width,height=preset.height,result;
   for(let scale=0;scale<5;scale++){
     for(const quality of [80,68,55,42]){
       result=await sharp(input,{failOn:"error",limitInputPixels:MAX_PIXELS}).rotate().resize({width,height,fit:"inside",withoutEnlargement:true}).webp({quality,effort:4}).toBuffer();
       if(result.byteLength<=preset.bytes)break;
     }
     if(result.byteLength<=preset.bytes)break;
     width=Math.max(320,Math.round(width*.72));height=Math.max(240,Math.round(height*.72));
   }
   if(result.byteLength>preset.bytes)throw Error("Cannot reduce "+uri+" below "+Math.round(preset.bytes/1024)+" KiB.");
   const outRel=relativePath.slice(0,-ext.length)+"-"+role+".webp";
   await mkdir(dirname(join(outRoot,outRel)),{recursive:true});
   await writeFile(join(outRoot,outRel),result);
   const resultUrl="/media/"+outRel.split(sep).map(encodeURIComponent).join("/");
   cache.set(key,resultUrl);
   console.log("Optimized "+uri+" to "+resultUrl+" ("+metadata.width+"x"+metadata.height+", "+Math.round(result.byteLength/1024)+" KiB)");
   return resultUrl;
 }
 async function walk(v,key=""){
   if(v&&typeof v==="object"){if(seen.has(v))return v;seen.add(v)}
   if(Array.isArray(v)){for(let i=0;i<v.length;i++)v[i]=await walk(v[i],key);return v}
   if(v&&typeof v==="object"){for(const [k,x]of Object.entries(v))v[k]=await walk(x,k);return v}
   return typeof v==="string"&&v.startsWith("/media/")?convert(v,key==="heroImage"?"hero":key==="logo"?"logo":"detail"):v;
 }
 await walk(data);
 console.log("CMS image pipeline complete: "+cache.size+" compressed media variant(s).");
}
