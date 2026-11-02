import {sceneFor,summary} from './engine';
import {sceneImage} from './scenes';
import {textileAsset} from './textile';
import type {Life} from './engine';

export async function exportCard(l:Life,farewell:string){
 const load=async(src:string)=>{const img=new Image();img.src=src;await img.decode();return img;};
 const [scene,linen,flower,ticket]=await Promise.all([load(sceneImage(sceneFor(l))),load(textileAsset('linen')),load(textileAsset('icon-flower')),load(textileAsset('icon-ticket'))]);
 const rounded=(x:number,y:number,w:number,h:number,r:number)=>{if(typeof c.roundRect==='function')c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);};
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=2600;const c=canvas.getContext('2d')!;
 c.fillStyle='#faf5e9';c.fillRect(0,0,1080,2600);c.save();c.globalAlpha=.18;c.fillStyle=c.createPattern(linen,'repeat')!;c.fillRect(0,0,1080,2600);c.restore();
 const text=(s:string,x:number,y:number,size:number,color='#123f42')=>{c.fillStyle=color;c.font=`${size}px "Songti SC","SimSun",serif`;c.fillText(s,x,y);};
 const wrap=(s:string,x:number,y:number,max:number,size=28,color='#123f42',leading=45)=>{let line='',row=y;for(const char of s){c.font=`${size}px "SimSun",serif`;if(c.measureText(line+char).width>max&&line){text(line,x,row,size,color);line='';row+=leading;}line+=char;}if(line)text(line,x,row,size,color);return row+leading;};
 text('此 生  /  人 生 留 影',70,100,24,'#a66841');c.drawImage(flower,930,55,65,65);
 let nameSize=64;c.font=`${nameSize}px "SimSun",serif`;while(c.measureText(l.name).width>940&&nameSize>24){nameSize--;c.font=`${nameSize}px "SimSun",serif`;}
 text(l.name,70,184,nameSize);text(`${l.birthYear} — ${l.birthYear+l.age}   ·   ${l.age} 岁`,70,238,28);text(`出生于${l.country.name}`,70,280,23,'#68766c');
 c.save();c.beginPath();rounded(70,315,940,450,16);c.clip();const ratio=Math.max(940/scene.width,450/scene.height),w=scene.width*ratio,h=scene.height*ratio;c.drawImage(scene,70+(940-w)/2,315+(450-h)/2,w,h);c.restore();
 c.strokeStyle='#bcae95';c.lineWidth=1.5;c.setLineDash([5,5]);c.strokeRect(76,321,928,438);c.setLineDash([]);
 const a=summary(l);let y=wrap(a.line,70,823,940,28)+20;c.strokeStyle='#cabb9f';c.setLineDash([4,6]);c.beginPath();c.moveTo(70,y);c.lineTo(1010,y);c.stroke();c.setLineDash([]);y+=58;text('这一生，记得这些时刻',70,y,26,'#a66841');y+=55;
 for(const e of a.moments){text(`${e.age} 岁`,70,y,23,'#68766c');c.fillStyle='#8e944f';c.beginPath();c.arc(168,y-8,5,0,Math.PI*2);c.fill();const next=wrap(e.title,200,y,800,26,'#123f42',40);if(e!==a.moments.at(-1)){c.strokeStyle='#cabb9f';c.setLineDash([3,4]);c.beginPath();c.moveTo(168,y+5);c.lineTo(168,next+9);c.stroke();c.setLineDash([]);}y=next+22;}
 if(l.keepsakes.length){y+=10;c.strokeStyle='#d4c6ae';c.setLineDash([5,5]);c.strokeRect(70,y,940,132);c.setLineDash([]);c.drawImage(ticket,85,y+28,60,60);text('留下的小物',170,y+40,22,'#a66841');y=wrap(l.keepsakes.at(-1)!.name,170,y+83,805,26)+38;}
 if(farewell.trim())y=wrap(`“${farewell.trim().slice(0,80)}”`,70,y+34,940,28)+20;
 const height=Math.min(2600,Math.max(1620,y+170));text('有些日子很平常，但它们只属于你。',70,height-105,24,'#68766c');text('此生 · 虚构人生模拟',70,height-62,18,'#68766c');
 c.strokeStyle='#b4a07e';c.lineWidth=1.5;c.setLineDash([5,5]);c.beginPath();rounded(35,35,1010,height-70,24);c.stroke();c.setLineDash([]);
 const output=document.createElement('canvas');output.width=1080;output.height=height;output.getContext('2d')!.drawImage(canvas,0,0);
 const blob=await new Promise<Blob|null>(r=>output.toBlob(r,'image/png'));if(!blob)throw Error('图片生成失败');const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`此生-${l.name}-${l.age}岁.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
