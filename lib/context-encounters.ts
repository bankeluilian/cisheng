import type {Life,Stats} from './engine';
import type {Encounter,StoryChoice,StoryOption,StoryResult} from './story-types';

// Original fictional encounters. birthWork describes the birth snapshot, never a current job.
// These amounts and arrangements belong to the game, not to a national social system.
type Commitment={id:string;label:string;years:number;income?:number;expense?:number;effects?:Partial<Stats>};
type ContextResult=StoryResult&{familyDelta?:number;commitment?:Commitment};
type ContextChoice=Omit<StoryChoice,'risk'>&{commitment?:Commitment;risk?:{base:number;stat:keyof Stats;success:ContextResult;failure:ContextResult}};
type Parent=Life['people'][number];
const parent=(l:Life,test:(p:Parent)=>boolean)=>l.people.find(p=>p.alive&&(p.id==='mother'||p.id==='father')&&!!p.birthWork&&test(p));
const who=(p:Parent)=>p.fullName?`${p.fullName}（${p.name}）`:p.name;
const past=(p:Parent)=>`${who(p)}在你出生时的职业档案是“${p.birthWork!.title}”。`;
const has=(s:{flags:string[]},key:string)=>s.flags.includes(key);
const c=(id:string,label:string,hint:string,effects:Partial<Stats>={},cost=0,story?:ContextChoice):StoryOption=>({id,label,hint,effects,cost,...(story?{story}:{})});

export const contextEncounters:Encounter[]=[
  // Early childhood: three events.
  {
    id:'ctx-shift-clock',min:0,max:5,weight:7,once:true,
    when:l=>!!parent(l,p=>p.birthWork!.sector==='industry'&&p.birthWork!.arrangement==='regular'),
    title:'一张旧班次表',
    text:l=>`${past(parent(l,p=>p.birthWork!.sector==='industry'&&p.birthWork!.arrangement==='regular')!)}家里翻出当年的班次表，开始重新商量你的照料时间。表上的钟点能改，小孩不会按表哭。`,
    options:()=>[
      c('ctx-fixed','先保住固定的睡觉和吃饭时间','健康 +5 · 家庭支持 −3',{health:5},0,{familyDelta:-3,flag:'ctx-childhood-routine'}),
      c('ctx-flex','让照料时间灵活些，减少来回奔忙','幸福 +4 · 健康 −2 · 家庭支持 +2',{happiness:4,health:-2},0,{familyDelta:2}),
    ],
  },
  {
    id:'ctx-care-invisible',min:1,max:5,weight:7,once:true,
    when:l=>!!parent(l,p=>p.id==='mother'&&p.birthWork!.arrangement==='care'),
    title:'没有打卡声的一天',
    text:l=>`${past(parent(l,p=>p.id==='mother'&&p.birthWork!.arrangement==='care')!)}这次整理家庭分工，大家把喂饭、洗晒和半夜起身也写进清单。一整页，原来都不是“顺手”。`,
    options:()=>[
      c('ctx-share','把照料拆成几块，重新找人分担','人际 +4 · 幸福 −2 · 家庭支持 +4',{social:4,happiness:-2},0,{familyDelta:4}),
      c('ctx-simplify','减少家务标准，把精力先留给照料','健康 +3 · 幸福 +2 · 家庭支持 −2',{health:3,happiness:2},0,{familyDelta:-2}),
    ],
  },
  {
    id:'ctx-changing-plans',min:2,max:5,weight:8,once:true,
    when:l=>!!parent(l,p=>p.birthWork!.arrangement==='casual'||p.birthWork!.arrangement==='self'),
    title:'说好出门的那个上午',
    text:l=>`${past(parent(l,p=>p.birthWork!.arrangement==='casual'||p.birthWork!.arrangement==='self')!)}家里记得那时常临时改计划。这一回，原定的出门又撞上了一件急事，玩具已经装进小包。`,
    options:()=>[
      c('ctx-reschedule','把约定改成一个具体的新时间','幸福 −2 · 人际 +5',{happiness:-2,social:5},0,{flag:'ctx-kept-promises'}),
      c('ctx-homeplay','不再等出门，在家找东西玩','知识 +4 · 人际 −2',{knowledge:4,social:-2}),
    ],
  },
  // Primary school: four events.
  {
    id:'ctx-seed-notebook',min:6,max:12,weight:7,once:true,
    when:l=>!!parent(l,p=>p.birthWork!.sector==='agriculture'),
    title:'纸袋上的几行字',
    text:l=>`${past(parent(l,p=>p.birthWork!.sector==='agriculture')!)}你找到一个旧纸袋，上面记着日期和几行数量。把这些旧记录抄进观察本，需要耐心，也不保证长出什么。`,
    options:()=>[
      c('ctx-observe','自己做小观察，按天记变化','知识 +6 · 幸福 −2',{knowledge:6,happiness:-2},0,{flag:'ctx-observation-habit'}),
      c('ctx-ask','请家里人讲清记录是什么意思','知识 +3 · 人际 +4 · 家庭支持 −2',{knowledge:3,social:4},0,{familyDelta:-2}),
    ],
  },
  {
    id:'ctx-service-words',min:7,max:12,weight:7,once:true,
    when:l=>!!parent(l,p=>p.id==='father'&&p.birthWork!.sector==='services'),
    title:'把一句话重新说一遍',
    text:l=>`${past(parent(l,p=>p.id==='father'&&p.birthWork!.sector==='services')!)}一次说起当年遇到的人，${who(parent(l,p=>p.id==='father'&&p.birthWork!.sector==='services')!)}提醒你：把请求说清楚，和永远答应别人，是两回事。`,
    options:()=>[
      c('ctx-boundary','练习礼貌地拒绝一个不合理请求','人际 +4 · 幸福 −2',{social:4,happiness:-2},0,{flag:'ctx-boundary-practice'}),
      c('ctx-help','先帮一次，再说明自己能做多少','人际 +6 · 健康 −2',{social:6,health:-2}),
    ],
  },
  {
    id:'ctx-paid-work-time',min:6,max:12,weight:6,once:true,
    when:l=>!!parent(l,p=>p.birthWork!.arrangement==='regular'),
    title:'账本上没有写的时间',
    text:l=>`${past(parent(l,p=>p.birthWork!.arrangement==='regular')!)}一场家庭聊天从旧工资单说到当年的路程和等候。你第一次发现，报酬之外还要付出许多时间。`,
    options:()=>[
      c('ctx-count','把一周用在路上的时间也算进去','知识 +5 · 幸福 −2',{knowledge:5,happiness:-2},0,{flag:'ctx-time-accounting'}),
      c('ctx-dayoff','先商量保留一个不安排任务的下午','幸福 +5 · 家庭支持 −2',{happiness:5},0,{familyDelta:-2}),
    ],
  },
  {
    id:'ctx-shared-study-box',min:7,max:12,weight:9,once:true,
    when:(_l,s)=>s.family.tier==='tight'||s.family.support<45,
    title:'几个人拼出的一箱材料',
    text:()=>`几位同学愿意轮流带来练习材料，缺什么就互相补。你可以承担整理、归还和约时间，也可以只借用现成的一份。`,
    options:()=>[
      c('ctx-organize','负责整理，连续两年一起学习','未来2年每年知识 +2、人际 +1、幸福 −1',{},0,{flag:'ctx-study-circle',commitment:{id:'ctx-study-circle-plan',label:'共用材料学习组',years:2,effects:{knowledge:2,social:1,happiness:-1}},queue:{after:2,id:'ctx-study-circle-return'}}),
      c('ctx-borrow','只借一份材料，先顾好自己的进度','知识 +3 · 人际 −2',{knowledge:3,social:-2}),
    ],
  },
  // Adolescence: three events.
  {
    id:'ctx-old-tools',min:13,max:17,weight:7,once:true,
    when:l=>!!parent(l,p=>p.birthWork!.sector==='industry'),
    title:'工具箱里少了一颗螺丝',
    text:l=>`${past(parent(l,p=>p.birthWork!.sector==='industry')!)}家里保留的旧工具箱被翻出来，眼前那件小东西正好坏了。你可以学着处理安全的小部件，也可以承认自己还不会。`,
    options:()=>[
      c('ctx-repair','先查清结构，只拆能安全复原的部分','知识 +6 · 幸福 −2',{knowledge:6,happiness:-2},0,{flag:'ctx-hands-on'}),
      c('ctx-manual','不动工具，画一张结构和故障草图','知识 +3 · 健康 +2 · 人际 −1',{knowledge:3,health:2,social:-1}),
    ],
  },
  {
    id:'ctx-weekend-ledger',min:16,max:17,weight:9,once:true,
    when:(l,s)=>!!parent(l,p=>p.birthWork!.arrangement==='casual')&&(s.family.tier==='tight'||s.family.support<55),
    title:'两年周末值多少钱',
    text:l=>`${past(parent(l,p=>p.birthWork!.arrangement==='casual')!)}听过当年按次找活的故事后，你对一份周末零活更谨慎了。报酬写得清楚，挤掉的学习时间却不会有人替你补。`,
    options:()=>[
      c('ctx-take','只接约定的周末工时，持续两年','未来2年每年收入 +300、知识 −1、健康 −1',{},0,{flag:'ctx-weekend-work',commitment:{id:'ctx-weekend-work-plan',label:'限定周末兼职',years:2,income:300,effects:{knowledge:-1,health:-1}},queue:{after:2,id:'ctx-weekend-work-return'}}),
      c('ctx-refuse','不接长期工时，先保住学习节奏','知识 +4 · 幸福 −2 · 家庭支持 −2',{knowledge:4,happiness:-2},0,{familyDelta:-2}),
    ],
  },
  {
    id:'ctx-learning-proof',min:13,max:17,weight:8,once:true,
    when:(_l,s)=>has(s,'self-taught')||has(s,'left-school')||has(s,'ctx-hands-on'),
    title:'会做，和能让别人看懂',
    text:()=>`你学过一些课表外的东西，但散在纸角和旧文件里。有人愿意看看你的作品，前提是你能讲清自己做了哪一步。`,
    options:()=>[
      c('ctx-portfolio','拿掉花哨部分，把过程重做成一份记录','知识 +6 · 幸福 −3',{knowledge:6,happiness:-3},0,{flag:'ctx-first-portfolio'}),
      c('ctx-demo','直接演示一遍，承认没弄懂的地方','人际 +4 · 知识 +2 · 幸福 −1',{social:4,knowledge:2,happiness:-1}),
    ],
  },
  // Young and middle adulthood: six events, all with multi-year arrangements.
  {
    id:'ctx-small-order-book',min:18,max:55,weight:8,once:true,
    when:(l,s)=>!!parent(l,p=>p.birthWork!.arrangement==='self')&&s.job!=='school'&&s.job!=='retired',
    title:'先试接单，还是先买设备',
    text:l=>`${past(parent(l,p=>p.birthWork!.arrangement==='self')!)}当年的接单经验只能参考，不能替今天的需求担保。你打算用两年小规模试做，不把收入好的月份当成常态。`,
    options:()=>[
      c('ctx-trial','先付工具和试做成本，限制接单规模','花费500 · 未来2年每年收入 +500、支出 +200、健康 −1',{},500,{flag:'ctx-order-trial',commitment:{id:'ctx-order-trial-plan',label:'小规模接单试做',years:2,income:500,expense:200,effects:{health:-1}},queue:{after:2,id:'ctx-order-trial-return'}}),
      c('ctx-observe','先记录需求，不花钱开张','知识 +4 · 人际 +2 · 幸福 −2',{knowledge:4,social:2,happiness:-2},0,{flag:'ctx-market-notes'}),
    ],
  },
  {
    id:'ctx-evening-class',min:18,max:60,weight:9,once:true,
    when:(_l,s)=>(has(s,'left-school')||has(s,'self-taught')||has(s,'ctx-first-portfolio'))&&s.job!=='school'&&s.job!=='retired',
    title:'课表排在下班以后',
    text:()=>`一门夜间课程允许分段完成。没有人保证学完就有职位，三年的费用和晚上抽出来的精力都得写进自己的账本。`,
    options:()=>[
      c('ctx-enroll','按年交费，先把三年的时间留出来','未来3年每年支出 +250、知识 +3、幸福 −1',{},0,{flag:'ctx-evening-study',commitment:{id:'ctx-evening-study-plan',label:'分段夜间课程',years:3,expense:250,effects:{knowledge:3,happiness:-1}},queue:{after:3,id:'ctx-evening-study-return'}}),
      c('ctx-open','先自学一个小单元，不承担长期费用','知识 +3 · 人际 −2',{knowledge:3,social:-2},0,{flag:'ctx-self-taught'}),
    ],
  },
  {
    id:'ctx-income-bridge',min:18,max:63,weight:10,once:true,
    when:(_l,s)=>s.job==='unemployed',
    title:'能立刻上手，却不是想做的事',
    text:()=>`一份零散协助工作能在找职位期间补一些收入。工时可以划清，但接下来两年，你都得在投简历和交付之间切换。`,
    options:()=>[
      c('ctx-bridge','保留求职身份，接限定工时的零活','未来2年每年收入 +450、健康 −1、人际 +1',{},0,{flag:'ctx-bridge-work',commitment:{id:'ctx-bridge-work-plan',label:'求职期间限定零活',years:2,income:450,effects:{health:-1,social:1}},queue:{after:2,id:'ctx-income-bridge-return'}}),
      c('ctx-focus','不接，把这段时间集中用于作品和申请','知识 +5 · 幸福 −3',{knowledge:5,happiness:-3}),
    ],
  },
  {
    id:'ctx-parenting-roster',min:25,max:64,weight:8,once:true,
    when:l=>l.people.some(p=>p.alive&&p.role==='孩子')&&l.people.some(p=>p.alive&&p.role==='伴侣'),
    title:'谁的日程先被挪开',
    text:l=>`${l.people.find(p=>p.alive&&p.role==='伴侣')!.name}和你把照护${l.people.find(p=>p.alive&&p.role==='孩子')!.name}的安排并排写下。两张日程都没有空白，不能再靠谁“顺便有空”。`,
    options:()=>[
      c('ctx-reduce','自己固定少接一段工作，腾出照料时间','未来3年每年收入 −300、人际 +2、幸福 +1',{},0,{flag:'ctx-care-time',commitment:{id:'ctx-parenting-time-plan',label:'固定留出的育儿时间',years:3,income:-300,effects:{social:2,happiness:1}}}),
      c('ctx-outside','共同支付一段外部协助，保留工作时间','未来3年每年支出 +350、健康 +1、幸福 −1',{},0,{flag:'ctx-care-budget',commitment:{id:'ctx-parenting-budget-plan',label:'育儿协助预算',years:3,expense:350,effects:{health:1,happiness:-1}}}),
    ],
  },
  {
    id:'ctx-family-distance',min:35,max:64,weight:9,once:true,
    when:(l,s)=>s.family.support<65&&l.people.some(p=>p.alive&&p.role==='家人'),
    title:'往返也要占掉半天',
    text:l=>`${who(l.people.find(p=>p.alive&&p.role==='家人')!)}最近需要你多照应一点。你愿意帮忙，但先得决定：哪些工作能少做，哪些协助值得付费。`,
    options:()=>[
      c('ctx-visits','固定去照应，少接一部分工作','未来2年每年收入 −250、人际 +2、健康 −1',{},0,{flag:'ctx-family-visits',familyDelta:4,commitment:{id:'ctx-family-visits-plan',label:'固定家庭照护往返',years:2,income:-250,effects:{social:2,health:-1}},queue:{after:2,id:'ctx-family-visits-return'}}),
      c('ctx-paid-help','先承担两年的协助预算，自己定期确认','未来2年每年支出 +400、健康 +1、幸福 −1',{},0,{flag:'ctx-family-visits',familyDelta:3,commitment:{id:'ctx-family-help-plan',label:'家庭照护协助预算',years:2,expense:400,effects:{health:1,happiness:-1}},queue:{after:2,id:'ctx-family-visits-return'}}),
    ],
  },
  {
    id:'ctx-family-buffer',min:22,max:64,weight:7,once:true,
    when:(_l,s)=>s.family.tier==='comfortable'||s.family.support>=65,
    title:'有人能兜底之后',
    text:()=>`有支持不等于每次都该用上。你想试一种收入少些、学习多些的安排，也知道把时间用在试错上，本身就是一种条件。`,
    options:()=>[
      c('ctx-explore','减少接活，两年里系统探索新方向','未来2年每年收入 −450、知识 +3、幸福 +1',{},0,{flag:'ctx-supported-exploration',familyDelta:-3,commitment:{id:'ctx-supported-exploration-plan',label:'有支持的探索期',years:2,income:-450,effects:{knowledge:3,happiness:1}}}),
      c('ctx-reserve','维持原来节奏，降低一些可选开支','未来2年每年支出 −200、幸福 −2',{},0,{flag:'ctx-buffer-plan',commitment:{id:'ctx-buffer-plan',label:'保留家庭缓冲',years:2,expense:-200,effects:{happiness:-2}}}),
    ],
  },
  // Later life: two events. Old occupational records are explicitly historical.
  {
    id:'ctx-work-archive',min:65,max:100,weight:6,once:true,
    when:l=>l.people.some(p=>(p.id==='mother'||p.id==='father')&&!!p.birthWork),
    title:'职业一栏装不下的一生',
    text:l=>{const p=l.people.find(p=>(p.id==='mother'||p.id==='father')&&!!p.birthWork)!;return `${past(p)}如今再看这行旧记录，你知道一个职业称呼装不下全部生活。${p.alive?'你可以趁还能当面问，核对几处记不清的细节。':'你只能依照现存记录整理，把拿不准的地方留白。'}`;},
    options:()=>[
      c('ctx-record','只记有根据的片段，也写下不知道的部分','知识 +4 · 幸福 −3',{knowledge:4,happiness:-3},0,{flag:'ctx-family-archive'}),
      c('ctx-keep','不赶着写成故事，保留原始记录','幸福 +3 · 知识 −1',{happiness:3,knowledge:-1}),
    ],
  },
  {
    id:'ctx-neighbor-exchange',min:65,max:95,weight:7,once:true,
    when:(l,s)=>s.job==='retired'&&l.stats.health>=45,
    title:'把会做的事换成陪伴',
    text:()=>`附近有人组织小范围的技能互助：不承诺什么都能解决，也不按工价结算。你会的那些小事，可以固定教给别人，但每周得准时到场。`,
    options:()=>[
      c('ctx-regular','承诺两年，每周留一个固定时段','未来2年每年人际 +3、健康 −1',{},0,{flag:'ctx-neighbor-exchange',commitment:{id:'ctx-neighbor-exchange-plan',label:'固定邻里技能互助',years:2,effects:{social:3,health:-1}}}),
      c('ctx-occasional','只在状态合适时参加，不固定值班','人际 +3 · 幸福 +1 · 知识 −1',{social:3,happiness:1,knowledge:-1}),
    ],
  },
];

export const contextFollowups:Record<string,Encounter>={
  'ctx-study-circle-return':{
    id:'ctx-study-circle-return',min:7,max:40,weight:1,once:true,
    when:(_l,s)=>has(s,'ctx-study-circle'),
    title:'材料箱越来越重',text:()=>`一起学习的人想继续，整理和催还的活却总落到你身上。要再做一年，得先改变分工。`,
    options:()=>[
      c('ctx-rotate','要求轮值，只再负责自己那一份','未来1年每年知识 +2、人际 +2、幸福 −1',{},0,{removeFlag:'ctx-study-circle',commitment:{id:'ctx-study-circle-plan',label:'轮值学习组',years:1,effects:{knowledge:2,social:2,happiness:-1}}}),
      c('ctx-close','把材料归还，结束这次组织工作','健康 +3 · 人际 −3',{health:3,social:-3},0,{removeFlag:'ctx-study-circle'}),
    ],
  },
  'ctx-weekend-work-return':{
    id:'ctx-weekend-work-return',min:17,max:40,weight:1,once:true,
    when:(_l,s)=>has(s,'ctx-weekend-work'),
    title:'周末习惯变成了默认',text:()=>`两年约定做完，对方却以为你下周还会来。熟悉让事情容易了，也让拒绝变难。你重新摊开自己的时间账。`,
    options:()=>[
      c('ctx-negotiate','谈一次工时和报酬，再决定续不续','人际检定 · 可能续一年，也可能谈崩',{},0,{removeFlag:'ctx-weekend-work',risk:{base:.48,stat:'social',success:{text:'你谈成了限定工时的一年续约，空出了一部分学习时间。',commitment:{id:'ctx-weekend-work-plan',label:'重新约定的周末兼职',years:1,income:400,effects:{health:-1}},familyDelta:2},failure:{text:'对方不愿调整条件，你结束了这份零活。',effects:{happiness:-3,knowledge:2},familyDelta:-2}}}),
      c('ctx-leave','按原约定离开，把周末还给学习','知识 +4 · 幸福 −2',{knowledge:4,happiness:-2},0,{removeFlag:'ctx-weekend-work'}),
    ],
  },
  'ctx-order-trial-return':{
    id:'ctx-order-trial-return',min:18,max:80,weight:1,once:true,
    when:(_l,s)=>has(s,'ctx-order-trial'),
    title:'回头客与没有算进的工时',text:()=>`试做期结束，你有了几位回头客，也有几单返工。账上看得见材料费，耗掉的晚上得你自己补记。`,
    options:()=>[
      c('ctx-expand','只保留高效订单，再承担一轮风险','花费600 · 知识检定 · 续约收入因结果而异',{},600,{removeFlag:'ctx-order-trial',risk:{base:.5,stat:'knowledge',success:{text:'你留下能按时交付的品类，接下来的两年有了较稳定的小额订单。',commitment:{id:'ctx-order-trial-plan',label:'筛选后的稳定小单',years:2,income:700,expense:200,effects:{health:-1}},flag:'ctx-orders-stable'},failure:{text:'你缩了范围，但有些订单仍估少了工时。决定只再做一年。',effects:{happiness:-4},commitment:{id:'ctx-order-trial-plan',label:'收缩中的接单试验',years:1,income:300,expense:250,effects:{health:-2}},flag:'ctx-orders-reduced'}}}),
      c('ctx-stop','停止接新单，留下可展示的作品','知识 +4 · 人际 −2',{knowledge:4,social:-2},0,{removeFlag:'ctx-order-trial',flag:'ctx-order-portfolio'}),
    ],
  },
  'ctx-evening-study-return':{
    id:'ctx-evening-study-return',min:18,max:80,weight:1,once:true,
    when:(_l,s)=>has(s,'ctx-evening-study'),
    title:'结课之后还要自己开口',text:()=>`三年的安排结束。课程作品可以拿给别人看，但它不会自动变成岗位。你要决定是否花精力参加一次能力评估。`,
    options:l=>[
      c('ctx-assess',l.age>=65?'整理作品，参加一次交流评估':'整理作品，参加一次有准备的评估',l.age>=65?'花费300 · 知识检定 · 与同好交流作品':'花费300 · 知识检定 · 可能改善工作条件',{happiness:-2},300,{removeFlag:'ctx-evening-study',risk:{base:.5,stat:'knowledge',success:{text:l.age>=65?'作品让同好看懂了你的经历，你获得了一次分享的邀请。':'作品让对方看懂了你的能力，你获得一份正式岗位。',job:l.age>=65?'retired':'employed',multiplier:l.age>=65?1:1.1,effects:{social:3},flag:'ctx-night-class-placed'},failure:{text:l.age>=65?'这次交流没有达成共识，对方指出的不足倒很具体。':'这次没有拿到岗位，对方指出的不足倒很具体。',effects:{knowledge:3,happiness:-4},flag:'ctx-night-class-reviewed'}}}),
      c('ctx-practice','不付评估费，再用一年做独立项目','未来1年每年知识 +3、幸福 −1',{},0,{removeFlag:'ctx-evening-study',commitment:{id:'ctx-evening-study-plan',label:'课程后的独立项目',years:1,effects:{knowledge:3,happiness:-1}}}),
    ],
  },
  'ctx-income-bridge-return':{
    id:'ctx-income-bridge-return',min:18,max:85,weight:1,once:true,
    when:(_l,s)=>has(s,'ctx-bridge-work'),
    title:'过渡不能一直叫过渡',text:()=>`限定零活到了约定期限。你得承认它占了多少时间，再判断它是否真的帮你接近想做的事。`,
    options:(l,s)=>l.age>=65?[
      c('ctx-retire-share','结束求职，把经验分享给需要的人','人际 +4 · 幸福 +2 · 不再争取正式岗位',{social:4,happiness:2},0,{removeFlag:'ctx-bridge-work'}),
      c('ctx-retire-close','按约结束零活，重新安排退休生活','健康 +3 · 人际 −2',{health:3,social:-2},0,{removeFlag:'ctx-bridge-work'}),
    ]:[
      c('ctx-convert',s.job==='unemployed'?'争取把已有经验变成正式岗位':'用这段经验谈更清楚的工作条件','人际检定 · 成功改善工作，失败仍付出精力',{health:-2},0,{removeFlag:'ctx-bridge-work',risk:{base:.46,stat:'social',success:{text:'你谈成了一份职责更清晰的受雇工作。',job:'employed',multiplier:1.05,effects:{happiness:4},flag:'ctx-bridge-employed'},failure:{text:'对方只想照旧安排。你没承诺续做，把精力重新转回申请。',effects:{knowledge:2,happiness:-4},flag:'ctx-bridge-ended'}}}),
      c('ctx-limit','只续一年，把工时再压低一点','未来1年每年收入 +200、知识 −1',{},0,{removeFlag:'ctx-bridge-work',commitment:{id:'ctx-bridge-work-plan',label:'减量过渡零活',years:1,income:200,effects:{knowledge:-1}}}),
    ],
  },
  'ctx-family-visits-return':{
    id:'ctx-family-visits-return',min:35,max:105,weight:1,once:true,
    when:(l,s)=>has(s,'ctx-family-visits')&&l.people.some(p=>p.alive&&p.role==='家人'),
    title:'不能总靠你临时赶到',text:l=>`为${who(l.people.find(p=>p.alive&&p.role==='家人')!)}安排的照应到了复盘时间。原本临时补上的空隙，不能永远靠同一个人撑着。`,
    options:()=>[
      c('ctx-renegotiate','重新找人分工，把边界说清楚','人际 −2 · 健康 +3 · 家庭支持 +3',{social:-2,health:3},0,{removeFlag:'ctx-family-visits',familyDelta:3,commitment:{id:'ctx-family-visits-plan',label:'重新分工后的家庭照应',years:1,income:-100,effects:{social:1}}}),
      c('ctx-extend-help','购买一段更明确的协助，自己保留跟进','未来2年每年支出 +450、健康 +1 · 家庭支持 +4',{},0,{removeFlag:'ctx-family-visits',familyDelta:4,commitment:{id:'ctx-family-help-plan',label:'明确时段的照护协助',years:2,expense:450,effects:{health:1}}}),
    ],
  },
};
