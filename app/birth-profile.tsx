import {MapPin,UserRound,Heart,Wallet,RefreshCw,ArrowRight,PencilLine} from 'lucide-react';
import type {Life,Country} from '../lib/engine';
import {samplingDistribution,probabilityLabel} from '../lib/sampling';
import {nameOriginNote} from '../lib/names';
import FamilyOrigins from './family-origins';
import BirthProbability from './birth-probability';
import {birthSceneFor,sceneImage,sceneInfo} from '../lib/scenes';

type Props={life:Life;countries:Country[];busy:boolean;ready:boolean;comparison:string;onComparison:(value:string)=>void;onReroll:()=>void;onRename:()=>void;onBegin:()=>void};
export default function BirthProfile({life,countries,busy,ready,comparison,onComparison,onReroll,onRename,onBegin}:Props){
 const odds=samplingDistribution(countries,life.sampling).rows.find(c=>c.country.id===life.country.id);
 const tier=life.story?.family.tier==='tight'?'紧张':life.story?.family.tier==='comfortable'?'宽裕':'稳定';
 const birthScene=birthSceneFor(life);
 const facts=[
  {label:'出生地',value:life.country.name,note:odds?`这次抽中的概率 ${probabilityLabel(odds.probability)}`:'',Icon:MapPin},
  {label:'人物身份',value:`${life.sex} · ${life.birthYear}`,note:'故事从这一年开始',Icon:UserRound},
  {label:'家人的心愿',value:'愿你平安，愿你有自己的路。',note:'有人认真期待你的到来',Icon:Heart},
  {label:'出生家庭',value:tier,note:life.story?`家中支持 ${life.story.family.support}/100`:'家庭资料已记录',Icon:Wallet},
 ];
 return <section className="birth-layout birth-revealed" aria-label="已经揭晓的出生档案">
  <div className="birth-personal-card" role="group" aria-label="个人资料卡">
  <div className="birth-personal-heading"><span className="eyebrow">此生 · 个人资料</span><span>出生于 {life.birthYear} 年</span></div>
  <div className="birth-hero">
   <figure className="birth-art"><img src={sceneImage(birthScene)} alt={sceneInfo(birthScene).alt}/><figcaption>故事的第一页 · {life.birthYear} · 手绘生活意象</figcaption></figure>
   <div className="birth-copy birth-intro-copy"><span className="eyebrow">一次随机的出生 / 一段新的人生</span><h1 className="birth-greeting"><span className="birth-hello">你好，</span><span className="birth-person-name">{life.name}</span></h1><p className="lead">在世界的某个角落，<br/>你的第一声啼哭，开启了这一生。</p><button className="text-link rename-birth" onClick={onRename}><PencilLine size={17}/><span>起一个自己的名字</span></button><p className="birth-name-note">{nameOriginNote(life.country,life.nameOrigin)}</p></div>
  </div>
  <section className="birth-facts-panel" aria-label="出生资料卡"><div className="birth-facts-heading"><span>此生档案</span><span>命运的第一笔</span></div><dl className="birth-fact-grid">{facts.map(({label,value,note,Icon})=><div className="birth-fact-card" key={label}><dt><Icon size={19}/><span>{label}</span></dt><dd>{value}</dd><dd className="birth-fact-note">{note}</dd></div>)}</dl><p className="birth-facts-footer">起点由命运写下，故事由你继续。</p></section>
  <div className="birth-support-note"><p>家中支持会影响求学时能够得到的帮助、可承受的费用与后续机会。家庭条件为游戏抽样，不代表出生地的每个人。</p></div>
  <FamilyOrigins life={life}/>
  </div>
  <div className="birth-actions"><button className="btn secondary" disabled={busy||!ready||!countries.length} onClick={onReroll}><RefreshCw size={18}/><span>{busy?'正在抽签…':'全部重新随机'}</span></button><button className="btn primary" disabled={busy} onClick={onBegin}><span>开始这一生</span><ArrowRight size={18}/></button></div>
  <p className="birth-action-note">出生年份（1966—2026）、出生地、姓名、父母与家庭条件一起重新抽取。上一份档案会保留，相同结果也可能再次出现。</p>
  <div className="birth-probability-slot"><BirthProbability countries={countries} method={life.sampling} resultCountry={life.country}/></div>
  <details className="birth-comparison"><summary>可选：对照现实出生地</summary><label className="field">你的真实出生地（仅用于对照，不改变角色）<select value={comparison} onChange={e=>onComparison(e.target.value)}>{countries.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><p className="subtle">{countries.find(c=>c.id===comparison)?.name||'对照地区'} 与 {life.country.name} 的故事，可能从不同的条件开始。统计不是命运。</p></details>
  <p className="fine-print birth-fiction-note">人物及经历均为虚构，场景为手绘意象。</p>
 </section>;
}
