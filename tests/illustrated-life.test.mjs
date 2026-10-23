import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLife,advanceYear,choose,validateLife,sceneFor} from '../lib/engine.ts';
import * as scenes from '../lib/scenes.ts';
const country=(id,regionId)=>({id,regionId,name:id,population:1000,births:10,lifeFemale:90,lifeMale:90,gdpPpp:30000});
const make=(id='JPN',regionId='EAS',year=1980)=>createLife([country(id,regionId)],{seed:1234,year,mode:'past',sampling:'births',pace:30});

test('birth scenes prioritize country and calendar era, with a safe fallback and no RNG mutation',()=>{
 const early=make(),modern=make('JPN','EAS',2010),china=make('CHN','EAS',1980),before=structuredClone(early);
 assert.notEqual(scenes.birthSceneFor(early),scenes.birthSceneFor(modern));
 assert.notEqual(scenes.birthSceneFor(early),scenes.birthSceneFor(china));
 assert.ok(scenes.birthSceneFor(early)>20);
 const unknown=make('UNKNOWN');unknown.country={...unknown.country,regionId:undefined};
 assert.ok([2,17,18].includes(scenes.birthSceneFor(unknown)));
 assert.deepEqual(early,before);
});
test('new log entries snapshot their scene and stay valid after JSON round trips',()=>{
 let life=make();assert.ok(life.events.every(e=>Number.isInteger(e.scene)));
 const original=structuredClone(life.events);
 for(let i=0;i<9&&!life.ended;i++)life=life.pending?choose(life,life.pending.options.find(o=>(o.cost||0)<=life.cash).id,'scene-'+i):advanceYear(life);
 assert.ok(life.events.every(e=>Number.isInteger(e.scene)));
 assert.deepEqual(life.events.slice(0,original.length),original);
 assert.ok(validateLife(JSON.parse(JSON.stringify(life))));
 assert.equal(validateLife({...life,events:life.events.map((e,i)=>i?e:{...e,scene:999})}),false);
});
test('a completed choice preserves its encounter art even as life and relationships move on',()=>{
 const life=make();life.age=30;life.cash=5000;life.pending={id:'encounter-health-warning-30',title:'总被推后的检查',text:'',options:[{id:'rest',label:'休息',hint:'',effects:{health:4}}]};
 const chosen=choose(life,'rest','health-image');const event=chosen.events.find(e=>e.kind==='choice');
 assert.equal(event.scene,14);
 assert.equal(typeof scenes.entrySceneFor,'function');
 assert.equal(scenes.entrySceneFor({...chosen,age:70,career:'退休',pending:null,people:[]},event),14);
});
test('legacy entries ignore future careers and family and fall back by the event year',()=>{
 assert.equal(typeof scenes.entrySceneFor,'function');
 const life=make(),event={id:'old',age:30,year:2010,title:'平凡的一天',text:'',kind:'ordinary'};
 const first=scenes.entrySceneFor({...life,age:75,career:'退休',focus:'family'},event);
 const other=scenes.entrySceneFor({...life,age:75,career:'学生',focus:'study',people:[],story:{...life.story,job:'school'}},event);
 assert.equal(first,other);
 assert.ok(first>20);
 const legacy={...life,events:life.events.map(({scene,...e})=>e)};assert.equal(validateLife(legacy),true);
});
test('regional everyday scenes advance eras using the current year, not the birth year',()=>{
 const life=make('JPN','EAS',1980);life.story.job='unemployed';life.career='正在寻找工作';life.age=19;life.pending=null;life.events=[];
 const before=sceneFor(life),after=sceneFor({...life,age:20});
 assert.notEqual(before,after);assert.ok(before>20&&after>20);
});
