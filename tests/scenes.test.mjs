import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createLife,sceneFor} from '../lib/engine.ts';
import {SCENES,sceneImage} from '../lib/scenes.ts';

const countries=[{id:'JPN',name:'日本',population:1000,births:10,lifeFemale:84,lifeMale:80,gdpPpp:40000}];
const make=()=>createLife(countries,{seed:1234,year:1980,mode:'past',sampling:'births',pace:30});
test('every scene and archive thumbnail in the expanded catalogue has a bundled file',()=>{
 assert.equal(SCENES.length,46);
 for(const scene of SCENES)for(const thumbnail of [false,true])assert.ok(existsSync(new URL('../public'+sceneImage(scene.id,thumbnail),import.meta.url)),`Missing asset for scene ${scene.id}`);
});
test('life stages have distinct scenes outside China, with deterministic visual variation and no fate mutation',()=>{
 const life=make(),before=structuredClone(life);
 const school=sceneFor({...life,age:10});
 const adult=sceneFor({...life,age:30,story:{...life.story,job:'employed'}});
 const retired=sceneFor({...life,age:70,story:{...life.story,job:'retired'}});
 assert.ok(school!==adult&&adult!==retired&&school!==retired);
 const births=new Set(Array.from({length:30},(_,seed)=>sceneFor({...life,seed,age:0})));
 assert.equal(births.size,1);
 assert.equal(sceneFor(life),sceneFor(life));
 assert.deepEqual(life,before);
});
test('the current encounter selects the relevant scene and old encounters do not stick forever',()=>{
 const base={...make(),age:30};
 const pending=id=>({...base,pending:{id:`encounter-${id}-30`,title:'当前遭遇',text:'',options:[]}});
 assert.equal(sceneFor(pending('health-warning')),14);
 assert.equal(sceneFor(pending('small-business')),13);
 assert.equal(sceneFor(pending('vocational-training')),11);
 assert.equal(sceneFor(pending('adult-night-study')),19);
 assert.equal(sceneFor(pending('city-opportunity')),20);
 const recent={id:'sample',age:30,year:2010,title:'总被推后的检查',text:'',kind:'choice'};
 assert.equal(sceneFor({...base,pending:null,events:[...base.events,recent]}),14);
 assert.notEqual(sceneFor({...base,age:31,pending:null,events:[...base.events,recent]}),14);
});
