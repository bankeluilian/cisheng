import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Read the generated-image inventory on stdin; keep full PNGs with the local art.
let input='';for await(const chunk of process.stdin){input+=chunk;if(input.includes('\n'))break;}
const rows=JSON.parse(input),root=process.cwd();
const art=path.resolve(root,'../art/life-scenes'),images=path.join(root,'public/images');
await fs.mkdir(art,{recursive:true});
const manifestPath=path.join(images,'assets-manifest.json');
const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
const promptPath=path.join(root,'docs/scene-art-prompts.json');
let prompts={method:'image_gen built-in',style:'手绘线稿、水彩与水粉质感，暖色日常生活意象',assets:[]};
try{prompts=JSON.parse(await fs.readFile(promptPath,'utf8'));}catch{}
for(const row of rows){
 const suffix=String(row.id).padStart(2,'0'),original=`scene-${suffix}-${row.key}.png`;
 const saved=path.join(art,original);await fs.copyFile(row.source,saved);
 const source=await fs.stat(saved),meta=await sharp(saved).metadata();
 const existing=manifest.assets.some(a=>a.file===`scene-${suffix}.webp`);
 for(const [prefix,width,quality] of [['scene',1440,86],['thumb',500,80]]){
  const file=`${prefix}-${suffix}.webp`,result=await sharp(saved).resize({width,withoutEnlargement:true}).webp({quality}).toFile(path.join(images,file));
  const asset={file,source:`../art/life-scenes/${original}`,generation_method:'image_gen built-in',prompt_ref:`docs/scene-art-prompts.json#${row.id}`,source_bytes:source.size,source_dimensions:[meta.width,meta.height],dimensions:[result.width,result.height],bytes:result.size,quality};
  manifest.assets=manifest.assets.filter(a=>a.file!==file);manifest.assets.push(asset);
 }
 if(!existing)manifest.total_original_bytes+=source.size;
 prompts.assets=prompts.assets.filter(a=>a.id!==row.id);prompts.assets.push({id:row.id,key:row.key,original:`../art/life-scenes/${original}`,prompt:row.prompt});
}
manifest.total_asset_bytes=manifest.assets.reduce((sum,a)=>sum+a.bytes,0);
prompts.assets.sort((a,b)=>a.id-b.id);
await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(promptPath,JSON.stringify(prompts,null,2)+'\n');
console.log(JSON.stringify({prepared:rows.map(r=>r.id),totalSceneImages:manifest.assets.filter(a=>a.file.startsWith('scene-')).length,totalAssetBytes:manifest.total_asset_bytes}));
