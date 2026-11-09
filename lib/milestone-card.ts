import type {Entry,Life} from './engine';
import {milestonePlayUrl,milestoneShareContent} from './milestones';
import {entrySceneFor,sceneImage} from './scenes';
import {textileAsset} from './textile';

async function loadImage(src:string){
 const img=new Image();
 img.src=src;
 await img.decode();
 return img;
}

export async function renderMilestoneCard(life:Life,event:Entry,showName:boolean):Promise<Blob>{
 const content=milestoneShareContent(life,event,showName);
 const [scene,linen,leaf]=await Promise.all([
  loadImage(sceneImage(entrySceneFor(life,event))),
  loadImage(textileAsset('linen')),
  loadImage(textileAsset('icon-leaf')),
 ]);
 const canvas=document.createElement('canvas');
 canvas.width=1080;
 canvas.height=1440;
 const ctx=canvas.getContext('2d');
 if(!ctx)throw new Error('无法绘制纪念卡');
 const ink='#123f42', muted='#52665c', accent='#995b39';
 ctx.fillStyle='#faf5e9';
 ctx.fillRect(0,0,1080,1440);
 const fabric=ctx.createPattern(linen,'repeat');
 if(fabric){
  ctx.save();
  ctx.globalAlpha=.24;
  ctx.fillStyle=fabric;
  ctx.fillRect(0,0,1080,1440);
  ctx.restore();
 }
 const font=(size:number)=>`${size}px "Songti SC","SimSun",serif`;
 const write=(value:string,y:number,size:number,color=ink)=>{
  ctx.font=font(size);
  ctx.fillStyle=color;
  ctx.fillText(value,80,y);
 };
 const wrap=(value:string,y:number,size:number,spacing:number,maxLines:number,color=ink)=>{
  ctx.font=font(size);
  const lines:string[]=[];
  let line='';
  for(const char of value){
   if(line&&ctx.measureText(line+char).width>920){lines.push(line);line='';}
   line+=char;
  }
  if(line)lines.push(line);
  const visible=lines.slice(0,maxLines);
  if(lines.length>maxLines){
   const last=Array.from(visible[maxLines-1]);
   while(last.length&&ctx.measureText(`${last.join('')}…`).width>920)last.pop();
   visible[maxLines-1]=`${last.join('')}…`;
  }
  visible.forEach((row,i)=>write(row,y+i*spacing,size,color));
 };
 write('此 生  /  人 生 里 程 碑',106,29,accent);
 ctx.drawImage(leaf,919,62,78,78);
 wrap(content.title,211,62,74,2);
 wrap(`${content.date}  ·  ${content.identity}`,359,31,38,1,muted);

 const y=408,w=920,h=518;
 const scale=Math.max(w/scene.naturalWidth,h/scene.naturalHeight);
 const imageWidth=scene.naturalWidth*scale,imageHeight=scene.naturalHeight*scale;
 ctx.save();
 ctx.beginPath();
 if(typeof ctx.roundRect==='function')ctx.roundRect(80,y,w,h,18);
 else ctx.rect(80,y,w,h);
 ctx.clip();
 ctx.drawImage(scene,80+(w-imageWidth)/2,y+(h-imageHeight)/2,imageWidth,imageHeight);
 ctx.restore();

 wrap(content.detail,1015,36,53,4);
 ctx.strokeStyle='#baab8e';
 ctx.lineWidth=2;
 ctx.setLineDash([6,7]);
 ctx.strokeRect(34,34,1012,1372);
 ctx.beginPath();
 ctx.moveTo(80,1242);
 ctx.lineTo(1000,1242);
 ctx.stroke();
 ctx.setLineDash([]);
 write('如果重来，你会是谁？',1305,32);
 write(milestonePlayUrl.replace('https://',''),1353,25,muted);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>{
  if(blob)resolve(blob);
  else reject(new Error('纪念卡图片生成失败'));
 },'image/png'));
}
