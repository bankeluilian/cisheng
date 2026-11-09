'use client';

import {useEffect,useRef,useState} from 'react';
import {Award,Copy,Download,Share2,X} from 'lucide-react';
import type {Entry,Life} from '../lib/engine';
import {lifeMilestones,milestoneShareContent} from '../lib/milestones';
import {renderMilestoneCard} from '../lib/milestone-card';

type Props={life:Life;onPreview?:()=>void};

export default function MilestoneShelf({life,onPreview}:Props){
 const [selected,setSelected]=useState<Entry|null>(null);
 const milestones=lifeMilestones(life);
 const [latest,...earlier]=milestones;
 if(!latest)return null;

 function open(event:Entry){
  onPreview?.();
  setSelected(event);
 }

 return <section className="milestone-shelf" aria-label="人生里程碑">
  <header><Award size={21} aria-hidden="true"/><h3>人生里程碑</h3><small>已解锁 {milestones.length} 个</small></header>
  <div className="milestone-latest">
   <div><small>最近解锁 · {latest.age} 岁</small><strong>{latest.title}</strong></div>
   <button className="btn secondary" onClick={()=>open(latest)}><Share2 size={16} aria-hidden="true"/>分享里程碑</button>
  </div>
  {earlier.length>0&&<details>
   <summary>查看更早的 {earlier.length} 个里程碑</summary>
   <ul>{earlier.map(event=><li key={event.id}>
    <span>{event.age} 岁 · {event.title}</span>
    <button className="text-link" aria-label={`分享「${event.title}」`} onClick={()=>open(event)}>分享 <Share2 size={14} aria-hidden="true"/></button>
   </li>)}</ul>
  </details>}
  {selected&&<MilestoneDialog key={selected.id} life={life} event={selected} onClose={()=>setSelected(null)}/>}
 </section>;
}

function MilestoneDialog({life,event,onClose}:{life:Life;event:Entry;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();},[]);

 return <dialog ref={dialog} className="milestone-dialog" aria-label="分享里程碑" onClose={onClose}>
  <header>
   <div><span className="eyebrow">此生 · 人生里程碑</span><h2>{event.title}</h2></div>
   <button className="icon-btn" type="button" aria-label="关闭里程碑预览" onClick={()=>dialog.current?.close()}><X size={22}/></button>
  </header>
  <MilestoneCardActions life={life} event={event}/>
 </dialog>;
}

function MilestoneCardActions({life,event}:{life:Life;event:Entry}){
 const [request,setRequest]=useState({showName:false});
 const [result,setResult]=useState<{request:typeof request;card:{url:string;file:File}|null}|null>(null);
 const [notice,setNotice]=useState('');
 const [showCaption,setShowCaption]=useState(false);
 const [sharing,setSharing]=useState(false);
 const current=result?.request===request?result:null;
 const card=current?.card;
 const content=milestoneShareContent(life,event,request.showName);

 useEffect(()=>{
  let disposed=false;
  let url:string|undefined;
  renderMilestoneCard(life,event,request.showName).then(blob=>{
   if(disposed)return;
   url=URL.createObjectURL(blob);
   setResult({request,card:{url,file:new File([blob],`此生-里程碑-${event.age}岁.png`,{type:'image/png'})}});
  }).catch(()=>{if(!disposed)setResult({request,card:null});});
  return ()=>{disposed=true;if(url)URL.revokeObjectURL(url);};
 },[life,event,request]);

 const shareData=card?{files:[card.file],title:`此生 · ${content.title}`,text:content.caption}:null;
 const canShare=!!shareData&&typeof navigator.share==='function'&&navigator.canShare?.(shareData);

 async function share(){
  if(!shareData||sharing)return;
  setSharing(true);
  try{await navigator.share(shareData);}
  catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))setNotice('分享没有完成，可以先保存图片再发送。');}
  finally{setSharing(false);}
 }

 async function copyCaption(){
  try{
   await navigator.clipboard.writeText(content.caption);
   setNotice('已复制分享文案和试玩链接。');
  }catch{
   setShowCaption(true);
   setNotice('可以从下方手动复制分享文案。');
  }
 }

 return <div className="milestone-card-layout">
  <div className="milestone-card-preview">
   {card?<img src={card.url} alt={`${content.title}，${content.date}，${content.identity}`} width={1080} height={1440}/>:current?
    <div role="alert"><p>纪念卡生成失败，请重试。</p><button className="btn secondary" onClick={()=>setRequest({...request})}>重新生成</button></div>:
    <p role="status">正在制作纪念卡…</p>}
  </div>
  <div className="milestone-card-actions">
   <p>{content.date} · {life.country.name}</p>
   <label className="milestone-name-option"><input type="checkbox" checked={request.showName} onChange={e=>{setRequest({showName:e.target.checked});setNotice('');}}/>在图片和文案中显示游戏姓名</label>
   {card&&<a className="btn primary" href={card.url} download={card.file.name}><Download size={17} aria-hidden="true"/>保存高清图</a>}
   {canShare&&<button className="btn secondary" onClick={share} disabled={sharing}><Share2 size={17} aria-hidden="true"/>分享到其他应用</button>}
   <button className="btn secondary" onClick={copyCaption}><Copy size={17} aria-hidden="true"/>复制分享文案</button>
   {notice&&<p className="milestone-share-notice" role="status">{notice}</p>}
   {showCaption&&<textarea aria-label="分享文案" readOnly value={content.caption} rows={6} onFocus={e=>e.currentTarget.select()}/>}
   <p className="milestone-share-note">竖版 PNG · 1080 × 1440。图片和文案都附有试玩入口。</p>
  </div>
 </div>;
}
