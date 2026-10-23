'use client';
import {assetUrl} from "../lib/web-hosting";
import {useState} from 'react';
import {Globe2,ArrowUpRight,Search,MapPin} from 'lucide-react';
import type {Country} from '../lib/engine';
import {samplingDistribution,probabilityLabel} from '../lib/sampling';
const colors=['#7f9178','#a4b296','#8faab3','#bca786','#b2a1ac','#9ea5bf','#d7d9cc'];
export default function BirthProbability({countries,method,onMethodChange,resultCountry}:{countries:Country[];method:string;onMethodChange?:(m:string)=>void;resultCountry?:Country}){
 const [preview,setPreview]=useState(''),[search,setSearch]=useState('');
 const data=samplingDistribution(countries,method),ranked=[...data.rows].sort((a,b)=>b.probability-a.probability);
 const chosen=ranked.find(r=>r.country.id===(resultCountry?.id||preview));
 const top=ranked.slice(0,6);if(resultCountry&&chosen&&!top.some(r=>r.country.id===resultCountry.id)){top.pop();top.push(chosen);}
 const rest=Math.max(0,1-top.reduce((a,r)=>a+r.probability,0));
 const sections=[...top.map((r,i)=>({id:r.country.id,name:r.country.name,value:r.probability,color:resultCountry?.id===r.country.id?'#886132':colors[i]})),{id:'others',name:`其余 ${Math.max(0,countries.length-top.length)} 个经济体`,value:rest,color:colors[6]}];
 let offset=0;const circumference=2*Math.PI*73;
 return <section className={`birth-probability ${resultCountry?'prob-result':''}`} aria-label={resultCountry?'这次出生的概率':'出生地概率分布'}>
  <div className="prob-heading"><div><span className="eyebrow">在出生之前，世界并不平均</span><h2>{resultCountry?'这次，你落在了这里。':'下一次出生，会落在哪里？'}</h2></div><Globe2 size={24} strokeWidth={1.2}/></div>
  <p className="prob-lead">{resultCountry?'这次出生由随机抽签决定。你可以看看，这个起点在全部可能中占多少。':'不同地方的出生人数和人口并不相同。每次独立抽取，概率大的地方更常遇到，概率小的地方也有机会。'}</p>
  {onMethodChange?<div className="prob-methods" role="group" aria-label="图表与出生抽样方式"><button aria-pressed={method==='births'} onClick={()=>onMethodChange('births')}>按出生人数</button><button aria-pressed={method==='population'} onClick={()=>onMethodChange('population')}>按现有人口</button></div>:<span className="prob-basis">这次的抽样方式：{method==='population'?'按现有人口':'按年度出生人数'}</span>}
  {!countries.length?<p className="subtle">正在准备出生地分布……</p>:<>
   <div className="prob-visual"><div className="prob-donut"><svg viewBox="0 0 200 200" role="img" aria-label={`${method==='population'?'人口':'出生人数'}权重概率分布，详细百分比见旁边列表`}><circle cx="100" cy="100" r="73" fill="none" stroke="var(--soft)" strokeWidth="22"/>{sections.map(s=>{const start=offset;offset+=s.value;return <circle key={s.id} cx="100" cy="100" r="73" fill="none" stroke={s.color} strokeWidth="22" strokeDasharray={`${s.value*circumference} ${circumference}`} strokeDashoffset={-start*circumference} transform="rotate(-90 100 100)"><title>{s.name}：{probabilityLabel(s.value)}</title></circle>;})}</svg><div className="prob-center"><small>{resultCountry?'这次出生于':'可能的起点'}</small><strong className={resultCountry?'country-name':''}>{resultCountry?.name||countries.length}</strong><span>{resultCountry&&chosen?probabilityLabel(chosen.probability):'个经济体'}</span></div></div>
    <div className="prob-legend">{sections.map(s=>s.id!=='others'&&!resultCountry?<button key={s.id} className={preview===s.id?'selected':''} onClick={()=>setPreview(s.id)} aria-label={`查看${s.name}的出生概率`}><i style={{background:s.color}}/><span>{s.name}</span><strong>{probabilityLabel(s.value)}</strong></button>:<div key={s.id} className={resultCountry?.id===s.id?'selected':''}><i style={{background:s.color}}/><span>{s.name}</span><strong>{probabilityLabel(s.value)}</strong></div>)}</div>
   </div>
   {(chosen||resultCountry)&&<div className="prob-country-detail"><MapPin size={18}/><div><span>{chosen?.country.name||resultCountry?.name}</span>{chosen?<p>抽中概率 <strong>{probabilityLabel(chosen.probability)}</strong> · 按当前权重排序第 {ranked.indexOf(chosen)+1} / {countries.length} 位{chosen.probability>0&&<> · 约每 {Math.max(1,Math.round(1/chosen.probability)).toLocaleString('zh-CN')} 次独立抽样中出现 1 次</>}</p>:<p>这份存档的地区不在当前数据中，无法核对概率。</p>}</div></div>}
   <details className="prob-all"><summary>查看全部 {countries.length} 个经济体的概率 <ArrowUpRight size={15}/></summary><label className="prob-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索出生地或代码" aria-label="搜索出生概率"/></label><div className="prob-all-list">{ranked.filter(r=>`${r.country.name} ${r.country.id}`.toLowerCase().includes(search.toLowerCase())).map((r)=><div key={r.country.id} className={resultCountry?.id===r.country.id?'selected':''}><span className="prob-rank">{ranked.indexOf(r)+1}</span><span>{r.country.name}</span><strong>{probabilityLabel(r.probability)}</strong><div className="prob-bar"><i style={{width:`${ranked[0]?.probability?r.probability/ranked[0].probability*100:0}%`}}/></div></div>)}{!ranked.some(r=>`${r.country.name} ${r.country.id}`.toLowerCase().includes(search.toLowerCase()))&&<p className="subtle">没有找到这个地区，试试三位代码。</p>}</div></details>
   <p className="prob-source">{data.fallback?'缺少可用权重，当前采用等概率抽样。':'权重来自世界银行 2023 年资料；出生人数由人口和粗出生率估算。'} {resultCountry?'低概率也可能出现，每次抽样互相独立。':'查看概率不会指定出生地，也不会消耗随机数。'} <a href={assetUrl("/data/data-notes.json")} target="_blank" rel="noreferrer">数据口径 ↗</a></p>
  </>}
 </section>;
}
