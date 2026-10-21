import { z } from 'zod';
export type Country = {id:string;iso2?:string;name:string;region?:string;population:number|null;births:number|null;lifeFemale:number|null;lifeMale:number|null;gdpPpp:number|null;years?:Record<string,number|null>};
export type Stats = {health:number;happiness:number;knowledge:number;social:number};
export type Entry = {id:string;age:number;year:number;title:string;text:string;kind:string};
export type Option = {id:string;label:string;hint:string;effects:Partial<Stats>;cost?:number;career?:string;education?:string;move?:boolean;partner?:boolean;keepsake?:string};
export type Decision = {id:string;title:string;text:string;options:Option[]};
export type Person = {id:string;name:string;role:string;bond:number;alive:boolean;memory:string;goal:string};
export type Peer = {name:string;country:string;age:number;role:string};
export type Life = {
  version:1;id:string;seed:number;rng:number;mode:string;pace:number;sampling:string;birthYear:number;age:number;
  name:string;sex:string;country:Country;place:string;stats:Stats;cash:number;invested:number;debt:number;
  income:number;expense:number;career:string;education:string;focus:string;ended:boolean;cause:string;
  events:Entry[];pending:Decision|null;people:Person[];peers:Peer[];keepsakes:{name:string;eventId:string}[];
  commands:string[];yearActions:string[];favorites:string[];notes:Record<string,string>;settlements:number[];farewell?:string;
};
export const statNames:Record<keyof Stats,string>={health:'健康',happiness:'幸福',knowledge:'知识',social:'人际'};
export const focusNames:Record<string,string>={balance:'顺其自然',study:'学习与探索',career:'工作与积累',family:'陪伴与关系',health:'健康与生活'};
const clamp=(x:number)=>Math.max(0,Math.min(100,Math.round(x)));
function rand(l:Life){l.rng=(Math.imul(l.rng,1664525)+1013904223)>>>0;return l.rng/4294967296;}
function pick<T>(l:Life,a:T[]):T{return a[Math.floor(rand(l)*a.length)];}
function log(l:Life,title:string,text:string,kind='ordinary'){
  const e={id:`${l.id}-${l.events.length}`,age:l.age,year:l.birthYear+l.age,title,text,kind};l.events.push(e);return e;
}
function effects(l:Life,e:Partial<Stats>){for(const k of Object.keys(e) as (keyof Stats)[])l.stats[k]=clamp(l.stats[k]+(e[k]||0));}
function weighted(countries:Country[],value:string,r:number){
  const weights=countries.map(c=>Math.max(0,(value==='population'?c.population:c.births)||0));
  const sum=weights.reduce((a,b)=>a+b,0);if(!sum)return countries[Math.floor(r*countries.length)];
  let n=r*sum;for(let i=0;i<countries.length;i++){n-=weights[i];if(n<=0)return countries[i];}return countries[countries.length-1];
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
  return l;
}
function decision(l:Life):Decision|null{
  const d=(title:string,text:string,options:Option[])=>({id:`decision-${l.age}`,title,text,options});
  if(l.age===6)return d('第一次走进教室','课本有纸张的气味，窗外传来孩子们的声音。你想怎样认识这个世界？',[
    {id:'curious',label:'带着好奇，认真学习',hint:'知识 +12 · 幸福 +2',effects:{knowledge:12,happiness:2},education:'基础教育',career:'学生'},
    {id:'friends',label:'先交几个新朋友',hint:'人际 +12 · 知识 +5',effects:{social:12,knowledge:5},education:'基础教育',career:'学生',keepsake:'一张折角的班级合照'}]);
  if(l.age===15)return d('属于你的方向','升学、手艺、和眼前的生活，都是一条可以走下去的路。',[
    {id:'school',label:'继续读书，看看更远的世界',hint:'知识 +14 · 幸福 −3',effects:{knowledge:14,happiness:-3},education:'中等教育'},
    {id:'craft',label:'学一门可以依靠的手艺',hint:'知识 +7 · 人际 +6',effects:{knowledge:7,social:6},education:'职业教育',career:'学徒'}]);
  if(l.age===18)return d('站在新的路口','你开始有了决定自己日常的权利，也开始承担选择的分量。',[
    {id:'university',label:'继续求学',hint:'知识 +18 · 未来收入机会增加',effects:{knowledge:18,happiness:2},education:'高等教育',career:'学生'},
    {id:'work',label:'走进工作，独立生活',hint:'人际 +7 · 开始积累收入',effects:{social:7,knowledge:4},career:'初入职场'},
    {id:'explore',label:'留一年时间探索自己',hint:'幸福 +9 · 知识 +6',effects:{happiness:9,knowledge:6},career:'自由探索',keepsake:'一本写满地名的笔记'}]);
  if(l.age===25)return d('另一个地方的来信','一个新的工作机会，来自你还不熟悉的城市。留下和出发，都有自己的牵挂。',[
    {id:'move',label:'收拾行李，去新的城市',hint:'知识 +7 · 人际 −5 · 花费 300',cost:300,effects:{knowledge:7,social:-5},move:true,career:'专业工作者',keepsake:'一张出发的车票'},
    {id:'stay',label:'留下来，把日子慢慢过好',hint:'幸福 +6 · 人际 +6',effects:{happiness:6,social:6},career:'本地工作者'}]);
  if(l.age===30&&!l.people.some(p=>p.role==='伴侣'))return d('有人想与你一起走','你们聊起未来时，第一次不再只用“我”这个字。',[
    {id:'together',label:'认真经营这段关系',hint:'幸福 +10 · 人际 +9',effects:{happiness:10,social:9},partner:true,keepsake:'两个人一起挑选的小杯子'},
    {id:'alone',label:'继续独自生活，也珍惜相遇',hint:'幸福 +4 · 知识 +4',effects:{happiness:4,knowledge:4}}]);
  if(l.age===36&&l.people.some(p=>p.role==='伴侣'))return d('关于一个新生命','你们谈起是否愿意照顾一个孩子。这不是生活必须完成的任务。',[
    {id:'child',label:'迎接一个新的家人',hint:'人际 +12 · 每年生活支出增加',effects:{social:12,happiness:7}},
    {id:'two',label:'珍惜两个人的生活',hint:'幸福 +8 · 健康 +3',effects:{happiness:8,health:3}}]);
  if(l.age===50)return d('走到人生中途','你已熟悉许多道路。此刻，你更想把时间交给什么？',[
    {id:'slow',label:'慢下来，多陪陪身边的人',hint:'幸福 +9 · 人际 +8',effects:{happiness:9,social:8}},
    {id:'dream',label:'重拾一直想做的事',hint:'知识 +10 · 幸福 +8',effects:{knowledge:10,happiness:8},keepsake:'一封写给年轻自己的信'}]);
  if(l.age>=40&&l.age%13===0)return d('身体给你一个提醒','最近容易疲倦。你可以安排检查，也可以先调整生活。',[
    {id:'care',label:'接受检查，好好照顾自己',hint:'健康 +12 · 花费 450',effects:{health:12},cost:450},
    {id:'rest',label:'先停下来，规律休息',hint:'健康 +5 · 幸福 +3',effects:{health:5,happiness:3}}]);
  return null;
}
export function advanceYear(source:Life):Life{
  if(source.ended||source.pending)return source;const l=structuredClone(source);l.age++;l.yearActions=[];
  const old=l.age>55;effects(l,{health:(old?-2:0)+(rand(l)>.5?1:-1),happiness:rand(l)>.5?1:-1,knowledge:l.age<22?2:0,social:rand(l)>.65?1:-1});
  const f=l.focus;if(f==='health')effects(l,{health:3,happiness:1});if(f==='study')effects(l,{knowledge:3,happiness:1});if(f==='family')effects(l,{social:3,happiness:2});if(f==='career')effects(l,{knowledge:1,happiness:-1});
  if(l.age===22&&l.career==='学生')l.career='专业工作者';if(l.age===65)l.career='退休';
  const working=l.age>=18&&l.age<65&&l.career!=='学生'&&l.career!=='自由探索';
  l.income=working?Math.round((1100+l.stats.knowledge*22)*(f==='career'?1.28:1)):l.age>=65?850:0;
  l.expense=l.age>=18?Math.round(720+(l.people.some(p=>p.role==='孩子')?330:0)):0;
  const growth=(rand(l)-.37)*.16;const investmentChange=Math.round(l.invested*growth);l.invested=Math.max(0,l.invested+investmentChange);
  const balance=l.income-l.expense;
  if(balance>=0){const repay=Math.min(l.debt,balance);l.debt-=repay;l.cash+=balance-repay;}
  else{const use=Math.min(l.cash,-balance);l.cash-=use;l.debt+=-balance-use;}
  l.debt=Math.round(l.debt*1.02);l.settlements.push(l.age);
  for(const p of l.people){if(p.alive&&p.role==='家人'&&l.age>40&&rand(l)<.025){p.alive=false;p.memory=`${l.birthYear+l.age} 年，你们最后一次认真告别。`;log(l,`与${p.name}告别`,'那些曾经习以为常的声音，后来都成了想念。','relationship');effects(l,{happiness:-8});}if(p.alive)p.bond=clamp(p.bond-(f==='family'?0:1));}
  const ordinary=[['一个平常的日子','日子并不总有大事发生。你记得一顿热饭，和窗边刚好落下的阳光。'],['学会了一件小事','你在生活里学到一点新的本领，慢慢有了自己的判断。'],['偶然的重逢','你和一个熟人聊了很久。彼此的生活，都在悄悄变化。'],['走过熟悉的路','街角有了一家新店。你忽然意识到，自己也比去年长大了一岁。'],['留一点时间给自己','你把手边的事情放下，认真看了一会儿天空。']];
  if(l.age===65)log(l,'把时间还给生活','工作的章节暂时合上，你开始重新安排每一天。','milestone');
  else{const e=pick(l,ordinary);log(l,e[0],e[1]);}
  const expectancy=(l.sex==='女'?l.country.lifeFemale:l.country.lifeMale)||72;
  const hazard=l.age<5?.0015:l.age<40?.00035:Math.min(.65,.0015*Math.exp((l.age-40)/(Math.max(7,(expectancy-40)/4.7)))*(1+(65-l.stats.health)/65));
  const death=rand(l)<hazard||l.age>=110||l.stats.health<=0;
  if(death){l.ended=true;l.pending=null;l.cause=l.age>=65?'生命走到了终点':'一次突如其来的疾病';log(l,'此生，在这里落下句点','一生的长短，不决定它曾经被认真度过的分量。','ending');}
  else l.pending=[5,15,30,50,70].includes(l.age)?{id:`reflection-${l.age}`,title:`给${l.age}岁的自己`,text:'如果把此刻留成一句话，你会想说什么？可以在“给自己的话”里写下感受，也可以让这一页留白。',options:[{id:'reflect',label:'记下此刻，继续生活',hint:'私人笔记只保存在本机 · 也可以留白',effects:{}}]}:decision(l);
  for(const p of l.peers){p.age=l.age;p.role=l.age<6?'正在长大':l.age<18?'正在学习':l.age<25?'寻找方向':l.age<65?['工作与生活','照顾家人','在新城市生活','学习新的事物'][l.peers.indexOf(p)]:'慢慢生活';}
  return l;
}
export function choose(source:Life,id:string,command:string):Life{
  if(source.ended||!source.pending||source.commands.includes(command))return source;
  const option=source.pending.options.find(o=>o.id===id);if(!option||(option.cost||0)>source.cash)return source;
  const l=structuredClone(source);l.commands.push(command);l.cash-=option.cost||0;effects(l,option.effects);
  if(option.career)l.career=option.career;if(option.education)l.education=option.education;if(option.move)l.place=`${l.country.name} · 新城市`;
  if(option.partner)l.people.push({id:'partner',name:pick(l,['知夏','阿宁','小川','远安']),role:'伴侣',bond:80,alive:true,memory:'决定一起走向未来的那一天。',goal:'想和你拥有彼此照顾的日常。'});
  if(id==='child')l.people.push({id:'child',name:'小禾',role:'孩子',bond:85,alive:true,memory:'你第一次牵起那只小小的手。',goal:'想和你分享每天新发现的事情。'});
  const reflection=l.pending!.id.startsWith('reflection-');
  const e=log(l,l.pending!.title,`你选择了：${option.label}。`,reflection?'reflection':'choice');
  if(option.keepsake)l.keepsakes.push({name:option.keepsake,eventId:e.id});l.pending=reflection?decision(l):null;return l;
}
export function transact(source:Life,type:'invest'|'withdraw'|'repay',amount:number,command:string):Life{
  if(source.ended||source.age<18||source.commands.includes(command)||!Number.isFinite(amount)||amount<=0||Math.floor(amount)!==amount)return source;
  if(type==='invest'&&source.cash<amount||type==='withdraw'&&source.invested<amount||type==='repay'&&(source.cash<amount||source.debt<amount))return source;
  const l=structuredClone(source);l.commands.push(command);
  if(type==='invest'){l.cash-=amount;l.invested+=amount;}if(type==='withdraw'){l.invested-=amount;l.cash+=amount;}if(type==='repay'){l.cash-=amount;l.debt-=amount;}
  log(l,type==='invest'?'为未来留下一点积蓄':type==='withdraw'?'取回一份积蓄':'偿还一笔欠款',`本次金额 ${amount.toLocaleString()} 生活币。`,'finance');return l;
}
export function act(source:Life,type:string,command:string):Life{
  if(source.ended||source.commands.includes(command)||source.yearActions.includes(type))return source;
  const costs:Record<string,number>={family:0,learn:source.age<18?0:100,rest:0,treat:400};
  if(!(type in costs)||source.cash<costs[type])return source;
  const l=structuredClone(source);l.cash-=costs[type];l.commands.push(command);l.yearActions.push(type);
  const texts:Record<string,[string,string,Partial<Stats>]>= {family:['把时间留给重要的人','你们认真聊了一次，谈起最近的生活。',{social:5,happiness:3}],learn:['学一点新的东西','你开始读一本书，或尝试一个没做过的事情。',{knowledge:5}],rest:['好好休息了一会儿','不必每一天都用来赶路。',{health:3,happiness:3}],treat:['认真照顾身体','你安排了一次检查，并开始调整生活。',{health:8}]};
  const [title,text,e]=texts[type];effects(l,e);log(l,title,text,'action');
  if(type==='family')for(const p of l.people)if(p.alive){p.bond=clamp(p.bond+7);p.memory=`${l.birthYear+l.age} 年，你愿意停下来听我说话。`;}
  return l;
}
const finite=z.number().finite();const nonnegative=finite.min(0).max(1e15);const ageSchema=finite.int().min(0).max(110);const short=z.string().max(120);const statSchema=z.object({health:finite.min(0).max(100),happiness:finite.min(0).max(100),knowledge:finite.min(0).max(100),social:finite.min(0).max(100)}).strict();
const optionSchema=z.object({id:short.min(1),label:short,hint:short,effects:z.object({health:finite.min(-100).max(100).optional(),happiness:finite.min(-100).max(100).optional(),knowledge:finite.min(-100).max(100).optional(),social:finite.min(-100).max(100).optional()}).strict(),cost:nonnegative.optional(),career:short.optional(),education:short.optional(),move:z.boolean().optional(),partner:z.boolean().optional(),keepsake:short.optional()}).strict();
const lifeSchema=z.object({version:z.literal(1),id:short.min(1),seed:finite.int().min(0).max(4294967295),rng:finite.int().min(0).max(4294967295),mode:z.enum(['present','past','future']),pace:z.union([z.literal(30),z.literal(60),z.literal(90)]),sampling:z.enum(['births','population']),birthYear:finite.int().min(1850).max(2200),age:ageSchema,name:short.min(1),sex:z.enum(['女','男']),country:z.object({id:short.min(1),name:short.min(1),population:nonnegative.nullable(),births:nonnegative.nullable(),lifeFemale:finite.min(0).max(120).nullable(),lifeMale:finite.min(0).max(120).nullable(),gdpPpp:nonnegative.nullable()}).passthrough(),place:short.min(1),stats:statSchema,cash:nonnegative,invested:nonnegative,debt:nonnegative,income:nonnegative,expense:nonnegative,career:short,education:short,focus:z.enum(['balance','study','career','family','health']),ended:z.boolean(),cause:short,events:z.array(z.object({id:short,age:ageSchema,year:finite.int(),title:short,text:z.string().max(1000),kind:short}).strict()).min(1).max(2000),pending:z.object({id:short,title:short,text:z.string().max(1000),options:z.array(optionSchema).min(1).max(8)}).strict().nullable(),people:z.array(z.object({id:short,name:short,role:short,bond:finite.min(0).max(100),alive:z.boolean(),memory:z.string().max(1000),goal:z.string().max(1000)}).strict()).max(20),peers:z.array(z.object({name:short,country:short,age:ageSchema,role:short}).strict()).length(4),keepsakes:z.array(z.object({name:short,eventId:short}).strict()).max(100),commands:z.array(short).max(10000),yearActions:z.array(z.enum(['family','learn','rest','treat'])).max(4),favorites:z.array(short).max(2000),notes:z.record(z.string().regex(/^\d{1,3}$/),z.string().max(500)),settlements:z.array(ageSchema).max(110),farewell:z.string().max(80).optional()}).strict();
export function validateLife(v:unknown):v is Life{try{const r=lifeSchema.safeParse(v);if(!r.success)return false;const l=r.data;const ids=new Set(l.events.map(e=>e.id));return (!l.ended||l.pending===null)&&ids.size===l.events.length&&l.events.every(e=>e.age<=l.age&&e.year===l.birthYear+e.age)&&l.keepsakes.every(k=>ids.has(k.eventId))&&l.favorites.every(k=>ids.has(k))&&l.settlements.every(a=>a<=l.age)&&new Set(l.settlements).size===l.settlements.length&&new Set(l.yearActions).size===l.yearActions.length;}catch{return false;}}
export function sceneFor(l:Life){if(l.age<6)return 2;if(l.country.id!=='CHN')return 7;if(l.age<18)return 7;if(l.events.some(e=>e.title==='另一个地方的来信'&&e.text.includes('收拾行李'))&&l.age<30)return 3;if(l.people.some(p=>p.role==='伴侣')&&l.age<60)return 4;return l.age>=65?6:5;}
export function summary(l:Life){const moments=l.events.filter(e=>['choice','milestone','relationship'].includes(e.kind));const chosen=moments.length<=5?moments:Array.from({length:5},(_,i)=>moments[Math.round(i*(moments.length-1)/4)]);return {line:l.age<6?`你在${l.country.name}来到这个世界。短暂的时光里，曾有人轻轻抱起你，认真记住你的名字。`:`在${l.country.name}出生，${l.education==='高等教育'?'曾继续求学，':''}${l.place.includes('新城市')?'也曾勇敢地出发。':'在熟悉与陌生之间，慢慢找到生活的节奏。'}${l.people.some(p=>p.role==='伴侣')?'有人与你相伴，':''}那些平常的日子，也留下了属于你的痕迹。`,moments:chosen};}
