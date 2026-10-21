import type {Life, Stats} from './engine';
import type {Encounter, StoryChoice, StoryOption} from './story-types';

// Original fiction. Costs use the game's living coins, not a country's currency.
// Birth conditions gate opportunities; national GDP is never used as a claim about schools.
const c = (id:string,label:string,hint:string,effects:Partial<Stats>={},cost=0,story?:StoryChoice):StoryOption =>
  ({id,label,hint,effects,cost,...(story?{story}:{})});
const family = (l:Life) => l.people.find(p=>p.alive&&p.role==='家人');
const partner = (l:Life) => l.people.find(p=>p.alive&&p.role==='伴侣');
const child = (l:Life) => l.people.find(p=>p.alive&&p.role==='孩子');
const working = (s:{job:string}) => s.job==='employed'||s.job==='independent';
const flag = (s:{flags:string[]},key:string) => s.flags.includes(key);

export const encounters:Encounter[] = [
  {
    id:'care-shifts',min:0,max:5,weight:8,once:true,when:l=>!!family(l),
    title:'谁来接住哭声',text:(l,s)=>`${family(l)!.name}把你抱起来。${s.family.support<45?'家里能轮换照料的人不多，大人的眼睛里有红血丝。':'家里排了一张轮班表，但每个人都有别的事要忙。'}`,
    options:()=>[
      c('routine','先固定吃睡的时间','健康 +5 · 家庭支持 +3',{health:5},0,{familyDelta:3}),
      c('company','多抱一会儿，再做家务','幸福 +7 · 家庭支持 −2',{happiness:7},0,{familyDelta:-2}),
    ],
  },
  {
    id:'small-budget',min:1,max:5,weight:9,once:true,when:(_l,s)=>s.family.tier==='tight',
    title:'本月只够买一样',text:l=>`在${l.country.name}的这间屋子里，一张账单被反复折起。换季衣物和新的玩具，只能先选一样。`,
    options:()=>[
      c('warm','把钱留给合身衣物','健康 +6 · 幸福 −2',{health:6,happiness:-2},0,{familyDelta:2}),
      c('toy','选一个能玩很久的玩具','幸福 +7 · 健康 −2',{happiness:7,health:-2},0,{flag:'childhood-toy'}),
    ],
  },
  {
    id:'full-shelf',min:2,max:5,weight:6,once:true,when:(_l,s)=>s.family.tier==='comfortable',
    title:'已经摆满的书架',text:()=>`书、积木、画笔都备好了。真正稀缺的是一个不赶时间、肯陪你反复试错的下午。`,
    options:()=>[
      c('read','反复读同一本图画书','知识 +7 · 人际 −2',{knowledge:7,social:-2},0,{flag:'early-reading'}),
      c('play','把积木搬去和别人一起搭','人际 +7 · 知识 +2',{social:7,knowledge:2},0,{familyDelta:-2}),
    ],
  },
  {
    id:'child-fever',min:0,max:5,weight:7,once:true,when:l=>l.stats.health<80,
    title:'半夜亮起的灯',text:()=>`你一夜没睡安稳。照料安排被打乱，第二天原本要办的事情也得挪开。`,
    options:()=>[
      c('care','把这几天全留给休息和照料','健康 +7 · 家庭支持 −3',{health:7},0,{familyDelta:-3}),
      c('routine','守住基本作息，其他事照常','健康 +3 · 幸福 −2',{health:3,happiness:-2}),
    ],
  },
  {
    id:'first-neighborhood',min:2,max:5,weight:6,once:true,
    title:'门外的另一种声音',text:l=>`你开始记住${l.country.name}街巷里的声音。门外有陌生孩子在玩，迈过去要一点勇气。`,
    options:()=>[
      c('join','走过去，递出手里的小东西','人际 +6 · 幸福 −1',{social:6,happiness:-1}),
      c('watch','先坐在一旁看，慢慢学规则','知识 +4 · 人际 +1',{knowledge:4,social:1}),
    ],
  },
  {
    id:'spilled-cup',min:3,max:5,weight:5,once:true,
    title:'打翻的一杯水',text:()=>`杯子倒了，纸上的图案糊成一片。你还说不清是害怕挨责备，还是心疼自己的画。`,
    options:()=>[
      c('clean','拿来抹布，一点点收拾','知识 +4 · 幸福 −1',{knowledge:4,happiness:-1}),
      c('ask','叫人来看，请求帮忙','人际 +5 · 家庭支持 −1',{social:5},0,{familyDelta:-1}),
    ],
  },
  {
    id:'school-materials',min:6,max:12,weight:9,cooldown:6,when:(_l,s)=>s.family.tier==='tight',
    title:'书包里的缺项',text:()=>`新学期的清单上，有几样东西还没买齐。你发现一套旧材料还能用，只是边角写着别人的名字。`,
    options:()=>[
      c('borrow','借旧材料，自己补齐缺页','知识 +5 · 幸福 −3',{knowledge:5,happiness:-3},0,{flag:'resourceful'}),
      c('help','去问有没有共用的材料','人际 +5 · 知识 +2',{social:5,knowledge:2},0,{familyDelta:2}),
    ],
  },
  {
    id:'club-signup',min:7,max:17,weight:7,cooldown:6,
    title:'放学后的空教室',text:()=>`有人借到一间空教室办兴趣小组。没有奖状保证，也不一定有人提醒你写完作业。`,
    options:()=>[
      c('join','留下做一次小组作品','知识 +6 · 人际 +4 · 健康 −2',{knowledge:6,social:4,health:-2},0,{flag:'club-experience'}),
      c('home','按时回去，先把功课做完','知识 +3 · 人际 −2',{knowledge:3,social:-2}),
    ],
  },
  {
    id:'school-sport',min:7,max:17,weight:7,cooldown:6,
    title:'还差一个人的队伍',text:()=>`球场边有人喊你凑一队。你不算熟练，输了可能要听几句抱怨，但一直坐着也很闷。`,
    options:()=>[
      c('play','上场，把失误也算进练习','健康 +7 · 人际 +3 · 幸福 −2',{health:7,social:3,happiness:-2}),
      c('walk','不比赛，绕场慢走一圈','健康 +3 · 幸福 +2 · 人际 −1',{health:3,happiness:2,social:-1}),
    ],
  },
  {
    id:'school-friend',min:8,max:16,weight:8,once:true,
    title:'被空出来的座位',text:()=>`一个同学最近总独自吃饭。你知道坐过去可能会被别的人打趣，也知道装作没看见更容易。`,
    options:()=>[
      c('sit','端着饭坐过去','人际 +6 · 幸福 −2 · 数年后可能再遇',{social:6,happiness:-2},0,{flag:'school-friendship',queue:{after:6,id:'school-friend-return'}}),
      c('quiet','下课时单独打个招呼','人际 +3 · 知识 −1',{social:3,knowledge:-1}),
    ],
  },
  {
    id:'scholarship-preparation',min:15,max:24,weight:9,once:true,
    when:(_l,s)=>s.job==='school'&&!flag(s,'scholarship-prepared'),
    title:'那份有截止日期的申请',text:(_l,s)=>`你找到一项面向在读者的资助申请，需要作品和推荐说明。${s.family.support<45?'家里难以替你腾出时间，材料得自己一页页凑。':'家里能替你分担些杂事，但申请仍要你来写。'}`,
    options:()=>[
      c('prepare','减少娱乐，整理作品并反复修改','知识 +6 · 幸福 −5 · 次年收到结果',{knowledge:6,happiness:-5},0,{flag:'scholarship-prepared',queue:{after:1,id:'scholarship-result'}}),
      c('skip','先完成眼前课程，不赶这次申请','健康 +3 · 知识 +2',{health:3,knowledge:2},0,{flag:'scholarship-skipped'}),
    ],
  },
  {
    id:'school-income-pressure',min:13,max:17,weight:10,once:true,
    when:(_l,s)=>s.family.tier==='tight'&&s.family.support<55&&s.job==='school',
    title:'课表之外的缺口',text:()=>`家里的开支出现缺口。一份课后帮工能补一点，但每天少掉的两小时不会自己回来。`,
    options:()=>[
      c('study','先找临时援助，把学业留住','知识 +5 · 人际 +2 · 家庭支持 −3',{knowledge:5,social:2},0,{familyDelta:-3,flag:'school-persisted'}),
      c('parttime','挤出课后时间帮工','知识 −4 · 健康 −3 · 家庭支持 +7',{knowledge:-4,health:-3},0,{familyDelta:7,flag:'early-work'}),
      {...c('leave','暂时离校，进入学徒岗位','知识 −7 · 幸福 −4 · 提前开始工作',{knowledge:-7,happiness:-4},0,{job:'employed',multiplier:.62,flag:'left-school'}),career:'学徒',education:'中断学业'},
    ],
  },
  {
    id:'exam-week',min:10,max:17,weight:8,cooldown:6,when:(_l,s)=>s.job==='school',
    title:'考前最后一周',text:()=>`错题本还剩厚厚一叠。你盯着时钟算了一次，发现不可能把所有内容都再读一遍。`,
    options:()=>[
      c('focus','只补最薄弱的部分','知识 +7 · 幸福 −3',{knowledge:7,happiness:-3}),
      c('sleep','按时睡觉，接受准备不完','健康 +5 · 知识 +2',{health:5,knowledge:2}),
    ],
  },
  {
    id:'thin-school-resources',min:6,max:17,weight:9,cooldown:6,when:(_l,s)=>s.schoolQuality<.45&&s.job==='school',
    title:'共用的一本参考书',text:()=>`想查的内容不在课本里，能借到的参考书却只有一本。轮到你时，离归还只剩两天。`,
    options:()=>[
      c('copy','把关键几页抄下来慢慢研究','知识 +6 · 健康 −2',{knowledge:6,health:-2},0,{flag:'self-taught'}),
      c('group','约几个人一起读、互相讲','知识 +3 · 人际 +5',{knowledge:3,social:5}),
    ],
  },
  {
    id:'good-school-project',min:8,max:17,weight:7,cooldown:6,when:(_l,s)=>s.schoolQuality>=.65&&s.job==='school',
    title:'可以试错的实验台',text:()=>`课程留了一段自由探索时间，器材也有人指导使用。你可以冲一个难题，也可以帮小组把基础做好。`,
    options:()=>[
      c('hard','试一个大概率失败的方案','知识 +8 · 幸福 −3',{knowledge:8,happiness:-3},0,{flag:'project-practice'}),
      c('team','负责记录和演示','人际 +6 · 知识 +3',{social:6,knowledge:3}),
    ],
  },
  {
    id:'higher-education-or-work',min:17,max:23,weight:15,once:true,
    when:(l,s)=>l.education!=='高等教育'&&s.job!=='retired',
    title:'录取要求与眼前的生活费',text:(_l,s)=>`你开始核对继续求学的条件：已有的学习基础、能得到的支持，还有离开工作后的日常开支。${s.family.support>=60?'现有支持可以承担这次入学的启动费用。':'入学启动费用需要自己筹措，学习期间的生活费也不能忽略。'}`,
    options:(l,s)=>{
      const options:StoryOption[]=[];
      if((l.stats.knowledge>=42&&s.family.support>=45)||l.stats.knowledge>=65){
        const cost=s.family.support>=60?0:1200;
        options.push({...c('university','继续高等教育，把四年留给系统学习',`${cost?`花费 ${cost} · `:''}知识 +10 · 幸福 −3 · 转为在读学生`,{knowledge:10,happiness:-3},cost,{job:'school',flag:'higher-study'}),education:'高等教育',career:'学生'});
      }
      options.push({...c('entry-work','先进入入门岗位，用工作接住生活','知识 +3 · 健康 −3 · 起步收入倍率 0.72',{knowledge:3,health:-3},0,{job:'employed',multiplier:.72,flag:'early-career'}),education:l.education==='学龄前'?'基础教育':l.education,career:'入门岗位工作者'});
      options.push(c('open-study','暂缓升学，先用开放资料补基础','知识 +5 · 人际 −2 · 保持当前生活安排',{knowledge:5,social:-2},0,{flag:'self-taught'}));
      return options;
    },
  },
  {
    id:'meet-partner',min:21,max:45,weight:11,once:true,
    when:l=>!partner(l)&&!l.people.some(p=>p.id==='partner')&&l.stats.social>=38,
    title:'把下一次见面写进日程',text:()=>`你和一个新认识的人见过几次，聊得来，也有过分歧。对方想知道，你是否愿意认真试着相处，而不是一直等生活空下来。`,
    options:()=>[
      {...c('together','说清期待，开始一段认真经营的关系','建立伴侣关系 · 人际 +7 · 幸福 +6 · 健康 −2',{social:7,happiness:6,health:-2},0,{flag:'relationship-started',familyDelta:3}),partner:true},
      c('alone','坦白现在更想独自生活','幸福 +4 · 人际 −2',{happiness:4,social:-2},0,{flag:'chose-single-life'}),
    ],
  },
  {
    id:'welcome-child',min:25,max:42,weight:11,once:true,
    when:l=>!!partner(l)&&!l.people.some(p=>p.role==='孩子'||p.id==='child'),
    title:'关于照顾一个新生命',text:(l,s)=>`你和${partner(l)!.name}认真算起时间、空间和照护安排。${s.family.support>=65?'现有支持能分担一部分启动支出，但不会替你们过日子。':'外部支持有限，启动开支和后续照料主要得靠你们自己。'}你们也可以决定不成为父母。`,
    options:(_l,s)=>{
      const cost=s.family.support>=65?0:900;
      return [
        c('child','共同承担照护，迎接一个孩子',`${cost?`花费 ${cost} · `:''}新增孩子 · 人际 +8 · 健康 −5 · 日常支出增加`,{social:8,happiness:5,health:-5},cost,{familyDelta:-6,flag:'parenthood'}),
        c('without-child','决定不迎接孩子，安排两个人的生活','幸福 +4 · 健康 +3',{happiness:4,health:3},0,{flag:'without-child'}),
      ];
    },
  },
  {
    id:'vocational-training',min:18,max:55,weight:10,once:true,
    when:(_l,s)=>s.job!=='retired'&&s.job!=='school'&&!flag(s,'training-enrolled'),
    title:'一门要交作业的技能课',text:(_l,s)=>`培训班展示了真实练习和往期岗位要求。${s.family.tier==='tight'?'900 生活币不是随手能拿出的数。':'付得起费用，也得挤出晚上的时间。'}课程没有保录用。`,
    options:()=>[
      c('enroll','交费学习，把练习做完','花费 900 · 知识 +9 · 幸福 −4 · 两年后出现机会',{knowledge:9,happiness:-4},900,{flag:'training-enrolled',queue:{after:2,id:'training-offer'}}),
      c('audit','先用开放资料自学','知识 +4 · 人际 −2',{knowledge:4,social:-2},0,{flag:'self-taught'}),
    ],
  },
  {
    id:'first-interview',min:18,max:64,weight:10,cooldown:6,when:(_l,s)=>s.job==='unemployed',
    title:'面试前的一夜',text:l=>`你在${l.country.name}投出的简历终于有了回复。岗位要求不全熟悉，对方想听你做过什么，而不是你愿意多努力。`,
    options:()=>[
      c('try','整理案例，参加面试','知识检定 · 录用或被拒 · 幸福 −2',{happiness:-2},0,{risk:{base:.43,stat:'knowledge',success:{text:'对方认可你讲清问题的能力，给出了入职日期。',job:'employed',multiplier:1,flag:'interview-hired'},failure:{text:'面试没有通过。你记下两处答不上来的问题。',effects:{knowledge:4,happiness:-4},flag:'interview-practice'}}}),
      c('wait','先补作品，继续找更匹配的职位','知识 +5 · 幸福 −3',{knowledge:5,happiness:-3}),
    ],
  },
  {
    id:'probation-task',min:18,max:60,weight:7,once:true,when:(_l,s)=>s.job==='employed',
    title:'没有交接文档的任务',text:()=>`负责人说这件事不难，文件夹却有五个版本。你可以硬扛，也可以承认信息不够，先把问题列出来。`,
    options:()=>[
      c('clarify','列清问题，主动约一次交接','人际 +4 · 知识 +3 · 次年反馈',{social:4,knowledge:3},0,{flag:'probation-open',queue:{after:1,id:'probation-review'}}),
      c('overtime','自己逐个试，把今晚搭进去','知识 +6 · 健康 −5',{knowledge:6,health:-5}),
    ],
  },
  {
    id:'redundancy',min:21,max:63,weight:5,cooldown:8,when:(_l,s)=>s.job==='employed',
    title:'会议只开了十分钟',text:()=>`业务缩减，岗位被撤。纸上的交接日期很清楚，你下一步的收入还没有着落。`,
    options:()=>[
      {...c('search','接受调整，立即重新找工作','转为待业 · 幸福 −6 · 人际 +2',{happiness:-6,social:2},0,{job:'unemployed',flag:'job-loss'}),career:'待业'},
      {...c('freelance','先用零散委托接住收入','转为自由工作 · 收入倍率 0.72 · 健康 −3',{health:-3},0,{job:'independent',multiplier:.72,flag:'freelance-start'}),career:'零散接单'},
    ],
  },
  {
    id:'weekend-gig',min:18,max:64,weight:7,once:true,when:(_l,s)=>s.job!=='retired',
    title:'周末的一笔委托',text:()=>`有人找你做一件零活，约好验收后结款。交付范围只有几行字，你看见里面有两处容易扯皮。`,
    options:()=>[
      c('contract','写清范围，再投入一个周末','健康 −4 · 人际 +2 · 次年验收',{health:-4,social:2},0,{flag:'gig-open',queue:{after:1,id:'gig-payment'}}),
      c('decline','推掉，保住这一段休息','健康 +4 · 人际 −2',{health:4,social:-2}),
    ],
  },
  {
    id:'rental-choice',min:18,max:60,weight:8,cooldown:7,
    title:'两间房的差价',text:()=>`一间住处便宜些，但通勤很长；另一间离日常目的地近，搬进去要先付一笔安置费用。`,
    options:()=>[
      c('near','花钱换短一点的通勤','花费 1200 · 健康 +6 · 幸福 +3',{health:6,happiness:3},1200,{flag:'short-commute'}),
      c('far','留在便宜住处，重新排作息','健康 −3 · 知识 +2',{health:-3,knowledge:2},0,{flag:'long-commute'}),
    ],
  },
  {
    id:'rental-repair',min:18,max:80,weight:6,once:true,
    title:'墙角那片水渍',text:()=>`水渍又大了一圈。口头提醒没有下文，你得决定是先自己解决，还是把日期、照片和请求整理好。`,
    options:()=>[
      c('record','记录问题，正式提出维修请求','人际 −2 · 知识 +3 · 次年回响',{social:-2,knowledge:3},0,{flag:'repair-request',queue:{after:1,id:'repair-reply'}}),
      c('pay','先处理自己能处理的部分','花费 600 · 健康 +4 · 幸福 +2',{health:4,happiness:2},600),
    ],
  },
  {
    id:'shared-housework',min:18,max:80,weight:7,cooldown:6,when:l=>!!partner(l),
    title:'谁记得买最后一袋米',text:l=>`${partner(l)!.name}说，难受的不只是做了多少事，而是总要记住所有事。桌上的清单越写越长。`,
    options:()=>[
      c('split','把整块责任分开，各自负责到底','人际 +7 · 幸福 −2',{social:7,happiness:-2},0,{familyDelta:4}),
      c('service','购买一次外部帮助，先缓一口气','花费 500 · 幸福 +5 · 人际 +2',{happiness:5,social:2},500,{familyDelta:1}),
    ],
  },
  {
    id:'child-time',min:25,max:80,weight:7,cooldown:6,when:l=>!!child(l),
    title:'一句等你有空',text:l=>`${child(l)!.name}想让你看一件做了很久的东西。你手头的事还没做完，“等一下”已经说过两次。`,
    options:()=>[
      c('listen','合上手头的事，认真看完','人际 +8 · 知识 −2',{social:8,knowledge:-2},0,{familyDelta:3}),
      c('schedule','约一个准确时间，并守住它','人际 +4 · 幸福 −1',{social:4,happiness:-1}),
    ],
  },
  {
    id:'family-care',min:35,max:64,weight:8,once:true,when:l=>!!family(l),
    title:'照护表上的空白',text:l=>`${family(l)!.name}最近需要更多日常帮助。你查了自己的日程，发现每个可用时段都已有安排。`,
    options:()=>[
      c('self','调整自己的工作，固定去照应','健康 −4 · 人际 +6 · 家庭支持 +6',{health:-4,social:6},0,{familyDelta:6,flag:'care-arrangement',queue:{after:2,id:'care-review'}}),
      c('paid','找可靠的外部照护，自己定期跟进','花费 1800 · 人际 +3 · 家庭支持 +4',{social:3},1800,{familyDelta:4,flag:'care-arrangement',queue:{after:2,id:'care-review'}}),
    ],
  },
  {
    id:'health-warning',min:18,max:85,weight:9,once:true,when:l=>l.stats.health<60,
    title:'总被推后的检查',text:()=>`疲惫已经影响到白天。你翻到那条保存过的预约信息，日期还是很久以前。`,
    options:()=>[
      c('book','安排评估，并记录最近的状况','花费 700 · 健康 +5 · 次年跟进',{health:5},700,{flag:'health-followup',queue:{after:1,id:'health-review'}}),
      c('rest','先减少负荷，固定休息时间','健康 +4 · 幸福 −2',{health:4,happiness:-2},0,{flag:'rest-plan'}),
    ],
  },
  {
    id:'work-burnout',min:22,max:64,weight:8,cooldown:6,when:(l,s)=>working(s)&&(l.stats.health<50||l.stats.happiness<45),
    title:'屏幕亮着，人已经空了',text:()=>`今天没有格外严重的事故，你却连一条普通消息也不想回。再接一项任务，会让下个月好看一点。`,
    options:()=>[
      c('boundary','拒绝新增任务，守住下班时间','健康 +6 · 幸福 +3 · 人际 −3',{health:6,happiness:3,social:-3}),
      c('push','再接一次，换取议价筹码','健康 −6 · 幸福 −4 · 收入倍率 1.12',{health:-6,happiness:-4},0,{multiplier:1.12,flag:'overworked'}),
    ],
  },
  {
    id:'small-business',min:18,max:60,weight:8,once:true,when:(_l,s)=>s.job!=='retired'&&s.job!=='school',
    title:'一张算了三遍的成本表',text:()=>`你想试着经营一门小生意。进货、工具、退换和自己的工时，第一次被放进同一张表里。`,
    options:()=>[
      {...c('launch','拿出小批量启动资金，亲自经营','花费 1500 · 知识 +5 · 转自由经营 · 两年后结算',{knowledge:5},1500,{job:'independent',multiplier:.85,flag:'business-open',queue:{after:2,id:'business-review'}}),career:'小生意经营者'},
      c('test','先做不收钱的需求访谈','人际 +4 · 知识 +3 · 暂不营业',{social:4,knowledge:3},0,{flag:'business-research'}),
    ],
  },
  {
    id:'vague-contract',min:20,max:64,weight:7,cooldown:6,when:(_l,s)=>working(s),
    title:'写着以后再说的条款',text:()=>`对方催着确认合作，报酬看着不错，交付范围却很模糊。你把那一行又读了一遍。`,
    options:()=>[
      c('clarify','要求补齐条款，接受谈崩的可能','人际 −2 · 知识 +5',{social:-2,knowledge:5},0,{flag:'contract-boundaries'}),
      c('accept','先接下，用经验赌一次','人际检定 · 收款或返工 · 健康 −3',{health:-3},0,{risk:{base:.48,stat:'social',success:{text:'对方按约验收，你收到一笔结款。',cash:1100,effects:{happiness:3}},failure:{text:'修改范围越扩越大，你花掉更多工时才结束合作。',effects:{health:-6,happiness:-5},flag:'contract-lesson'}}}),
    ],
  },
  {
    id:'debt-call',min:18,max:85,weight:9,cooldown:6,when:l=>l.debt>500,
    title:'不想再点开的余额',text:l=>`你欠下的${Math.round(l.debt).toLocaleString()}生活币还在计息。躲开数字会让今晚轻松些，却不会改变下个月。`,
    options:()=>[
      c('plan','列还款顺序，削减可推迟的开支','知识 +4 · 幸福 −4',{knowledge:4,happiness:-4},0,{flag:'debt-plan'}),
      c('extra','找额外工时，先守住现金流','健康 −5 · 人际 +3',{health:-5,social:3},0,{flag:'extra-hours'}),
    ],
  },
  {
    id:'city-opportunity',min:18,max:55,weight:7,once:true,when:(_l,s)=>s.opportunity>=.55&&s.job!=='school',
    title:'另一个街区的机会',text:l=>`在${l.country.name}，有人介绍了一个更远的岗位。搬过去能接近工作，也会离熟悉的人和习惯更远。`,
    options:()=>[
      {...c('move','花钱搬迁，争取新的岗位','花费 2000 · 人际 −5 · 知识 +5 · 转为受雇',{social:-5,knowledge:5},2000,{job:'employed',multiplier:1.15,flag:'moved-for-work'}),move:true,career:'异地工作者'},
      c('local','留在现住地，扩大本地联系','人际 +5 · 幸福 +2',{social:5,happiness:2}),
    ],
  },
  {
    id:'promotion-choice',min:25,max:60,weight:7,cooldown:8,when:(l,s)=>s.job==='employed'&&l.stats.knowledge>=45,
    title:'升职之后，谁来顶班',text:()=>`新职务带来更多报酬，也意味着别人出错时你要留下收尾。你开始认真计算这笔交换。`,
    options:()=>[
      c('accept','接下职责，学习带人','人际 +4 · 健康 −5 · 收入倍率 1.25',{social:4,health:-5},0,{multiplier:1.25,flag:'management'}),
      c('specialist','保留现在的岗位，继续做熟练的事','知识 +5 · 幸福 +3',{knowledge:5,happiness:3}),
    ],
  },
  {
    id:'friend-borrowing',min:20,max:75,weight:6,cooldown:8,
    title:'聊天框里的借款请求',text:()=>`一个旧同学开口借钱，只说周转一下。你们很久没见过，这个数目已经超过你能当礼物送出的范围。`,
    options:()=>[
      c('small','只给能承受的小额帮助，不约定回报','花费 500 · 人际 +3 · 幸福 −2',{social:3,happiness:-2},500),
      c('no','说明不能借款，提供其他可行办法','人际 −3 · 知识 +2',{social:-3,knowledge:2}),
    ],
  },
  {
    id:'midlife-retraining',min:45,max:64,weight:9,once:true,when:(_l,s)=>s.job==='unemployed'||(s.job==='employed'&&flag(s,'overworked')),
    title:'和年轻人一起交作业',text:()=>`想换的方向需要重新入门。报名表没有嫌你年纪大，你倒先算起还剩多少年值得折腾。`,
    options:()=>[
      c('learn','报短课，从练习和作品开始','花费 1100 · 知识 +8 · 幸福 −3 · 次年回响',{knowledge:8,happiness:-3},1100,{flag:'retraining-open',queue:{after:1,id:'retraining-offer'}}),
      c('reuse','梳理原有经验，先找相邻工作','知识 +3 · 人际 +4',{knowledge:3,social:4}),
    ],
  },
  {
    id:'adult-night-study',min:18,max:64,weight:7,cooldown:6,when:(_l,s)=>flag(s,'left-school')||s.family.tier==='tight',
    title:'下班后翻开的课本',text:()=>`你看到一门可以自定进度的课程。没有人检查你是否认真，几次中断后，很可能就再也不打开。`,
    options:()=>[
      c('schedule','每周留两个晚上，只完成小目标','知识 +7 · 幸福 −3',{knowledge:7,happiness:-3},0,{flag:'adult-study'}),
      c('group','找一个互相检查进度的小组','知识 +4 · 人际 +4 · 健康 −2',{knowledge:4,social:4,health:-2}),
    ],
  },
  {
    id:'retirement-budget',min:65,max:85,weight:9,once:true,when:(_l,s)=>s.job==='retired',
    title:'不再按发薪日安排生活',text:l=>`退休后的固定收入和从前不同。你把每月支出重新抄了一遍，${l.debt>0?'还款那一栏仍在。':'突然发现几项习惯开支可以重新决定。'}`,
    options:()=>[
      c('budget','先订预算，给意外支出留位置','知识 +5 · 幸福 −3',{knowledge:5,happiness:-3},0,{flag:'retirement-budget'}),
      c('simple','降低日常消费，多去免费的地方','健康 +4 · 人际 +2 · 幸福 −2',{health:4,social:2,happiness:-2}),
    ],
  },
  {
    id:'community-table',min:65,max:100,weight:8,cooldown:6,
    title:'活动室的空椅子',text:()=>`社区活动室每周开门。有人下棋，有人整理旧照片，也有人只是来找个说话的地方。报名后就有人等你来。`,
    options:()=>[
      c('regular','固定参加，帮忙收拾场地','人际 +7 · 健康 −2',{social:7,health:-2},0,{flag:'community-regular'}),
      c('dropin','偶尔去坐坐，保留自己的节奏','幸福 +4 · 人际 +2',{happiness:4,social:2}),
    ],
  },
  {
    id:'grown-child-boundary',min:65,max:95,weight:7,cooldown:7,when:l=>!!child(l),
    title:'关心之后的分寸',text:l=>`${child(l)!.name}没有照你的建议安排生活。你想再说一遍，也意识到自己的经验不能替对方过日子。`,
    options:()=>[
      c('ask','先问对方需要建议，还是只想聊聊','人际 +6 · 幸福 +2',{social:6,happiness:2},0,{familyDelta:3}),
      c('stepback','把注意力放回自己的日程','健康 +4 · 人际 −2',{health:4,social:-2}),
    ],
  },
  {
    id:'old-classmate-call',min:65,max:95,weight:6,cooldown:8,
    title:'一个旧同学的邀请',text:()=>`一位还联系得上的旧同学提议见面。群里有人讲旧事，也有人不再回复；你不知道席间会谈起什么。`,
    options:()=>[
      c('visit','带一张旧照片去赴约','花费 300 · 人际 +7 · 幸福 +2',{social:7,happiness:2},300),
      c('call','不远行，约一次长些的通话','人际 +3 · 幸福 +2',{social:3,happiness:2}),
    ],
  },
  {
    id:'daily-care',min:65,max:105,weight:10,cooldown:6,when:l=>l.stats.health<55,
    title:'一个人做完越来越费力',text:l=>`买菜和收拾房间开始占掉大半天。${l.people.some(p=>p.alive)?'你考虑怎样向身边还在的人开口。':'你开始查找社区能提供的支持。'}`,
    options:()=>[
      c('support','减少非必要的事，申请能找到的支持','健康 +4 · 人际 +3 · 幸福 −2',{health:4,social:3,happiness:-2},0,{flag:'care-support'}),
      c('paid','付费安排一段日常协助','花费 1400 · 健康 +7 · 幸福 +2',{health:7,happiness:2},1400),
    ],
  },
  {
    id:'old-notebooks',min:65,max:105,weight:6,once:true,
    title:'抽屉里没写完的本子',text:()=>`整理时翻出几本旧笔记，有算账、地址和只写了开头的计划。有些事已经来不及重做，有些还可以讲清楚。`,
    options:()=>[
      c('record','挑几页整理，记下当时真实的处境','知识 +5 · 幸福 −2',{knowledge:5,happiness:-2},0,{flag:'life-record'}),
      c('leave','只保留想留的，给抽屉腾点空','幸福 +4 · 知识 −1',{happiness:4,knowledge:-1}),
    ],
  },
  {
    id:'retired-small-work',min:65,max:78,weight:7,once:true,when:(l,s)=>s.job==='retired'&&l.stats.health>=55,
    title:'每周两天的小工作',text:()=>`有人需要一位做事稳妥的帮手，时间不长，报酬也不高。答应后，自由安排的日子又要空出两天。`,
    options:()=>[
      c('help','接一次短期任务，不承诺长期','健康 −3 · 人际 +4 · 结款检定',{health:-3,social:4},0,{risk:{base:.7,stat:'knowledge',success:{text:'短期任务按约结束，你拿到报酬，也发现自己仍能解决不少问题。',cash:700,effects:{happiness:3}},failure:{text:'实际工作比说好的琐碎，结束时你决定不再续接。',cash:300,effects:{health:-3,happiness:-3}}}}),
      c('free','把空闲留给自己的事情','健康 +3 · 幸福 +3',{health:3,happiness:3}),
    ],
  },
];

export const followups:Record<string,Encounter> = {
  'training-offer':{
    id:'training-offer',min:18,max:70,weight:1,once:true,
    when:(l,s)=>flag(s,'training-enrolled')&&s.job!=='retired'&&l.age<65,
    title:'练习终于变成了敲门砖',text:()=>`以前做的训练项目被翻出来，一家单位愿意安排实操面试。机会不是录用通知，练习薄弱的部分仍会露出来。`,
    options:()=>[
      c('interview','带作品参加实操面试','知识检定 · 争取受雇岗位',{happiness:-2},0,{removeFlag:'training-enrolled',risk:{base:.52,stat:'knowledge',success:{text:'你完成了实操任务，获得一份与新技能相关的岗位。',job:'employed',multiplier:1.18,effects:{happiness:5},flag:'training-placed'},failure:{text:'实操未过，但你拿到了明确的不足清单。',effects:{knowledge:4,happiness:-5},flag:'training-tested'}}}),
      c('decline','暂不转岗，把技能留在现有生活里','知识 +3 · 幸福 +2',{knowledge:3,happiness:2},0,{removeFlag:'training-enrolled',flag:'training-kept'}),
    ],
  },
  'business-review':{
    id:'business-review',min:18,max:80,weight:1,once:true,
    when:(_l,s)=>flag(s,'business-open')&&s.job==='independent',
    title:'流水不等于赚到的钱',text:()=>`小生意终于有一段完整账期。扣除材料、退换和积压，账本上的数字比收款记录冷静得多。`,
    options:()=>[
      c('continue','砍掉低效项目，再经营一轮','知识检定 · 可能结余，也可能亏损',{health:-3},0,{removeFlag:'business-open',risk:{base:.48,stat:'knowledge',success:{text:'缩小品类后，老客户愿意再来。账期结余 2200 生活币。',cash:2200,multiplier:1.12,flag:'business-stable'},failure:{text:'积压占住了现金，清货后仍亏损 800 生活币。',cash:-800,multiplier:.7,effects:{happiness:-6},flag:'business-loss'}}}),
      {...c('close','清点剩余物品，结束这次尝试','转为待业 · 知识 +3 · 幸福 −3',{knowledge:3,happiness:-3},0,{removeFlag:'business-open',job:'unemployed',flag:'business-closed'}),career:'待业'},
    ],
  },
  'scholarship-result':{
    id:'scholarship-result',min:15,max:35,weight:1,once:true,
    when:(_l,s)=>flag(s,'scholarship-prepared')&&s.job==='school',
    title:'申请系统开放查询',text:()=>`你准备过的申请进入最后审核。作品和说明已经定稿，此刻只能决定是否补上最后一段陈述。`,
    options:()=>[
      c('submit','确认材料，完成最终陈述','知识检定 · 资助结果可能不同',{},0,{removeFlag:'scholarship-prepared',risk:{base:.5,stat:'knowledge',success:{text:'申请获批，收到 2000 生活币学习资助。这能缓一口气，但不保证下一次。',cash:2000,effects:{happiness:6},flag:'scholarship-awarded'},failure:{text:'名额没有轮到你。准备的作品仍归你，接下来的开支需要另找办法。',effects:{knowledge:3,happiness:-5},flag:'scholarship-declined'}}}),
      c('withdraw','撤回这次申请，先减轻眼前负荷','健康 +4 · 幸福 −2',{health:4,happiness:-2},0,{removeFlag:'scholarship-prepared',flag:'scholarship-withdrawn'}),
    ],
  },
  'school-friend-return':{
    id:'school-friend-return',min:14,max:45,weight:1,once:true,
    when:(_l,s)=>flag(s,'school-friendship'),
    title:'旧同学还记得那顿饭',text:()=>`一次偶遇，一个旧同学提起你当年坐过去吃饭的事。你没想到，对方记得的细节比你多。`,
    options:()=>[
      c('talk','推迟手头小事，坐下来聊一会儿','人际 +7 · 知识 −2',{social:7,knowledge:-2},0,{removeFlag:'school-friendship'}),
      c('brief','交换近况，认真说声再见','人际 +3 · 幸福 +2',{social:3,happiness:2},0,{removeFlag:'school-friendship'}),
    ],
  },
  'probation-review':{
    id:'probation-review',min:18,max:70,weight:1,once:true,
    when:(_l,s)=>flag(s,'probation-open')&&s.job==='employed',
    title:'上次那份交接清单',text:()=>`你留下的问题清单被拿来做新人的参考。负责人问你愿不愿意多承担一部分交接工作。`,
    options:()=>[
      c('lead','接受额外职责，同时谈清报酬','人际 +4 · 健康 −3 · 收入倍率 1.1',{social:4,health:-3},0,{removeFlag:'probation-open',multiplier:1.1}),
      c('limit','交出文档，把精力留在本职工作','知识 +3 · 幸福 +2',{knowledge:3,happiness:2},0,{removeFlag:'probation-open'}),
    ],
  },
  'gig-payment':{
    id:'gig-payment',min:18,max:85,weight:1,once:true,
    when:(_l,s)=>flag(s,'gig-open'),
    title:'验收消息终于到了',text:()=>`之前那笔委托发来验收意见。有一项不在原范围内，你找到了当时写下的约定。`,
    options:()=>[
      c('hold','按约定解释范围，争取结清','人际检定 · 结款或继续耗费精力',{},0,{removeFlag:'gig-open',risk:{base:.58,stat:'social',success:{text:'双方按原范围验收，你收到 1000 生活币。',cash:1000,flag:'gig-paid'},failure:{text:'对方只肯结清基础部分。你收到 400 生活币，也不再续接。',cash:400,effects:{happiness:-4},flag:'gig-dispute'}}}),
      c('finish','放弃尾款，结束这次合作','幸福 −3 · 健康 +2',{happiness:-3,health:2},0,{removeFlag:'gig-open'}),
    ],
  },
  'repair-reply':{
    id:'repair-reply',min:18,max:100,weight:1,once:true,
    when:(_l,s)=>flag(s,'repair-request'),
    title:'维修安排有了回复',text:()=>`对方愿意来处理，但时间正撞上你的另一件安排。拖了很久的问题，这次需要有人在场确认。`,
    options:()=>[
      c('stay','调整安排，现场确认处理范围','健康 +5 · 幸福 −2',{health:5,happiness:-2},0,{removeFlag:'repair-request'}),
      c('delegate','付费请人代为等待并记录','花费 400 · 健康 +4 · 人际 +1',{health:4,social:1},400,{removeFlag:'repair-request'}),
    ],
  },
  'health-review':{
    id:'health-review',min:18,max:110,weight:1,once:true,
    when:(_l,s)=>flag(s,'health-followup'),
    title:'记录里的生活习惯',text:()=>`整理近期记录时，你发现状态差的日子常挤在连续忙碌之后。跟进安排提醒你，改变得落在日程上。`,
    options:()=>[
      c('adjust','长期减少一部分负担','健康 +7 · 幸福 −3',{health:7,happiness:-3},0,{removeFlag:'health-followup',flag:'health-routine'}),
      c('support','付费寻求进一步评估和生活安排支持','花费 800 · 健康 +6 · 幸福 +2',{health:6,happiness:2},800,{removeFlag:'health-followup'}),
    ],
  },
  'care-review':{
    id:'care-review',min:35,max:100,weight:1,once:true,
    when:(l,s)=>flag(s,'care-arrangement')&&!!family(l),
    title:'原来的照护表已经不够',text:l=>`${family(l)!.name}的日常需要变了。你们重新看那张排班表，旧安排里的空隙比想象中多。`,
    options:()=>[
      c('replan','重新商量分工，不把责任全揽下来','人际 +5 · 幸福 −2 · 家庭支持 +3',{social:5,happiness:-2},0,{removeFlag:'care-arrangement',familyDelta:3}),
      c('more','扩大外部照护时间','花费 1600 · 健康 +4 · 家庭支持 +5',{health:4},1600,{removeFlag:'care-arrangement',familyDelta:5}),
    ],
  },
  'retraining-offer':{
    id:'retraining-offer',min:45,max:70,weight:1,once:true,
    when:(l,s)=>flag(s,'retraining-open')&&s.job!=='retired'&&l.age<65,
    title:'从熟练者重新做新人',text:()=>`短课里的作品带来一次岗位接洽。新职位起步待遇一般，却允许你把过去的经验带进去。`,
    options:()=>[
      c('try','接受试岗，承认还要重新学','知识检定 · 可能进入新岗位',{happiness:-2},0,{removeFlag:'retraining-open',risk:{base:.5,stat:'knowledge',success:{text:'你适应了新的工作流程，正式进入岗位。',job:'employed',multiplier:.95,effects:{social:4},flag:'retrained-employed'},failure:{text:'试岗没有转正，你确定了下一步该补的技能。',effects:{knowledge:4,happiness:-5},flag:'retraining-tested'}}}),
      c('keep','不接试岗，把新技能用于小委托','知识 +3 · 人际 +2',{knowledge:3,social:2},0,{removeFlag:'retraining-open'}),
    ],
  },
};
