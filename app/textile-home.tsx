import {ArrowDown,ArrowUpRight,ArrowRight,Info,RefreshCw} from 'lucide-react';
import type {Country} from '../lib/engine';
import BirthProbability from './birth-probability';
import TextileIcon from './textile-icon';
import {assetUrl} from '../lib/web-hosting';

type Props={countries:Country[];sampling:string;pace:number;ready:boolean;busy:boolean;hasSave:boolean;error:string;onSampling:(value:string)=>void;onPace:(value:number)=>void;onStart:()=>void;onContinue:()=>void;onRules:()=>void};
const chapters=[
 {image:'birth',icon:'home' as const,title:'世界的某个角落',text:'一个名字，一个家庭。按下之后，才知道故事从哪里开始。'},
 {image:'school',icon:'book' as const,title:'慢慢长成自己',text:'上学、认识朋友，第一次认真想一想，自己想走的路。'},
 {image:'station',icon:'luggage' as const,title:'去往新的生活',text:'去远方，或留下来。每个决定，都有值得牵挂的东西。'},
 {image:'work',icon:'briefcase' as const,title:'把日子过下去',text:'工作、学习、经营一间小店，也给自己留一点喘息的时间。'},
 {image:'family',icon:'heart' as const,title:'有人与你相伴',text:'陪伴也需要时间。那些见过的面，说过的话，会留下回声。'},
 {image:'garden',icon:'flower' as const,title:'留下一生的痕迹',text:'在故事结束后，把遇见的人、走过的路，织进一张人生卡片。'},
];
export default function TextileHome(p:Props){
 return <div className="textile-home">
  <section className="textile-hero" aria-labelledby="home-title">
   <div className="textile-hero-copy">
    <span className="eyebrow"><TextileIcon name="leaf"/>此生 · 随机人生模拟</span>
    <h1 id="home-title">如果重来，<br/>你会是谁？</h1>
    <div className="thread-flourish" aria-hidden="true"><span/><TextileIcon name="leaf"/><span/></div>
    <p>你会出生在哪里，成为谁的孩子？</p>
    <div className="textile-start">
     <button className="btn primary" disabled={!p.ready||!p.countries.length||p.busy} onClick={p.onStart}>
      <span>开始人生模拟</span><ArrowUpRight size={20} aria-hidden="true"/>
     </button>
     <button className="btn secondary" onClick={p.onContinue}>
      <span>{p.hasSave?'继续上次的人生':'翻开人生档案'}</span><ArrowRight size={20} aria-hidden="true"/>
     </button>
    </div>
    <span className="textile-hero-footnote">起点交给随机，接下来的人生由你一步步选择。</span>
    <a className="text-link textile-guide-link" href="#home-guide" onClick={e=>{
     const guide=document.getElementById('home-guide');
     if(!guide)return;
     e.preventDefault();
     guide.focus({preventScroll:true});
     guide.scrollIntoView({block:'start'});
    }}>查看使用指南 <ArrowDown size={15} aria-hidden="true"/></a>
   </div>
   <figure className="textile-hero-art"><img src={assetUrl('/images/textile/hero.webp')} alt="线绣成的家、学校、河流与列车，一位旅人走向新的生活" fetchPriority="high" width={1600} height={900}/><figcaption>平常的日子，也能织成独一无二的一生。</figcaption></figure>
  </section>
  <section className="textile-odds" id="birth-odds"><BirthProbability countries={p.countries} method={p.sampling} onMethodChange={p.onSampling}/></section>
  <section className="textile-settings" aria-label="人生开局设置"><div><TextileIcon name="calendar"/><span><small>出生年份也交给命运</small><strong>1966—2026 随机出生</strong></span></div><label><TextileIcon name="globe"/><span><small>命运从哪里开始</small><select aria-label="出生抽样方式" value={p.sampling} onChange={e=>p.onSampling(e.target.value)}><option value="births">按全球出生人数随机</option><option value="population">按全球人口随机</option></select></span></label><label><TextileIcon name="sun"/><span><small>自动播放的基础节奏</small><select aria-label="人生基础节奏" value={p.pace} onChange={e=>p.onPace(Number(e.target.value))}><option value={30}>轻快 · 1× 每年 20 秒</option><option value={60}>舒缓 · 1× 每年 40 秒</option><option value={90}>慢读 · 1× 每年 60 秒</option></select></span></label></section>
  <div className="textile-data-note"><span role={p.error?'alert':undefined}>{p.error||`以 ${p.countries.length||'…'} 个经济体的世界资料为起点 · 每次出生独立随机`}</span><button className="text-link" onClick={p.onRules}><Info size={15}/>关于这场人生模拟</button></div>
  <section className="textile-guide" id="home-guide" aria-labelledby="home-guide-title" tabIndex={-1}>
   <header>
    <TextileIcon name="book"/>
    <h2 id="home-guide-title">使用指南</h2>
    <p>第一次玩，可以从这四步开始。</p>
   </header>
   <ol className="textile-guide-steps" role="list">
    <li>
     <span className="textile-guide-number" aria-hidden="true">01</span>
     <div><h3>抽取你的出生</h3><p>点「开始人生模拟」，再点「抽取我的出生」。出生地、年份、姓名和家庭会一起揭晓，点「开始这一生」进入故事。</p></div>
    </li>
    <li>
     <span className="textile-guide-number" aria-hidden="true">02</span>
     <div><h3>走到下一个故事</h3><p>读完遭遇，选择你想怎么做。点「下一个故事」跳到下一次抉择，想逐年体验也可以点「只走一年」。</p></div>
    </li>
    <li>
     <span className="textile-guide-number" aria-hidden="true">03</span>
     <div><h3>留下信封和车票</h3><p>给搬走的同桌留下地址，多年后可能收到回信。遇到远方的工作机会并选择搬迁，就能留下一张车票。</p></div>
    </li>
    <li>
     <span className="textile-guide-number" aria-hidden="true">04</span>
     <div><h3>重读走过的一生</h3><p>进度自动保存在当前浏览器，随时能在人生档案里继续。走完后可保存人生总结卡，也可以到前世之家查看收下的纪念物。</p></div>
    </li>
   </ol>
  </section>
  <section className="textile-chapters"><header><TextileIcon name="book"/><span className="eyebrow">从第一声啼哭，到最后一页小记</span><h2>人生，是一件慢慢织成的事。</h2><p>有些选择当时很小，很多年后才知道，它改变了什么。</p></header><div className="textile-chapter-grid">{chapters.map((c,i)=><article key={c.image}><figure><img src={assetUrl(`/images/textile/${c.image}.webp`)} alt={c.title} loading="lazy" width={512} height={512}/><span>0{i+1}</span></figure><div><TextileIcon name={c.icon}/><h3>{c.title}</h3><p>{c.text}</p></div></article>)}</div></section>
  <section className="textile-last-page"><TextileIcon name="flower"/><h2>这一次，你会怎样走过一生？</h2><p>没有统一的答案。你走过的路，会留在这里。</p><button className="btn primary" disabled={!p.ready||!p.countries.length||p.busy} onClick={p.onStart}>翻开我的第一页 <RefreshCw size={18}/></button></section>
 </div>;
}
