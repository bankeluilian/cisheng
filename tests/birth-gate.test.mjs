import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as birthGate from '../lib/birth-gate.ts';
import {waitingBirth,revealedBirth,restoreBirthGate,birthIsRevealed} from '../lib/birth-gate.ts';
const options={year:1980,mode:'past',sampling:'population',pace:60};
test('birth year draws include 1966 and 2026 with equal allocation across all 61 years',()=>{
 assert.equal(typeof birthGate.drawBirthYear,'function');
 assert.equal(birthGate.drawBirthYear(()=>0),1966);
 assert.equal(birthGate.drawBirthYear(()=>60),2026);
 const counts=new Map();
 for(let draw=0;draw<610;draw++){
  const year=birthGate.drawBirthYear(()=>draw);
  assert.ok(year>=1966&&year<=2026);
  counts.set(year,(counts.get(year)||0)+1);
 }
 assert.equal(counts.size,61);
 assert.ok([...counts.values()].every(count=>count===10));
});
test('birth year draws retry excess entropy rather than biasing the earliest years',()=>{
 let attempts=0;
 assert.equal(typeof birthGate.drawBirthYear,'function');
 assert.equal(birthGate.drawBirthYear(()=>++attempts===1?4294967295:60),2026);
 assert.equal(attempts,2);
});
test('a new birth is empty and holds only settings until an explicit draw',()=>{
 const gate=waitingBirth(options);assert.deepEqual(gate,{stage:'waiting',options});
 assert.equal(birthIsRevealed(gate,{id:'old-life',name:'旧姓名',country:{name:'日本'}}),false);
 assert.equal('name' in gate,false);assert.equal('country' in gate,false);assert.equal('people' in gate,false);
 assert.deepEqual(restoreBirthGate(JSON.stringify(gate),'old-life'),gate);
});
test('refresh restores the explicitly revealed life and never exposes a different save',()=>{
 const gate=revealedBirth('new-life');assert.equal(birthIsRevealed(gate,{id:'new-life'}),true);
 assert.equal(birthIsRevealed(gate,{id:'old-life'}),false);assert.equal(birthIsRevealed(gate,null),false);
 assert.deepEqual(restoreBirthGate(JSON.stringify(gate),'new-life'),gate);
 assert.equal(restoreBirthGate(JSON.stringify(gate),'old-life').stage,'waiting');
});
test('first visit, legacy state and malformed session data all start with an empty birth',()=>{
 for(const value of [null,'broken','{}','{"stage":"revealed"}','{"stage":"waiting","options":{"year":1}}'])assert.equal(restoreBirthGate(value,'old-life').stage,'waiting');
});
