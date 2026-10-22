import {test} from 'node:test';
import assert from 'node:assert/strict';
import {waitingBirth,revealedBirth,restoreBirthGate,birthIsRevealed} from '../lib/birth-gate.ts';
const options={year:1980,mode:'past',sampling:'population',pace:60};
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
