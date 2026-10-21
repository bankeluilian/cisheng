import { z } from 'zod';
import {pickBirthCountry} from './sampling.ts';
import {storyChoiceSchema,storySchema} from './story-schema.ts';
import type {StoryChoice,StoryState} from './story-types';
import {ensureStory,advanceStoryYear,nextStoryEncounter,applyStoryChoice} from './story-engine.ts';
export type Country = {id:string;iso2?:string;name:string;region?:string;population:number|null;births:number|null;lifeFemale:number|null;lifeMale:number|null;gdpPpp:number|null;years?:Record<string,number|null>};
export type Stats = {health:number;happiness:number;knowledge:number;social:number};
export type Entry = {id:string;age:number;year:number;title:string;text:string;kind:string};
export type Option = {id:string;label:string;hint:string;effects:Partial<Stats>;cost?:number;career?:string;education?:string;move?:boolean;partner?:boolean;keepsake?:string;story?:StoryChoice};
export type Decision = {id:string;title:string;text:string;options:Option[]};
export type Person = {id:string;name:string;role:string;bond:number;alive:boolean;memory:string;goal:string};
export type Peer = {name:string;country:string;age:number;role:string};
export type Life = {
  version:1;id:string;seed:number;rng:number;mode:string;pace:number;sampling:string;birthYear:number;age:number;
  name:string;sex:string;country:Country;place:string;stats:Stats;cash:number;invested:number;debt:number;
  income:number;expense:number;career:string;education:string;focus:string;ended:boolean;cause:string;
  events:Entry[];pending:Decision|null;people:Person[];peers:Peer[];keepsakes:{name:string;eventId:string}[];
  commands:string[];yearActions:string[];favorites:string[];notes:Record<string,string>;settlements:number[];farewell?:string;story?:StoryState;
};
export const statNames:Record<keyof Stats,string>={health:'健康',happiness:'幸福',knowledge:'知识',social:'人际'};
export const focusNames:Record<string,string>={balance:'顺其自然',study:'学习与探索',career:'工作与积累',family:'陪伴与关系',health:'健康与生活'};
export function renameLife(source:Life,input:string):Life{
  const name=input.trim().replace(/\s+/g,' ');
  if(!name||Array.from(name).length>20||!/^[\p{L}\p{M}\p{N}· .'\-]+$/u.test(name)||name===source.name)return source;
  return {...source,name};
}
const clamp=(x:number)=>Math.max(0,Math.min(100,Math.round(x)));
function rand(l:Life){l.rng=(Math.imul(l.rng,1664525)+1013904223)>>>0;return l.rng/4294967296;}
function pick<T>(l:Life,a:T[]):T{return a[Math.floor(rand(l)*a.length)];}
function log(l:Life,title:string,text:string,kind='ordinary'){
  const e={id:`${l.id}-${l.events.length}`,age:l.age,year:l.birthYear+l.age,title,text,kind};l.events.push(e);return e;
}
function effects(l:Life,e:Partial<Stats>){for(const k of Object.keys(e) as (keyof Stats)[])l.stats[k]=clamp(l.stats[k]+(e[k]||0));}
function weighted(countries:Country[],value:string,r:number){
  return pickBirthCountry(countries,value,r);
}
export function createLife(countries:Country[],o:{seed:number;year:number;mode:string;sampling:string;pace:number}):Life{
  if(!countries.length)throw Error('世界数据尚未准备好');
  const l:Life={version:1,id:`life-${o.seed>>>0}-${o.year}`,seed:o.seed>>>0,rng:o.seed>>>0,mode:o.mode,pace:o.pace,sampling:o.sampling,birthYear:o.year,age:0,name:'',sex:'',country:countries[0],place:'',stats:{health:80,happiness:65,knowledge:5,social:45},cash:0,invested:0,debt:0,income:0,expense:0,career:'尚未入学',education:'学龄前',focus:'balance',ended:false,cause:'',events:[],pending:null,people:[],peers:[],keepsakes:[],commands:[],yearActions:[],favorites:[],notes:{},settlements:[]};
  l.country=weighted(countries,o.sampling,rand(l));l.place=l.country.name;l.sex=rand(l)>.5?'女':'男';
  const surnames=['林','陈','许','江','周','温','叶','沈','顾','苏'];const names=['舟','禾','宁','遥','川','言','夏','安','澄','原'];
  l.name=pick(l,surnames)+pick(l,names);l.stats.health=65+Math.floor(rand(l)*28);l.stats.happiness=50+Math.floor(rand(l)*30);
  l.people=[{id:'mother',name:'母亲',role:'家人',bond:72,alive:true,memory:'第一次把你抱在怀里。',goal:'希望你平安长大。'},{id:'father',name:'父亲',role:'家人',bond:65,alive:true,memory:'为你的到来准备了小床。',goal:'努力维持家里的生活。'}];
  for(let i=0;i<4;i++){const c=weighted(countries,'births',rand(l));l.peers.push({name:pick(l,surnames)+pick(l,names),country:c.name,age:0,role:'同年出生'});}
  log(l,'你来到这个世界',`${o.year} 年，你出生在${l.country.name}。窗外的风，吹动了人生的第一页。`,'milestone');
  ensureStory(l,true);
  return l;
}
export function advanceYear(source:Life):Life{return advanceStoryYear(source);}
export function choose(source:Life,id:string,command:string):Life{
  if(source.ended||!source.pending||source.commands.includes(command))return source;
  const option=source.pending.options.find(o=>o.id===id);if(!option||(option.cost||0)>source.cash)return source;
  const l=structuredClone(source);l.commands.push(command);l.cash-=option.cost||0;effects(l,option.effects);
  if(option.career)l.career=option.career;if(option.education)l.education=option.education;if(option.move)l.place=`${l.country.name} · 新城市`;
  if(option.partner)l.people.push({id:'partner',name:pick(l,['知夏','阿宁','小川','远安']),role:'伴侣',bond:80,alive:true,memory:'决定一起走向未来的那一天。',goal:'想和你拥有彼此照顾的日常。'});
  if(id==='child')l.people.push({id:'child',name:'小禾',role:'孩子',bond:85,alive:true,memory:'你第一次牵起那只小小的手。',goal:'想和你分享每天新发现的事情。'});
  const reflection=l.pending!.id.startsWith('reflection-');
  const e=log(l,l.pending!.title,`你选择了：${option.label}。`,reflection?'reflection':'choice');
  if(option.keepsake)l.keepsakes.push({name:option.keepsake,eventId:e.id});if(!reflection)applyStoryChoice(l,option,e,source);l.pending=reflection?nextStoryEncounter(l):null;return l;
}
export function transact(source:Life,type:'invest'|'withdraw'|'repay',amount:number,command:string):Life{
  if(source.ended||source.age<18||source.commands.includes(command)||!Number.isFinite(amount)||amount<=0||Math.floor(amount)!==amount)return source;
  if(type==='invest'&&source.cash<amount||type==='withdraw'&&source.invested<amount||type==='repay'&&(source.cash<amount||source.debt<amount))return source;
  const l=structuredClone(source);l.commands.push(command);
  if(type==='invest'){l.cash-=amount;l.invested+=amount;}if(type==='withdraw'){l.invested-=amount;l.cash+=amount;}if(type==='repay'){l.cash-=amount;l.debt-=amount;}
  log(l,type==='invest'?'为未来留下一点积蓄':type==='withdraw'?'取回一份积蓄':'偿还一笔欠款',`本次金额 ${amount.toLocaleString()} 生活币。`,'finance');return l;
}
export function act(source:Life,type:string,command:string):Life{
  if(source.ended||source.commands.includes(command)||source.yearActions.includes(type)||(source.story?.energy??3)<=0)return source;
  const costs:Record<string,number>={family:0,learn:source.age<18?0:100,rest:0,treat:400};
  if(!(type in costs)||source.cash<costs[type])return source;
  const l=structuredClone(source);ensureStory(l);l.story!.energy--;l.cash-=costs[type];l.commands.push(command);l.yearActions.push(type);
  const texts:Record<string,[string,string,Partial<Stats>]>= {family:['把时间留给重要的人','你们认真聊了一次，谈起最近的生活。',{social:5,happiness:3}],learn:['学一点新的东西','你开始读一本书，或尝试一个没做过的事情。',{knowledge:5}],rest:['好好休息了一会儿','不必每一天都用来赶路。',{health:3,happiness:3}],treat:['认真照顾身体','你安排了一次检查，并开始调整生活。',{health:8}]};
  const [title,text,e]=texts[type];effects(l,e);log(l,title,text,'action');
  if(type==='family')for(const p of l.people)if(p.alive){p.bond=clamp(p.bond+7);p.memory=`${l.birthYear+l.age} 年，你愿意停下来听我说话。`;}
  return l;
}
const finite=z.number().finite();const nonnegative=finite.min(0).max(1e15);const ageSchema=finite.int().min(0).max(110);const short=z.string().max(120);const statSchema=z.object({health:finite.min(0).max(100),happiness:finite.min(0).max(100),knowledge:finite.min(0).max(100),social:finite.min(0).max(100)}).strict();
const optionSchema=z.object({id:short.min(1),label:short,hint:short,effects:z.object({health:finite.min(-100).max(100).optional(),happiness:finite.min(-100).max(100).optional(),knowledge:finite.min(-100).max(100).optional(),social:finite.min(-100).max(100).optional()}).strict(),cost:nonnegative.optional(),career:short.optional(),education:short.optional(),move:z.boolean().optional(),partner:z.boolean().optional(),keepsake:short.optional(),story:storyChoiceSchema.optional()}).strict();
const lifeSchema=z.object({version:z.literal(1),id:short.min(1),seed:finite.int().min(0).max(4294967295),rng:finite.int().min(0).max(4294967295),mode:z.enum(['present','past','future']),pace:z.union([z.literal(30),z.literal(60),z.literal(90)]),sampling:z.enum(['births','population']),birthYear:finite.int().min(1850).max(2200),age:ageSchema,name:short.min(1),sex:z.enum(['女','男']),country:z.object({id:short.min(1),name:short.min(1),population:nonnegative.nullable(),births:nonnegative.nullable(),lifeFemale:finite.min(0).max(120).nullable(),lifeMale:finite.min(0).max(120).nullable(),gdpPpp:nonnegative.nullable()}).passthrough(),place:short.min(1),stats:statSchema,cash:nonnegative,invested:nonnegative,debt:nonnegative,income:nonnegative,expense:nonnegative,career:short,education:short,focus:z.enum(['balance','study','career','family','health']),ended:z.boolean(),cause:short,events:z.array(z.object({id:short,age:ageSchema,year:finite.int(),title:short,text:z.string().max(1000),kind:short}).strict()).min(1).max(2000),pending:z.object({id:short,title:short,text:z.string().max(1000),options:z.array(optionSchema).min(1).max(8)}).strict().nullable(),people:z.array(z.object({id:short,name:short,role:short,bond:finite.min(0).max(100),alive:z.boolean(),memory:z.string().max(1000),goal:z.string().max(1000)}).strict()).max(20),peers:z.array(z.object({name:short,country:short,age:ageSchema,role:short}).strict()).length(4),keepsakes:z.array(z.object({name:short,eventId:short}).strict()).max(100),commands:z.array(short).max(10000),yearActions:z.array(z.enum(['family','learn','rest','treat'])).max(4),favorites:z.array(short).max(2000),notes:z.record(z.string().regex(/^\d{1,3}$/),z.string().max(500)),settlements:z.array(ageSchema).max(110),farewell:z.string().max(80).optional(),story:storySchema.optional()}).strict();
export function validateLife(v:unknown):v is Life{try{const r=lifeSchema.safeParse(v);if(!r.success)return false;const l=r.data;const ids=new Set(l.events.map(e=>e.id));return (!l.ended||l.pending===null)&&ids.size===l.events.length&&l.events.every(e=>e.age<=l.age&&e.year===l.birthYear+e.age)&&l.keepsakes.every(k=>ids.has(k.eventId))&&l.favorites.every(k=>ids.has(k))&&l.settlements.every(a=>a<=l.age)&&new Set(l.settlements).size===l.settlements.length&&new Set(l.yearActions).size===l.yearActions.length;}catch{return false;}}
export function sceneFor(l:Life){if(l.age<6)return 2;if(l.country.id!=='CHN')return 7;if(l.age<18)return 7;if(l.events.some(e=>e.title==='另一个地方的来信'&&e.text.includes('收拾行李'))&&l.age<30)return 3;if(l.people.some(p=>p.role==='伴侣')&&l.age<60)return 4;return l.age>=65?6:5;}
export function summary(l:Life){const moments=l.events.filter(e=>['choice','milestone','relationship'].includes(e.kind));const chosen=moments.length<=5?moments:Array.from({length:5},(_,i)=>moments[Math.round(i*(moments.length-1)/4)]);return {line:l.age<6?`你在${l.country.name}来到这个世界。短暂的时光里，曾有人轻轻抱起你，认真记住你的名字。`:`在${l.country.name}出生，${l.education==='高等教育'?'曾继续求学，':''}${l.place.includes('新城市')?'也曾勇敢地出发。':'在熟悉与陌生之间，慢慢找到生活的节奏。'}${l.people.some(p=>p.role==='伴侣')?'有人与你相伴，':''}那些平常的日子，也留下了属于你的痕迹。`,moments:chosen};}
