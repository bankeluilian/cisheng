import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLife, advanceYear, choose, transact, act, validateLife, renameLife } from '../lib/engine.ts';

const countries = [{id:'CHN',name:'中国',population:1000,births:10,lifeFemale:80,lifeMale:76,gdpPpp:25000}];
const make = () => createLife(countries,{seed:1234,year:2020,mode:'present',sampling:'births',pace:30});
test('renaming persists the identity while leaving fate and existing facts untouched',()=>{
  const a=make();const b=renameLife(a,'  余泽  ');
  assert.equal(b.name,'余泽');assert.equal(b.id,a.id);assert.equal(b.rng,a.rng);
  assert.deepEqual(b,{...a,name:'余泽'});assert.equal(validateLife(b),true);
  assert.deepEqual(renameLife(a,'   '),a);assert.deepEqual(renameLife(a,'<script>'),a);
  assert.deepEqual(renameLife(a,'很'.repeat(31)),a);
  assert.equal(renameLife({...a,ended:true},'另一个名字').name,'另一个名字');
});
test('same seed and actions reproduce the entire life',()=>{
  let a=make(), b=make();
  for(let i=0;i<90;i++){
    a=a.pending?choose(a,a.pending.options.find(o=>(o.cost||0)<=a.cash).id,'a'+i):advanceYear(a);
    b=b.pending?choose(b,b.pending.options.find(o=>(o.cost||0)<=b.cash).id,'a'+i):advanceYear(b);
  }
  assert.deepEqual(a,b);
});
test('a pending choice blocks the clock and a command settles only once',()=>{
  let a=make(); while(!a.pending && !a.ended)a=advanceYear(a);
  assert.deepEqual(advanceYear(a),a);
  const b=choose(a,a.pending.options.find(o=>(o.cost||0)<=a.cash).id,'unique');
  assert.deepEqual(choose(b,a.pending.options.find(o=>(o.cost||0)<=a.cash).id,'unique'),b);
});
test('investment moves funds, rejection and repeat commands cannot create money',()=>{
  let a=make(); a={...a,age:25,cash:1000};
  const b=transact(a,'invest',400,'one');
  assert.equal(b.cash,600); assert.equal(b.invested,400);
  assert.deepEqual(transact(b,'invest',400,'one'),b);
  assert.deepEqual(transact(b,'invest',10000,'two'),b);
  const c=transact(b,'withdraw',400,'three');
  assert.equal(c.cash,1000);assert.equal(c.invested,0);
});
test('stats stay bounded, interactions have one yearly settlement, dead lives stop',()=>{
  const a=make(); const b=act(a,'family','once');
  assert.deepEqual(act(b,'family','twice'),b);
  const dead={...b,ended:true,pending:null};assert.deepEqual(advanceYear(dead),dead);
  let c=make();for(let i=0;i<240&&!c.ended;i++)c=c.pending?choose(c,c.pending.options.find(o=>(o.cost||0)<=c.cash).id,'c'+i):advanceYear(c);
  for(const v of Object.values(c.stats))assert.ok(v>=0&&v<=100);
  assert.ok(c.ended);assert.equal(validateLife(c),true);
});
test('reject malformed imported state',()=>{
  assert.equal(validateLife({version:1}),false);
  assert.equal(validateLife({...make(),cash:NaN}),false);
  assert.equal(validateLife({...make(),stats:{health:500}}),false);
  const missing=make();delete missing.place;assert.equal(validateLife(missing),false);
  assert.equal(validateLife({...make(),peers:[null]}),false);
  assert.equal(validateLife({...make(),keepsakes:[{name:4}]}),false);
  assert.equal(validateLife({...make(),notes:{'0':{text:'bad'}}}),false);
  assert.equal(validateLife({...make(),pending:{id:'bad',title:'bad',text:'bad',options:[]}}),false);
});
