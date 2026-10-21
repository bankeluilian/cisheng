import {test} from 'node:test';
import assert from 'node:assert/strict';
import {samplingDistribution,pickBirthCountry} from '../lib/sampling.ts';
const c=(id,population,births)=>({id,name:id,population,births,lifeFemale:80,lifeMale:76,gdpPpp:25000});
test('chart probabilities use the exact same weights as the actual draw',()=>{
 const data=[c('A',900,10),c('B',100,30)];
 assert.deepEqual(samplingDistribution(data,'births').rows.map(r=>r.probability),[.25,.75]);
 assert.deepEqual(samplingDistribution(data,'population').rows.map(r=>r.probability),[.9,.1]);
 assert.equal(pickBirthCountry(data,'births',.2499).id,'A');assert.equal(pickBirthCountry(data,'births',.25).id,'B');
 assert.equal(pickBirthCountry(data,'population',.89).id,'A');
});
test('zero weights are never drawn even at zero, and all missing data has an explicit uniform fallback',()=>{
 const data=[c('A',0,null),c('B',10,4),c('C',0,0)];
 assert.equal(pickBirthCountry(data,'births',0).id,'B');assert.equal(pickBirthCountry(data,'births',.999999).id,'B');
 const all=[c('A',null,null),c('B',0,0)];assert.equal(samplingDistribution(all,'births').fallback,true);
 assert.deepEqual(samplingDistribution(all,'births').rows.map(r=>r.probability),[.5,.5]);
 assert.throws(()=>pickBirthCountry([],'births',0));
});
test('deterministic evenly spaced draws recover the displayed distribution without RNG side effects',()=>{
 const data=[c('A',600,10),c('B',300,30),c('C',100,60)];const counts={A:0,B:0,C:0};
 for(let i=0;i<10000;i++)counts[pickBirthCountry(data,'births',(i+.5)/10000).id]++;
 assert.deepEqual(counts,{A:1000,B:3000,C:6000});
 assert.ok(Math.abs(samplingDistribution(data,'births').rows.reduce((n,r)=>n+r.probability,0)-1)<1e-12);
});
