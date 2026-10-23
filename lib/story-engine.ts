import type {Life,Stats,Option,Decision,Entry} from './engine';
import type {StoryState,StoryChoice,StoryResult,Encounter} from './story-types';
import {encounters,followups} from './encounters.ts';
import {scheduleCommitment,settleCommitments,decisionOptions} from './commitments.ts';
import {captureEntryScene} from './scenes.ts';
const bound=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const clamp=(n:number)=>Math.round(bound(n,0,100));
function roll(l:Life){l.rng=(Math.imul(l.rng,1664525)+1013904223)>>>0;return l.rng/4294967296;}
function add(l:Life,title:string,text:string,kind='ordinary'){const e:Entry={id:`${l.id}-${l.events.length}`,age:l.age,year:l.birthYear+l.age,title,text,kind};e.scene=captureEntryScene(l,e);l.events.push(e);return e;}
function affect(l:Life,e:Partial<Stats>={}){for(const k of Object.keys(e) as (keyof Stats)[])l.stats[k]=clamp(l.stats[k]+(e[k]||0));}
function transfer(l:Life,n:number){if(n>=0){l.cash+=Math.round(n);return;}const paid=Math.min(l.cash,Math.round(-n));l.cash-=paid;l.debt+=Math.round(-n)-paid;}
export function localBaseline(l:Life){return Math.round(bound(1100*Math.pow((l.country.gdpPpp||18000)/20000,.42),480,2700));}
export function ensureStory(l:Life,fresh=false):StoryState{
 if(l.story)return l.story;
 // A local game's opportunity coefficient, not a measured education or income indicator.
 const opportunity=bound(.5+.15*Math.log2((l.country.gdpPpp||18000)/20000),.15,.85);
 const familyRoll=fresh?roll(l):((Math.imul(l.seed,1103515245)>>>0)%10000)/10000;
 const tier=familyRoll<.28?'tight':familyRoll<.83?'steady':'comfortable';
 const support=tier==='tight'?25:tier==='steady'?55:85;
 l.story={version:2,family:{tier,support},opportunity,schoolQuality:bound(opportunity*.55+support/100*.45,.1,.95),job:l.age>=65?'retired':l.age<18||l.career==='学生'?'school':l.career==='自由探索'?'independent':'employed',jobMultiplier:1,energy:3,flags:[],seen:{},queue:[]};
 if(l.education==='高等教育'){
  if(l.career==='学生'&&!fresh)l.story.seen['_education-start']=Math.min(18,l.age);
  else l.story.flags.push('degree');
 }
 if(fresh){l.cash=Math.round(localBaseline(l)*(tier==='tight'?.08:tier==='steady'?.3:.9));add(l,'出生档案：家庭与环境',`家中资源${tier==='tight'?'紧张':tier==='steady'?'尚算稳定':'比较宽裕'}。父母能提供的支持、当地的机会与之后的偶然，都会影响你的道路。`,'background');}
 return l.story;
}
const familyAlive=(l:Life)=>l.people.some(p=>p.role==='家人'&&p.alive);
function eligible(e:Encounter,l:Life,s:StoryState){return l.age>=e.min&&l.age<=e.max&&(!e.when||e.when(l,s))&&(!e.once||s.seen[e.id]===undefined)&&(s.seen[e.id]===undefined||l.age-s.seen[e.id]>=(e.cooldown||7));}
function materialize(e:Encounter,l:Life):Decision{const s=ensureStory(l);s.seen[e.id]=l.age;s.seen['_last-encounter']=l.age;return {id:`encounter-${e.id}-${l.age}`,title:e.title,text:e.text(l,s),options:decisionOptions(l,e.options(l,s))};}
export function nextStoryEncounter(l:Life):Decision|null{
 const s=ensureStory(l);
 const due=s.queue.filter(q=>q.due<=l.age);
 for(const q of due){const e=followups[q.id];if(e&&eligible(e,l,s)){s.queue=s.queue.filter(v=>v!==q);return materialize(e,l);}
  if(!e||l.age>q.due+3||l.age>e.max||e.once&&s.seen[e.id]!==undefined){
   s.queue=s.queue.filter(v=>v!==q);
   const flags:Record<string,string>={'scholarship-result':'scholarship-prepared','training-offer':'training-enrolled','business-review':'business-open','care-review':'care-arrangement','health-review':'health-followup'};
   if(flags[q.id])s.flags=s.flags.filter(f=>f!==flags[q.id]);
   if(e)add(l,`原先的安排有了变化：${e.title}`,'这几年，生活条件已经改变。原先约好的这件事最终没能继续，你重新安排了下一步。','followup');
  }
 }
 const candidates=encounters.filter(e=>eligible(e,l,s));if(!candidates.length)return null;
 const chance=l.age<4?.68:l.age<18?.88:l.age<65?.90:.78;
 const last=s.seen['_last-encounter']??Math.max(0,...l.events.filter(e=>e.kind==='choice').map(e=>e.age));
 if(l.age-last<3&&roll(l)>chance)return null;
 const weightOf=(e:Encounter)=>e.weight*(s.job==='unemployed'&&e.options(l,s).some(o=>o.story?.job==='employed'||o.story?.risk?.success.job==='employed')?2.5:1)*(l.focus==='study'&&/study|training|scholarship/.test(e.id)?1.5:1);
 let weight=roll(l)*candidates.reduce((n,e)=>n+weightOf(e),0);
 const selected=candidates.find(e=>(weight-=weightOf(e))<=0)||candidates[candidates.length-1];return materialize(selected,l);
}
function quietYear(l:Life){const s=l.story!;const recent=new Set(l.events.slice(-10).map(e=>e.title));
 const young:[string,string][]=[['窗边的第一场雨','你伸手去碰玻璃上的水珠。家人第一次发现，你会认真观察这个世界。'],['旧衣服，新个头','去年的衣服已经短了一截。家里翻出针线，把衣角重新放长。'],['记住一条回家的路','你开始认得家附近的路，知道哪扇门后面有人在等你。'],['第一次把话说清楚','家人终于听懂了你反复说的那个词。你很得意，又说了好几遍。']];
 const school:[string,string][]=[['一道终于会做的题','你在草稿纸上擦了又写，终于独立算出了答案。'],['操场边的位置','课间，你和同学坐在操场边，争论将来想做什么。'],['带回家的作业','今天的功课比平时难。你留到吃完饭，才把最后一页写完。'],['被记住的一次进步','老师提起你最近的变化。你第一次觉得，努力也会被别人看见。']];
 const adult:[string,string][]=[['账本上的这一年',`今年收入 ${l.income}、支出 ${l.expense} 生活币。${l.debt?'还有欠款需要慢慢还。':'你把剩下的一点钱留给了未来。'}`],['熟悉的工作日',s.job==='unemployed'?'你又投了几份简历，等待并不轻松。':'你逐渐熟悉手里的事情，也开始思考要不要继续这样过下去。'],['一顿临时约好的晚饭','一位熟人临时问你有没有空。你们吃了一顿不贵的饭，聊了各自的难处。'],['把东西修好','原本打算丢掉的东西被你修好了。省下的钱不多，但你觉得很满意。'],['休息日的安排',l.focus==='family'?'你把这一整天留给了重要的人。':l.focus==='study'?'你终于读完了拖了很久的那本书。':'你洗了衣服，整理了房间，把生活重新安排好。']];
 const old:[string,string][]=[['旧物上的名字','整理抽屉时，你发现年轻时写下的名字。笔迹还在，有些事情却已经很远了。'],['把饭做给自己','你认真做了一顿自己爱吃的饭。小事也可以成为日子的支撑。'],['有空的一个下午','你坐下来读报、散步，或者听一会儿广播。这一天没有赶着去哪里。'],['街道又变了一点','一家老店换了招牌。你给仍然熟悉这里的人讲起它以前的样子。']];
 const pool=l.age<6?young:l.age<18?school:l.age>=65?old:adult;const options=pool.filter(e=>!recent.has(e[0]));const e=(options.length?options:pool)[Math.floor(roll(l)*(options.length||pool.length))];add(l,e[0],e[1]);
}
export function advanceStoryYear(source:Life):Life{
 if(source.ended||source.pending)return source;const l=structuredClone(source);const s=ensureStory(l);l.age++;s.energy=3;l.yearActions=[];
 const annual=settleCommitments(l);
 affect(l,{health:l.age>55?-2:roll(l)<.4?-1:0,happiness:roll(l)<.48?-1:1,social:l.focus==='family'?2:-1,knowledge:l.age<18?Math.max(1,Math.round(s.schoolQuality*3)):0});
 if(l.focus==='study')affect(l,{knowledge:3,happiness:-1});if(l.focus==='career')affect(l,{knowledge:1,health:-1});if(l.focus==='family')affect(l,{happiness:2});if(l.focus==='health')affect(l,{health:3,happiness:1});if(s.flags.includes('health-routine'))affect(l,{health:1});if(s.flags.includes('overworked'))affect(l,{health:-1});
 if(l.age===6){l.education='基础教育';l.career='学生';add(l,'到了上学的年纪',s.family.tier==='tight'?'家人反复算过学费和生活费，仍希望尽力让你继续读书。':'家里为你准备了上学的东西。教室外面，生活还有许多不同的路。','milestone');}
 if(l.age>=18&&s.job==='school'&&l.education!=='高等教育'&&!s.queue.some(q=>q.id==='scholarship-result')){s.job='unemployed';l.career='寻找第一份工作';}
 if(l.education==='高等教育'&&s.seen['_education-start']!==undefined&&l.age-s.seen['_education-start']>=4&&s.job==='school'){s.job='unemployed';s.flags.push('degree');l.career='毕业求职中';add(l,'毕业以后，仍有一段路',`你完成了学业。文凭带来了新的申请机会，拿到什么样的工作仍取决于能力和机缘。`,'milestone');}
 if(l.age>=65&&s.job!=='retired'){s.job='retired';l.career='退休';add(l,'把时间重新安排',`工作的章节暂时合上。你要重新安排收入、日常和与人的联系。`,'milestone');}
 const base=localBaseline(l);const earning=s.job==='employed'?base*(.6+l.stats.knowledge*.017)*s.jobMultiplier*(l.focus==='career'?1.15:1)*(l.stats.health<35?.6:1):s.job==='independent'?base*(.35+roll(l)*1.0)*s.jobMultiplier:s.job==='retired'?base*.43:s.job==='school'&&familyAlive(l)?base*s.family.support/100*.55:0;
 l.income=l.age<16?0:Math.round(earning*(s.flags.includes('extra-hours')?1.12:1)+(s.job==='unemployed'&&s.flags.includes('extra-hours')?base*.25:0));l.expense=l.age<16?0:Math.round((base*(l.age<18?.24:.62)*(l.place.includes('新城市')?1.2:1)+(l.people.some(p=>p.role==='孩子'&&p.alive)?base*.18:0)+(s.job==='school'&&l.age>=18?base*.22:0))*(s.flags.includes('debt-plan')||s.flags.includes('retirement-budget')?.9:1));
 l.income=Math.max(0,l.income+annual.income);l.expense=Math.max(0,l.expense+annual.expense);
 const net=l.income-l.expense;if(net>=0){const repay=Math.min(l.debt,net);l.debt-=repay;l.cash+=net-repay;}else transfer(l,net);
 if(annual.notes.length)add(l,annual.completed.length?'有些安排，走完了约定的时间':'之前的决定，仍在影响这一年',annual.notes.join(''),'commitment');
 l.debt=Math.round(l.debt*1.025);l.invested=Math.max(0,Math.round(l.invested*(.92+roll(l)*.20)));l.settlements.push(l.age);
 if(l.debt>base*2)affect(l,{happiness:-3,health:-1});if(s.job==='unemployed'&&l.age>=18)affect(l,{happiness:-2});
 for(const p of l.people){if(!p.alive)continue;p.bond=clamp(p.bond+(l.focus==='family'?2:-1));if(p.role==='家人'&&l.age>40&&roll(l)<.025){p.alive=false;p.memory=`${l.birthYear+l.age} 年，你们最后一次认真告别。`;add(l,`与${p.name}告别`,'你开始学着，在想念中继续把自己的生活过下去。','relationship');affect(l,{happiness:-9});}}
 const exp=(l.sex==='女'?l.country.lifeFemale:l.country.lifeMale)||72;
 const risk=l.age<5?.0008:l.age<40?.00025:bound(.0013*Math.exp((l.age-40)/Math.max(7,(exp-40)/4.7))*(1+(65-l.stats.health)/65),0,.65);
 if(roll(l)<risk||l.age>=110||l.stats.health<=0){l.ended=true;l.pending=null;l.cause=l.age>=65?'生命走到了终点':'一次突如其来的疾病';add(l,'此生，在这里落下句点','那些曾经努力解决的难题、作出的决定与牵挂的人，都成为了这段人生的一部分。','ending');return l;}
 if([5,15,30,50,70].includes(l.age)){s.seen[`reflection-${l.age}`]=l.age;l.pending={id:`reflection-${l.age}`,title:`给${l.age}岁的自己`,text:'看看现在的生活。如果把这个阶段留成一句话，你最想记住什么？可以在私人笔记中写下，也可以留白。',options:[{id:'reflect',label:'记下这一刻，继续',hint:'不会自动公开私人笔记',effects:{}}]};}
 else l.pending=nextStoryEncounter(l);
 if(!l.pending)quietYear(l);
 for(const p of l.peers){p.age=l.age;p.role=l.age<6?'正在长大':l.age<18?'正在学习':l.age<25?'寻找方向':l.age<65?['工作与生活','照顾家人','在新城市生活','学习新的事物'][l.peers.indexOf(p)]:'慢慢生活';}
 return l;
}
function familySupport(s:StoryState,delta:number){s.family.support=clamp(s.family.support+delta);s.schoolQuality=bound(s.opportunity*.55+s.family.support/100*.45,.1,.95);}
function planNote(l:Life,p:NonNullable<StoryChoice['commitment']>){return scheduleCommitment(l,p)?`从下一年起，“${p.label}”将持续 ${p.years} 年，可在“正在影响我的生活”中查看。`:'';}
function applyResult(l:Life,r:StoryResult){const s=l.story!;affect(l,r.effects);if(r.cash)transfer(l,r.cash);if(r.flag&&!s.flags.includes(r.flag))s.flags.push(r.flag);if(r.job)s.job=r.job;if(r.multiplier)s.jobMultiplier=bound(s.jobMultiplier*r.multiplier,.4,2.5);if(r.familyDelta)familySupport(s,r.familyDelta);if(r.queue)s.queue.push({due:l.age+r.queue.after,id:r.queue.id});return r.text+(r.commitment?planNote(l,r.commitment):'');}
export function applyStoryChoice(l:Life,o:Option,event:Entry,before?:Life){
 const s=ensureStory(l),x=(o as Option&{story?:StoryChoice}).story;
 if(o.education==='高等教育'){s.job='school';s.seen['_education-start']=l.age;}
 if(o.career&&o.career!=='学生'&&!x?.job)s.job='employed';
 let result='你为接下来的生活作了新的安排。';
 if(x){if(x.flag&&!s.flags.includes(x.flag))s.flags.push(x.flag);if(x.removeFlag)s.flags=s.flags.filter(f=>f!==x.removeFlag);if(x.job)s.job=x.job;if(x.multiplier)s.jobMultiplier=bound(s.jobMultiplier*x.multiplier,.4,2.5);if(x.familyDelta)familySupport(s,x.familyDelta);if(x.queue)s.queue.push({due:l.age+x.queue.after,id:x.queue.id});
  if(x.risk){const chance=bound(x.risk.base+(l.stats[x.risk.stat]-50)/180+(s.opportunity-.5)*.20,.08,.92);result=applyResult(l,roll(l)<chance?x.risk.success:x.risk.failure);}
  else if(x.queue)result=`决定已作出。接下来的 ${x.queue.after} 年里，这件事还会有后续。`;
  else if(x.job==='unemployed')result='你暂时离开了原来的工作。下一年的收入和生活安排会随之改变。';
  else if(x.multiplier)result='这个机会改变了你的工作条件，之后的收入也会随之调整。';
 }
 if(s.job==='unemployed')l.career='正在寻找工作';if(s.job==='school')l.career='学生';if(s.job==='independent'&&o.career===undefined)l.career='自由谋生';if(s.job==='employed'&&['正在寻找工作','毕业求职中','寻找第一份工作','学生','自由谋生','尚未入学','待业'].includes(l.career))l.career='受雇工作者';
 const names:Record<keyof Stats,string>={health:'健康',happiness:'幸福',knowledge:'知识',social:'人际'};
 const changes=before?(Object.keys(names) as (keyof Stats)[]).filter(k=>l.stats[k]!==before.stats[k]).map(k=>`${names[k]}${l.stats[k]>before.stats[k]?'+':''}${l.stats[k]-before.stats[k]}`):[];
 if(before&&l.cash!==before.cash)changes.push(`余额${l.cash>before.cash?'+':''}${l.cash-before.cash}`);
 if(before?.story&&s.family.support!==before.story.family.support)changes.push(`家庭支持${s.family.support>before.story.family.support?'+':''}${s.family.support-before.story.family.support}`);
 if(x?.flag==='debt-plan')result='你开始缩减可推迟的开支，之后每年的生活支出会降低。';
 if(x?.flag==='extra-hours')result='你开始接额外工时，之后的现金流会有所增加。';
 if(o.education==='高等教育')result='你进入了高等教育阶段。接下来四年的学习、家庭支持与生活费，都将进入账本。';
 if(o.partner)result='你们决定正式相伴。这个人会留在关系中，也会影响之后的家庭选择。';
 if(o.id==='child')result='家里多了一位需要照顾的人。往后的生活开支和牵挂也增加了。';
 if(x?.commitment)result+=planNote(l,x.commitment);
 const keepsakes:Record<string,string>={'school-friendship':'一张写着同学名字的纸条','scholarship-prepared':'一份修改了很多次的申请稿','training-enrolled':'一张课程报名单','business-open':'第一本进货账本','moved-for-work':'一张出发的车票','training-placed':'一封新岗位的录用通知'};
 for(const [flag,name] of Object.entries(keepsakes))if(s.flags.includes(flag)&&!before?.story?.flags.includes(flag)&&!l.keepsakes.some(k=>k.name===name))l.keepsakes.push({name,eventId:event.id});
 if(o.partner&&!l.keepsakes.some(k=>k.name==='一页关于未来的约定'))l.keepsakes.push({name:'一页关于未来的约定',eventId:event.id});
 const text=result+(changes.length?`（${changes.join('，')}）`:'');
 event.text=`你选择了：${o.label}。${text}`;s.lastOutcome={title:event.title,text,age:l.age};
}
