import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLife,advanceYear,advanceToNextDecision,validateLife} from '../lib/engine.ts';
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
