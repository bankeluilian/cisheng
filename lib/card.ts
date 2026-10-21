import { sceneFor, summary } from './engine';
import type { Life } from './engine';
export async function exportCard(l:Life,farewell:string){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=2200;const c=canvas.getContext('2d')!;
 c.fillStyle='#fafaf6';c.fillRect(0,0,1080,2200);c.strokeStyle='#d5d3cb';c.lineWidth=2;
 const text=(s:string,x:number,y:number,size:number,color='#30342f',family='"Songti SC","SimSun",serif')=>{c.fillStyle=color;c.font=`${size}px ${family}`;c.fillText(s,x,y);};
 text('此 生  /  人 生 留 影',70,100,24,'#886132');
 let nameSize=64;c.font=`${nameSize}px "Songti SC","SimSun",serif`;
 while(c.measureText(l.name).width>940&&nameSize>24){nameSize--;c.font=`${nameSize}px "Songti SC","SimSun",serif`;}
 text(l.name,70,184,nameSize);
 text(`${l.birthYear} — ${l.birthYear+l.age}   ·   ${l.age} 岁`,70,235,28);text(`出生于${l.country.name}`,70,278,23,'#73786e');
 const img=new Image();img.src=`/images/scene-${String(sceneFor(l)).padStart(2,'0')}.webp`;await img.decode();
 c.save();c.beginPath();c.rect(70,315,940,450);c.clip();const ratio=Math.max(940/img.width,450/img.height);const w=img.width*ratio,h=img.height*ratio;c.drawImage(img,70+(940-w)/2,315+(450-h)/2,w,h);c.restore();
 const wrap=(s:string,y:number,max:number,size=28)=>{let line='',row=y;for(const char of s){c.font=`${size}px "SimSun",serif`;if(c.measureText(line+char).width>max){text(line,70,row,size);line='';row+=45;}line+=char;}if(line)text(line,70,row,size);return row+45;};
 const a=summary(l);let y=wrap(a.line,823,940,28)+22;text('这一生，记得这些时刻',70,y,24,'#886132');y+=48;
 for(const e of a.moments){text(`${e.age} 岁`,70,y,23,'#73786e');text(e.title,190,y,26);y+=48;}
 if(l.keepsakes.length){y+=15;text('留下的小物',70,y,22,'#886132');y=wrap(l.keepsakes[l.keepsakes.length-1].name,y+42,940,26);}
 if(farewell.trim()){y+=20;y=wrap(`“${farewell.trim().slice(0,80)}”`,y,940,28);}
 const height=Math.max(1540,y+160);text('有些日子很平常，但它们只属于你。',70,height-100,24,'#73786e');text('此生 · 虚构人生模拟',70,height-60,18,'#73786e');c.strokeRect(35,35,1010,height-70);
 const output=document.createElement('canvas');output.width=1080;output.height=height;output.getContext('2d')!.drawImage(canvas,0,0);
 const blob=await new Promise<Blob|null>(r=>output.toBlob(r,'image/png'));if(!blob)throw Error('图片生成失败');const url=URL.createObjectURL(blob);const aTag=document.createElement('a');aTag.href=url;aTag.download=`此生-${l.name}-${l.age}岁.png`;aTag.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
