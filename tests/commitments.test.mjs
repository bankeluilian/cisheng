import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLife,advanceYear,choose,validateLife} from '../lib/engine.ts';
import {scheduleCommitment,settleCommitments,canScheduleOption} from '../lib/commitments.ts';
const country={id:'JPN',name:'日本',population:1000,births:10,lifeFemale:90,lifeMale:88,gdpPpp:40000};
const make=()=>{const l=createLife([country],{seed:57,year:2026,mode:'present',sampling:'births',pace:30});l.age=25;l.story.job='employed';l.career='受雇工作者';l.cash=10000;return l;};
const plan={id:'test-evening',label:'三年夜校',years:3,income:0,expense:250,effects:{knowledge:3,health:-1}};

test('a multi-year commitment starts next year, survives JSON and settles exactly its promised years',()=>{
 const l=make(),rng=l.rng;scheduleCommitment(l,plan);assert.equal(l.rng,rng);
 assert.equal(settleCommitments(l).expense,0);assert.equal(l.story.commitments[0].remaining,3);
 const copy=JSON.parse(JSON.stringify(l));assert.equal(validateLife(copy),true);
 for(let age=26;age<=28;age++){
  copy.age=age;const before=copy.stats.knowledge,r=settleCommitments(copy);
  assert.equal(r.expense,250);assert.equal(copy.stats.knowledge,before+3);
  const twice=settleCommitments(copy);assert.equal(twice.expense,0);assert.equal(copy.stats.knowledge,before+3);
 }
 assert.equal(copy.story.commitments.length,0);copy.age=29;assert.equal(settleCommitments(copy).expense,0);
});
test('choice installs an ongoing plan and annual money changes actually reach the ledger',()=>{
 let source=make();source.pending={id:'test-plan',title:'夜校',text:'安排',options:[{id:'yes',label:'报名',hint:'',effects:{},cost:0,story:{commitment:plan}},{id:'no',label:'暂缓',hint:'',effects:{}}]};
 const accepted=choose(source,'yes','plan-command'),declined=choose(source,'no','plan-command');
 assert.equal(accepted.story.commitments[0].remaining,3);assert.equal(accepted.cash,source.cash);
 const a=advanceYear(accepted),b=advanceYear(declined);
 assert.equal(a.age,26);assert.equal(a.expense,b.expense+250);assert.equal(a.cash-b.cash,(a.income-b.income)-(a.expense-b.expense));
 assert.ok(a.stats.knowledge>=b.stats.knowledge+3);assert.equal(validateLife(a),true);
 assert.ok(a.events.some(e=>e.kind==='commitment'&&e.text.includes('250')));
});
test('same plan refreshes instead of stacking and a full schedule leaves a free alternative',()=>{
 const l=make();scheduleCommitment(l,plan);scheduleCommitment(l,{...plan,years:2});assert.equal(l.story.commitments.length,1);assert.equal(l.story.commitments[0].remaining,2);
 for(let i=1;i<6;i++)scheduleCommitment(l,{...plan,id:'test-'+i});
 const extra={id:'extra',label:'新增',hint:'',effects:{},story:{commitment:{...plan,id:'extra'}}};
 assert.equal(canScheduleOption(l,extra),false);assert.equal(canScheduleOption(l,{id:'free',label:'暂缓',hint:'',effects:{}}),true);
 assert.equal(canScheduleOption(l,{...extra,story:{commitment:plan}}),true);
});
test('legacy saves gain no commitments and malformed imported plans are rejected',()=>{
 const l=make();delete l.story.commitments;assert.equal(validateLife(l),true);assert.deepEqual(settleCommitments(l),{income:0,expense:0,notes:[],completed:[]});
 scheduleCommitment(l,plan);const bad=structuredClone(l);bad.story.commitments[0].remaining=-2;assert.equal(validateLife(bad),false);
});
