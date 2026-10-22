import type {Life} from '../lib/engine';
import {statNames} from '../lib/engine';
import type {Stats} from '../lib/engine';
import {followups} from '../lib/encounters';

export default function LifeConsequences({life}:{life:Life}){
 const plans=life.story?.commitments||[],queue=life.story?.queue||[];
 if(!plans.length&&!queue.length)return null;
 return <section className="life-consequences" aria-label="选择带来的后续影响"><div className="consequence-heading"><h3>正在影响我的生活</h3><span>选择，会在以后留下回声</span></div>{plans.length>0&&<ul className="ongoing-plans">{plans.map(p=>{const effects=(Object.keys(statNames) as (keyof Stats)[]).filter(k=>p.effects?.[k]).map(k=>`${statNames[k]}${p.effects![k]!>0?'+':''}${p.effects![k]}`);return <li key={p.id}><div><strong>{p.label}</strong><span>还剩 {p.remaining} 年</span></div><p>每年：{[p.income?`收入${p.income>0?'+':''}${p.income} 生活币`:'',p.expense?`开销${p.expense>0?'+':''}${p.expense} 生活币`:'',...effects].filter(Boolean).join(' · ')||'继续履行安排'}{p.startedAge===life.age?' · 下一年开始':''}</p></li>;})}</ul>}{queue.length>0&&<details className="story-threads"><summary>还有 {queue.length} 件事，等待下文</summary><ul>{queue.map((q,i)=><li key={`${q.id}-${i}`}><span>{followups[q.id]?.title||'之前的安排'}</span><small>{q.due>life.age?`约 ${q.due} 岁时`:'等待合适的时机'} · 条件允许时继续</small></li>)}</ul></details>}</section>;
}
