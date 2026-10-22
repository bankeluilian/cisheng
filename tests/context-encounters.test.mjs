import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLife,advanceYear,choose,validateLife} from '../lib/engine.ts';
import {nextStoryEncounter} from '../lib/story-engine.ts';
import {contextEncounters,contextFollowups} from '../lib/context-encounters.ts';
import {scheduleCommitment,canScheduleOption} from '../lib/commitments.ts';
const make=()=>{const l=createLife([{id:'JPN',name:'日本',population:1000,births:10,lifeFemale:90,lifeMale:88,gdpPpp:40000}],{seed:57,year:2026,mode:'present',sampling:'births',pace:30});l.cash=10000;l.stats.health=95;return l;};
const setPending=(l,e)=>{l.pending={id:`test-${e.id}`,title:e.title,text:e.text(l,l.story),options:e.options(l,l.story)};return l;};

test('parent work opens a distinct childhood encounter and its support change updates school opportunities',()=>{
 const e=contextEncounters.find(e=>e.id==='ctx-shift-clock'),l=make();l.age=3;const p=l.people[0];p.birthWork={title:'工厂操作员',sector:'industry',arrangement:'regular',description:'出生时的工作'};p.fullName='田中 春';
 assert.equal(e.when(l,l.story),true);assert.ok(e.text(l,l.story).includes('田中 春'));
 const a=choose(setPending(l,e),'ctx-fixed','family-choice');assert.ok(a.story.schoolQuality<l.story.schoolQuality);assert.equal(validateLife(a),true);
 p.birthWork.sector='agriculture';l.people[1].birthWork.sector='none';assert.equal(e.when(l,l.story),false);
});
test('all six new chains survive saves, mature at the promised age and offer a resolvable consequence',()=>{
 const covered=new Set();
 for(const e of contextEncounters){const l=make();l.age=Math.max(e.min,10);l.story.job=e.id==='ctx-income-bridge'?'unemployed':'employed';l.career='受雇工作者';l.story.family.support=40;l.story.flags.push('left-school');l.people[0].birthWork.arrangement='casual';l.people[1].birthWork.arrangement='self';
  const opt=e.options(l,l.story).find(o=>o.story?.queue);if(!opt)continue;
  let current=choose(setPending(l,e),opt.id,'start');const q=opt.story.queue;assert.equal(validateLife(current),true);current=JSON.parse(JSON.stringify(current));
  for(let turns=0;turns<20&&current.age<l.age+q.after&&!current.ended;turns++){current=current.pending?choose(current,current.pending.options.find(o=>(o.cost||0)<=current.cash&&canScheduleOption(current,o)).id,'tick-'+turns):advanceYear(current);}
  assert.equal(current.ended,false);assert.ok(current.pending?.id.includes(q.id),q.id);assert.equal(validateLife(current),true);
  const follow=current.pending.options.find(o=>(o.cost||0)<=current.cash&&canScheduleOption(current,o));current=choose(current,follow.id,'resolve');assert.equal(current.pending,null);assert.equal(validateLife(current),true);covered.add(q.id);
 }
 assert.deepEqual([...covered].sort(),Object.keys(contextFollowups).sort());
});
test('a full schedule never traps a life at an encounter with only new arrangements',()=>{
 const l=make();l.age=40;l.story.family.support=50;
 for(let i=0;i<6;i++)scheduleCommitment(l,{id:'busy-'+i,label:'已有安排',years:5});
 l.story.queue=[{id:'ctx-family-visits-return',due:40}];l.story.flags.push('ctx-family-visits');
 l.pending=nextStoryEncounter(l);assert.ok(l.pending?.id.includes('ctx-family-visits-return'));
 const free=l.pending.options.find(o=>canScheduleOption(l,o));assert.equal(free.id,'defer-full-schedule');const result=choose(l,free.id,'defer');assert.equal(result.pending,null);assert.equal(validateLife(result),true);
});
test('eligible encounters cannot leave three consecutive years without a choice',()=>{
 for(let seed=1;seed<=30;seed++){const l=make();l.age=26;l.rng=seed;l.story.job='employed';l.story.seen['_last-encounter']=23;assert.ok(nextStoryEncounter(l));}
});

test('a restored pending event with a full schedule still has a safe exit',()=>{
 const l=make();l.age=35;for(let i=0;i<6;i++)scheduleCommitment(l,{id:'existing-'+i,label:'原有安排',years:4});
 l.people.push({id:'partner',name:'伴侣',role:'伴侣',bond:70,alive:true,memory:'相伴',goal:'生活'},{id:'child',name:'孩子',role:'孩子',bond:70,alive:true,memory:'出生',goal:'长大'});
 setPending(l,contextEncounters.find(e=>e.id==='ctx-parenting-roster'));const saved=JSON.parse(JSON.stringify(l));assert.equal(validateLife(saved),true);
 const result=choose(saved,'defer-full-schedule','restored-exit');assert.equal(result.pending,null);assert.equal(result.story.commitments.length,6);assert.equal(validateLife(result),true);
});
test('delayed job-related followups respect retirement rather than reopening a formal job',()=>{
 for(const id of ['ctx-income-bridge-return','ctx-evening-study-return']){
  const l=make();l.age=65;l.story.job='retired';l.career='退休';l.story.flags.push(id.includes('bridge')?'ctx-bridge-work':'ctx-evening-study');
  const e=contextFollowups[id];assert.equal(e.when(l,l.story),true);const options=e.options(l,l.story);
  for(const o of options){assert.notEqual(o.story?.job,'employed');assert.notEqual(o.story?.risk?.success.job,'employed');assert.notEqual(o.story?.risk?.failure.job,'employed');const result=choose(setPending(structuredClone(l),e),o.id,'retired');assert.equal(result.story.job,'retired');assert.equal(result.career,'退休');assert.equal(validateLife(result),true);}
 }
});
