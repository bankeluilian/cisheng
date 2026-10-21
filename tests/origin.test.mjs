import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createLife,renameLife,validateLife,choose} from '../lib/engine.ts';
import {nameForCountry,localName,nameProfileFor} from '../lib/names.ts';
import {withParentBackground,sectorWeights} from '../lib/family-background.ts';
const countries=JSON.parse(readFileSync(new URL('../public/data/countries.json',import.meta.url))).countries;
const country=id=>countries.find(c=>c.id===id);
const make=(id,seed=1234)=>createLife([country(id)],{seed,year:2026,mode:'present',sampling:'births',pace:30});

test('birthplace selects a name tradition, including Japanese, Korean and regional fallbacks',()=>{
 assert.equal(nameProfileFor(country('JPN'),.3).profile.id,'ja');
 assert.equal(nameProfileFor(country('KOR'),.3).profile.id,'ko');
 assert.equal(nameProfileFor(country('CHN'),.3).profile.id,'zh');
 for(const sex of ['男','女'])for(let i=0;i<40;i++){
  const n=localName(country('JPN'),sex,i);
  assert.match(n.text,/^(佐藤|鈴木|高橋|田中|伊藤|渡辺|山本|中村)/);
  assert.doesNotMatch(n.text,/^(林|陈|许|江|周|温|叶|沈|顾|苏)[舟禾宁遥川言夏安澄原]$/);
 }
 for(const c of countries){const n=localName(c,'女',17);assert.ok(n.text.trim());assert.ok(Array.from(n.text).length<=20,`${c.id}: ${n.text}`);assert.ok(['country','regional'].includes(n.scope));}
 assert.equal(nameProfileFor({id:'UNKNOWN',name:'未知',regionId:'SSF'},.5).scope,'regional');
});

test('all generated name combinations fit the same rename rules, including Icelandic long names',()=>{
 const source=make('ISL',4);
 assert.equal(renameLife(source,'Katrín Sigurðardóttir').name,'Katrín Sigurðardóttir');
 for(const c of countries)for(const sex of ['男','女'])for(let a=0;a<48;a++)for(let b=0;b<6;b++){
  const n=nameForCountry(c,sex,a/48,b/6);
  assert.equal(renameLife(source,n.text).name,n.text,`${c.id}: ${n.text}`);
 }
});

test('new lives persist local names and parents jobs across all 217 economies',()=>{
 for(const c of countries){
  const l=make(c.id);assert.equal(validateLife(l),true,c.id);
  assert.ok(l.nameOrigin?.profile,c.id);
  assert.equal(l.people.filter(p=>p.birthWork).length,2,c.id);
  assert.equal(l.people.filter(p=>p.fullName?.trim()).length,2,c.id);
  assert.deepEqual(JSON.parse(JSON.stringify(l)),make(c.id));
  assert.ok(l.events.some(e=>e.kind==='background'&&e.text.includes('母亲')&&e.text.includes('父亲')),c.id);
 }
});

test('whole birth draws vary birthplace, identity, parents and resources while retaining earlier lives',()=>{
 const before=make('JPN',1234),snapshot=structuredClone(before),results=[];
 for(let seed=1;seed<=80;seed++)results.push(createLife(countries,{seed:seed*31337,year:before.birthYear,mode:before.mode,sampling:before.sampling,pace:before.pace}));
 for(const l of results){assert.equal(validateLife(l),true);assert.ok(l.people.every(p=>p.fullName&&p.birthWork));}
 assert.ok(new Set(results.map(l=>l.country.id)).size>10);
 assert.ok(new Set(results.map(l=>l.name)).size>30);
 assert.ok(new Set(results.map(l=>l.people.map(p=>p.fullName+p.birthWork.title).join('|'))).size>30);
 assert.ok(new Set(results.map(l=>l.story.family.tier)).size===3);
 assert.deepEqual(before,snapshot);
});

test('parent sector sampling follows actual normalized country employment weights and does not assign jobs by gender',()=>{
 const jp=sectorWeights(country('JPN')),ng=sectorWeights(country('NGA'));
 assert.equal(jp.basis,'country');assert.equal(ng.basis,'country');
 assert.ok(jp.weights.services>jp.weights.agriculture);
 assert.ok(ng.weights.agriculture>jp.weights.agriculture);
 const count={agriculture:0,industry:0,services:0};let total=0;
 for(let seed=0;seed<3000;seed++)for(const p of make('JPN',seed).people){const sector=p.birthWork.sector;if(sector!=='none'){count[sector]++;total++;}}
 for(const key of Object.keys(count))assert.ok(Math.abs(count[key]/total-jp.weights[key])<.025,key);
 const mothers=new Set(),fathers=new Set();for(let seed=0;seed<150;seed++)for(const p of make('JPN',seed).people)(p.id==='mother'?mothers:fathers).add(p.birthWork.sector);
 assert.ok(mothers.has('industry')&&fathers.has('services'));
 assert.equal(sectorWeights({id:'UNKNOWN',name:'未知'}).basis,'world');
});

test('legacy background enrichment is deterministic, idempotent and does not change names, money or fate',()=>{
 const legacy=make('JPN');delete legacy.nameOrigin;delete legacy.familyBackground;
 legacy.name='顾舟';for(const p of legacy.people)delete p.birthWork;
 const before=structuredClone(legacy),updated=withParentBackground(legacy);
 assert.deepEqual(legacy,before);assert.equal(updated.name,'顾舟');assert.equal(updated.rng,before.rng);
 assert.equal(updated.cash,before.cash);assert.deepEqual(updated.story,before.story);assert.deepEqual(updated.events,before.events);
 assert.equal(updated.familyBackground.backfilled,true);assert.equal(validateLife(updated),true);
 assert.deepEqual(withParentBackground(updated),updated);
 assert.equal(renameLife(updated,'佐藤 陽菜').name,'佐藤 陽菜');
 assert.equal(validateLife({...updated,people:updated.people.map(p=>({...p,birthWork:{...p.birthWork,sector:'fake'}}))}),false);
});

test('new partner and child names use the birth-country naming system',()=>{
 let l=make('JPN');l.age=30;l.cash=10000;
 l.pending={id:'test-partner',title:'相遇',text:'相遇',options:[{id:'partner',label:'一起',hint:'',effects:{},partner:true}]};
 l=choose(l,'partner','partner-command');
 assert.match(l.people.find(p=>p.role==='伴侣').name,/^(佐藤|鈴木|高橋|田中|伊藤|渡辺|山本|中村)/);
 l.pending={id:'test-child',title:'新生命',text:'新生命',options:[{id:'child',label:'迎接',hint:'',effects:{}}]};
 l=choose(l,'child','child-command');
 assert.match(l.people.find(p=>p.role==='孩子').name,/^(佐藤|鈴木|高橋|田中|伊藤|渡辺|山本|中村)/);
});
