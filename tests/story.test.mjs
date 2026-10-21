import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLife,advanceYear,choose,act,validateLife} from '../lib/engine.ts';
import {encounters} from '../lib/encounters.ts';
const country=(gdpPpp)=>({id:'TEST',name:'验证地区',population:1000,births:10,lifeFemale:80,lifeMale:76,gdpPpp});
const make=(seed=456,gdp=25000)=>createLife([country(gdp)],{seed,year:2026,mode:'present',sampling:'births',pace:30});
test('the same family seed in different environments changes opportunities and resources',()=>{
 const a=make(456,2000),b=make(456,70000);
 assert.equal(a.story.family.tier,b.story.family.tier);
 assert.ok(a.story.opportunity<b.story.opportunity);assert.ok(a.story.schoolQuality<b.story.schoolQuality);assert.ok(a.cash<b.cash);
 assert.equal(validateLife(a),true);assert.equal(validateLife(b),true);
});
test('an old pending decision survives migration and already recorded facts are retained',()=>{
 const a=make();delete a.story;a.pending={id:'legacy',title:'旧的选择',text:'仍然等待回答',options:[{id:'keep',label:'继续',hint:'',effects:{knowledge:2}}]};
 assert.equal(validateLife(a),true);assert.deepEqual(advanceYear(a),a);
 const b=choose(a,'keep','legacy-command');assert.ok(b.story);assert.deepEqual(b.events.slice(0,a.events.length),a.events);assert.equal(b.rng,a.rng);assert.equal(b.id,a.id);assert.equal(validateLife(b),true);
});
test('one year has only three discretionary actions',()=>{
 let l=make();l.cash=10000;for(const a of ['family','learn','rest'])l=act(l,a,a);assert.equal(l.story.energy,0);assert.deepEqual(act(l,'treat','fourth'),l);
});
test('a legacy college student graduates at the former expected age after migration',()=>{
 let l=make(55);delete l.story;l.age=20;l.education='高等教育';l.career='学生';const facts=structuredClone(l.events);
 while(l.age<22&&!l.ended)l=l.pending?choose(l,l.pending.options.find(o=>(o.cost||0)<=l.cash).id,'legacy-'+l.age):advanceYear(l);
 assert.equal(l.story.seen['_education-start'],18);assert.notEqual(l.story.job,'school');assert.deepEqual(l.events.slice(0,facts.length),facts);assert.equal(validateLife(l),true);
});
test('a scholarship application submitted at 17 still receives its result at 18',()=>{
 let l=make(42);l.age=17;l.education='中等教育';l.career='学生';l.story.job='school';l.story.schoolQuality=.6;l.cash=1000;
 const e=encounters.find(e=>e.id==='scholarship-preparation');l.pending={id:'encounter-scholarship-preparation-17',title:e.title,text:e.text(l,l.story),options:e.options(l,l.story)};
 l=choose(l,'prepare','application');assert.ok(l.story.queue.some(q=>q.id==='scholarship-result'));
 l=advanceYear(l);assert.equal(l.age,18);assert.ok(l.pending?.id.includes('scholarship-result'));assert.equal(validateLife(l),true);
});
test('training has a persisted cross-year followup rather than an immediate cosmetic reward',()=>{
 let l=make(87);l.age=24;l.cash=5000;l.story.job='unemployed';l.career='正在寻找工作';
 const e=encounters.find(e=>e.id==='skills-course');
 const training=e||encounters.find(e=>e.options(l,l.story).some(o=>o.story?.queue?.id==='training-offer'));
 assert.ok(training);l.pending={id:'encounter-training-24',title:training.title,text:training.text(l,l.story),options:training.options(l,l.story)};
 const option=l.pending.options.find(o=>o.story?.queue?.id==='training-offer');assert.ok(option);
 l=choose(l,option.id,'train');assert.ok(l.story.queue.some(q=>q.id==='training-offer'&&q.due===26));
 l=JSON.parse(JSON.stringify(l));assert.equal(validateLife(l),true);
 while(l.age<26&&!l.ended)l=l.pending?choose(l,l.pending.options.find(o=>(o.cost||0)<=l.cash).id,'next-'+l.age):advanceYear(l);
 assert.equal(l.age,26);assert.ok(l.pending?.id.includes('training-offer'));
 assert.equal(l.story.queue.some(q=>q.id==='training-offer'),false);
 const resolved=choose(l,l.pending.options[0].id,'resolve');assert.ok(resolved.story.lastOutcome.text.length>10);assert.equal(validateLife(resolved),true);
});
test('different seeds create different encounter histories; every intermediate state remains importable',()=>{
 const histories=new Set();const titles=new Set();
 for(let seed=1;seed<=16;seed++){
  let l=make(seed);const trace=[];
  for(let i=0;i<230&&!l.ended;i++){
   if(l.pending){trace.push(l.pending.id);titles.add(l.pending.title);const option=l.pending.options.find(o=>(o.cost||0)<=l.cash);assert.ok(option,'every encounter needs an affordable choice');l=choose(l,option.id,`command-${i}`);}else l=advanceYear(l);
   assert.equal(validateLife(l),true,`invalid state seed=${seed}, age=${l.age}`);assert.ok(l.cash>=0&&l.debt>=0&&l.invested>=0);assert.equal(new Set(l.settlements).size,l.settlements.length);
  }
  assert.ok(l.ended);histories.add(trace.join('|'));
 }
 assert.ok(histories.size>=14);assert.ok(titles.size>=25,`only ${titles.size} encounter titles appeared`);
});
