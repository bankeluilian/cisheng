import type {Life,Option,Stats} from './engine';
import type {CommitmentSpec} from './story-types';
const stats=(Object.keys({health:0,happiness:0,knowledge:0,social:0}) as (keyof Stats)[]);
export function canScheduleOption(l:Life,option:Option){
 const x=option.story,active=l.story?.commitments||[];
 return [x?.risk?.success.commitment,x?.risk?.failure.commitment].every(branch=>new Set([...active.map(p=>p.id),...[x?.commitment,branch].filter((p):p is CommitmentSpec=>!!p).map(p=>p.id)]).size<=6);
}
export function decisionOptions(l:Life,options:Option[]=l.pending?.options||[]):Option[]{
 if(!options.length||options.some(o=>(o.cost||0)<=l.cash&&canScheduleOption(l,o)))return options;
 return [...options,{id:'defer-full-schedule',label:'先完成手头的安排，这次暂缓',hint:'不增加新的安排或支出',effects:{}}];
}
export function scheduleCommitment(l:Life,spec:CommitmentSpec){
 if(!l.story)return false;const active=l.story.commitments||[],index=active.findIndex(p=>p.id===spec.id);
 if(index<0&&active.length>=6)return false;
 const plan={id:spec.id,label:spec.label,remaining:Math.max(1,Math.min(5,Math.round(spec.years))),income:Math.round(spec.income||0),expense:Math.round(spec.expense||0),effects:spec.effects?{...spec.effects}:undefined,startedAge:l.age,lastSettledAge:l.age};
 l.story.commitments=index>=0?active.map((p,i)=>i===index?plan:p):[...active,plan];return true;
}
export function settleCommitments(l:Life){
 const result={income:0,expense:0,notes:[] as string[],completed:[] as string[]};if(l.ended||!l.story?.commitments?.length)return result;
 const labels:Record<keyof Stats,string>={health:'健康',happiness:'幸福',knowledge:'知识',social:'人际'};
 for(const p of l.story.commitments){
  if(l.age<=p.startedAge||l.age<=p.lastSettledAge||p.remaining<=0)continue;
  result.income+=p.income;result.expense+=p.expense;
  const changes:string[]=[];if(p.income)changes.push(`收入${p.income>0?'+':''}${p.income}生活币`);if(p.expense)changes.push(`开销${p.expense>0?'+':''}${p.expense}生活币`);
  for(const key of stats){const delta=p.effects?.[key]||0;if(delta){const before=l.stats[key];l.stats[key]=Math.max(0,Math.min(100,Math.round(before+delta)));const actual=l.stats[key]-before;if(actual)changes.push(`${labels[key]}${actual>0?'+':''}${actual}`);}}
  p.remaining--;p.lastSettledAge=l.age;result.notes.push(`${p.label}：${changes.join('，')||'继续履行安排'}；${p.remaining?`还剩 ${p.remaining} 年`:'这是最后一年'}。`);
  if(p.remaining===0)result.completed.push(p.label);
 }
 l.story.commitments=l.story.commitments.filter(p=>p.remaining>0);return result;
}
