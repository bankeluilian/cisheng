'use client';
import {useEffect,useRef,useState} from 'react';
import {Bookmark,Star,X,ZoomIn,ChevronDown} from 'lucide-react';
import type {Life,Entry} from '../lib/engine';
import {entrySceneFor,sceneCaption,sceneImage,sceneInfo} from '../lib/scenes';

const phases=[{id:'all',label:'全部',min:0,max:110},{id:'child',label:'童年 · 0—5 岁',min:0,max:5},{id:'young',label:'少年 · 6—17 岁',min:6,max:17},{id:'adult',label:'成年 · 18—64 岁',min:18,max:64},{id:'late',label:'晚年 · 65 岁起',min:65,max:110}];
type Props={life:Life;favoritesOnly?:boolean;onToggleFavorites?:()=>void;onFavorite?:(id:string)=>void;forward?:boolean};
export default function IllustratedJournal({life,favoritesOnly=false,onToggleFavorites,onFavorite,forward=false}:Props){
 const [phase,setPhase]=useState('all'),[visible,setVisible]=useState(12),[chronological,setChronological]=useState(forward),[selected,setSelected]=useState<Entry|null>(null);
 const current=phases.find(p=>p.id===phase)||phases[0];
 const filtered=life.events.filter(e=>e.age>=current.min&&e.age<=current.max&&(!favoritesOnly||life.favorites.includes(e.id)));
 const ordered=chronological?filtered:[...filtered].reverse();
 return <section className="illustrated-journal" aria-label="图文人生小记">
  <header className="illustrated-journal-header"><div><span className="eyebrow">把日子留在画里</span><h3>日子，一页一页</h3><p>一段经历，一幅留影。点击图片，回到那个时刻。</p></div><div className="journal-view-controls"><label>阅读顺序<select value={chronological?'forward':'recent'} onChange={e=>{setChronological(e.target.value==='forward');setVisible(12);}}><option value="recent">最近在前</option><option value="forward">从出生开始</option></select></label>{onToggleFavorites&&<button className={`journal-favorites-toggle ${favoritesOnly?'active':''}`} aria-pressed={favoritesOnly} onClick={()=>{setVisible(12);onToggleFavorites();}}><Star size={17}/><span>{favoritesOnly?'查看全部小记':'只看收藏'}</span></button>}</div></header>
  <div className="journal-phase-filter" role="group" aria-label="按人生阶段筛选">{phases.map(p=><button key={p.id} aria-pressed={phase===p.id} onClick={()=>{setPhase(p.id);setVisible(12);}}>{p.label}</button>)}</div>
  <div className="illustrated-entry-list">{ordered.slice(0,visible).map(e=>{const id=entrySceneFor(life,e),meta=sceneInfo(id),favorite=life.favorites.includes(e.id);return <article className="illustrated-entry" key={e.id}><div className="illustrated-entry-date"><strong>{e.age}<small> 岁</small></strong><time>{e.year} 年</time></div><button className="journal-image-button" onClick={()=>setSelected(e)} aria-label={`查看 ${e.year} 年「${e.title}」的配图`}><img src={sceneImage(id,true)} alt={meta.alt} loading="lazy" decoding="async" width={500} height={333}/><span><ZoomIn size={15}/>看看这一页</span></button><div className="illustrated-entry-copy"><span className="illustrated-entry-caption">{sceneCaption(life,id,e.year)}</span><h4>{e.title}</h4><p>{e.text}</p></div>{onFavorite?<button className={`journal-entry-favorite ${favorite?'favorited':''}`} aria-label={`${favorite?'取消收藏':'收藏'}「${e.title}」`} aria-pressed={favorite} onClick={()=>onFavorite(e.id)}><Star size={19}/></button>:favorite?<span className="journal-entry-favorite favorited" aria-label="已收藏"><Bookmark size={18}/></span>:null}</article>;})}</div>
  {!ordered.length&&<div className="illustrated-journal-empty"><Bookmark size={28}/><p>{favoritesOnly?'这个阶段还没有收藏的小记。':'这个阶段的故事还没有发生，先认真走好眼前的日子。'}</p></div>}
  {ordered.length>0&&<footer className="journal-load-more"><span>已展开 {Math.min(visible,ordered.length)} / {ordered.length} 条小记</span>{visible<ordered.length&&<button className="btn secondary" onClick={()=>setVisible(n=>n+12)}>再翻开 {Math.min(12,ordered.length-visible)} 条 <ChevronDown size={17}/></button>}</footer>}
  {selected&&<JournalImageDialog life={life} entry={selected} onClose={()=>setSelected(null)}/>}
 </section>;
}
function JournalImageDialog({life,entry,onClose}:{life:Life;entry:Entry;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const el=ref.current;el?.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{el?.close();document.body.style.overflow=old;};},[]);
 const scene=entrySceneFor(life,entry);
 return <dialog ref={ref} className="journal-image-dialog" aria-label={`${entry.title}的画面`} onClose={()=>close.current()} onClick={e=>{if(e.target===e.currentTarget)ref.current?.close();}}><div className="journal-image-dialog-header"><div><span>{entry.year} 年 · {entry.age} 岁</span><h3>{entry.title}</h3></div><button className="icon-btn" aria-label="关闭配图" onClick={()=>ref.current?.close()}><X size={23}/></button></div><img src={sceneImage(scene)} alt={sceneInfo(scene).alt}/><p className="journal-image-detail-caption">{sceneCaption(life,scene,entry.year)}</p><p className="journal-image-detail-text">{entry.text}</p><p className="journal-image-detail-note">手绘生活意象，记住这个时刻的心情，不对应具体城市的实景。</p></dialog>;
}
