import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLife,advanceYear,advanceToNextDecision,choose,validateLife} from '../lib/engine.ts';
import {storyRecall,storyThreads} from '../lib/narrative.ts';
const country={id:'JPN',name:'日本',population:1000,births:10,lifeFemale:90,lifeMale:88,gdpPpp:40000};
test('jumping preserves yearly settlement and stops at the first unresolved choice',()=>{
 const birth=createLife([country],{seed:57,year:1989,mode:'past',sampling:'births',pace:30});
 const jump=advanceToNextDecision(birth);
 let manual=birth;
 while(!manual.pending&&!manual.ended)manual=advanceYear(manual);
 assert.deepEqual(jump,manual);
 assert.ok(jump.pending);
 assert.equal(advanceToNextDecision(jump),jump);
 assert.equal(jump.settlements.length,jump.age);
 assert.equal(validateLife(jump),true);
});

test('each household opening has a distinct first choice and recalls either branch after a save',()=>{
 const starts=new Map();
 for(let seed=1;seed<=80&&starts.size<3;seed++){
  const life=createLife([country],{seed:seed*374761393>>>0,year:1989,mode:'past',sampling:'births',pace:30});
  const opening=advanceToNextDecision(life);
  if(opening.pending)starts.set(life.story.family.tier,opening);
 }
 assert.equal(starts.size,3);
 assert.equal(new Set([...starts.values()].map(l=>l.pending.title)).size,3);
 for(const opening of starts.values()){
  assert.equal(opening.age,1);
  const results=opening.pending.options.map((option,i)=>{
   const decided=choose(opening,option.id,`opening-${i}`);
   assert.equal(storyThreads(decided)[0].due,3);
   const restored=JSON.parse(JSON.stringify(decided));
   assert.equal(validateLife(restored),true);
   const next=advanceToNextDecision(restored);
   assert.equal(next.age,3);
   assert.ok(storyRecall(next).text.includes(option.label));
   const settled=choose(next,next.pending.options[0].id,`recall-${i}`);
   assert.equal(storyThreads(settled)[0].status,'completed');
   assert.ok(settled.keepsakes.length>0);
   assert.equal(validateLife(settled),true);
   return next.pending.text;
  });
  assert.notEqual(results[0],results[1]);
 }
});
