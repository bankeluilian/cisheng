import type {Life, Stats} from './engine';
import type {Encounter, StoryChoice, StoryOption} from './story-types';

const choice = (id:string, label:string, hint:string, effects:Partial<Stats>, story?:StoryChoice, keepsake?:string):StoryOption =>
 ({id,label,hint,effects,story,keepsake});

const caregiver = (life:Life) => {
 const person=life.people.find(p=>p.role==='家人'&&p.alive);
 if(!person)return '家里照顾你的人';
 return person.fullName?`${person.name}（${person.fullName}）`:person.name;
};

export const openingEncounters:Encounter[] = [
 {
  id:'thread-opening-rent',min:1,max:1,weight:1,once:true,
  when:(_l,s)=>s.family.tier==='tight',
  title:'一张夹进门缝的涨租单',
  text:l=>`在${l.country.name}的这个家，${caregiver(l)}算了两遍新房租。亲友愿意腾出半间屋，可搬去以后，原来熟悉的邻居和照看你的人都要重新认识。`,
  options:()=>[
   choice('opening-rent-move','搬到亲友旁边，请他们搭把手','多一个照顾你的人，也要适应新住处',{happiness:-2},{flag:'opening-rent-moved',familyDelta:5,queue:{after:2,id:'thread-opening-rent-return'}}),
   choice('opening-rent-stay','先住下去，重新算每月开支','保住熟悉的生活，家里能用的钱更紧',{happiness:3},{flag:'opening-rent-stayed',familyDelta:-4,queue:{after:2,id:'thread-opening-rent-return'}}),
  ],
 },
 {
  id:'thread-opening-shift',min:1,max:1,weight:1,once:true,
  when:(_l,s)=>s.family.tier==='steady',
  title:'来接你的人换了班',
  text:l=>`${caregiver(l)}有机会换到一段更稳定的工时，但有几天赶不上回来照顾你。熟悉的邻居愿意互相照看孩子，只需要两家把日子商量好。`,
  options:()=>[
   choice('opening-shift-share','和邻居轮着照看，接下新班次','两家开始互相帮忙，也要腾出各自的时间',{social:4},{flag:'opening-shift-shared',familyDelta:3,queue:{after:2,id:'thread-opening-shift-return'}}),
   choice('opening-shift-keep','把这段时间留在家里','原来的照料方式继续，错过这次换班',{happiness:4},{flag:'opening-shift-kept',queue:{after:2,id:'thread-opening-shift-return'}}),
  ],
 },
 {
  id:'thread-opening-sunday',min:1,max:1,weight:1,once:true,
  when:(_l,s)=>s.family.tier==='comfortable',
  title:'日历上空着一个星期日',
  text:l=>`${caregiver(l)}在两张纸上写了同一个时间。一张是可以试听的亲子小课，另一张是邻居约好去公园的时间。钱付得起，能陪你的下午却只有一个。`,
  options:()=>[
   choice('opening-sunday-class','去小课上看看你喜欢什么','有人带你尝试新东西，周末需要按约出门',{knowledge:5},{flag:'opening-sunday-class',queue:{after:2,id:'thread-opening-sunday-return'}}),
   choice('opening-sunday-park','带上点心，和邻居一起去公园','多一些自在玩耍的时间，也慢慢交到朋友',{social:4,happiness:2},{flag:'opening-sunday-park',queue:{after:2,id:'thread-opening-sunday-return'}}),
  ],
 },
];

export const openingFollowups:Record<string,Encounter> = {
 'thread-opening-rent-return':{
  id:'thread-opening-rent-return',min:3,max:6,weight:1,once:true,title:'墙上的身高线',
  text:(_l,s)=>s.flags.includes('opening-rent-moved')
   ?'亲友腾出的房间里，你已经有了自己的杯子。如今他们要收回那半间屋，你们可以在附近找个小住处，也可以回原来的街巷。'
   :'你仍记得门口那家店每天几点开门。街坊听说了涨租的事，给家里介绍了一处更便宜的住处。新房离这里不远，只是窗子小了些。',
  options:(_l,s)=>[
   choice('opening-rent-near',s.flags.includes('opening-rent-moved')?'在亲友附近找个小住处':'搬去街坊介绍的小住处','日常负担轻一些，也得重新布置房间',{happiness:-1},{flag:'opening-rent-settled',familyDelta:5},'一截画过身高线的纸尺'),
   choice('opening-rent-old',s.flags.includes('opening-rent-moved')?'回到原来的街巷':'把熟悉的这个家再多留一阵','保留熟悉的生活，把省钱的事慢慢做',{happiness:5},{flag:'opening-rent-settled',familyDelta:-2},'一张画着旧街巷的小纸片'),
  ],
 },
 'thread-opening-shift-return':{
  id:'thread-opening-shift-return',min:3,max:6,weight:1,once:true,title:'家门口多了一只书包',
  text:(_l,s)=>s.flags.includes('opening-shift-shared')
   ?'那户轮流照看过你的邻居临时走不开。对方的孩子背着小书包站在门口，怀里还抱着上次和你没拼完的积木。'
   :'家里原来坚持自己照看你。今天邻居临时走不开，来问能不能让孩子在你家待半天。你们在楼道见过几次，还没一起玩过。',
  options:()=>[
   choice('opening-shift-welcome','一起把小书包接过来','给邻居腾出半天，家里的安排会忙一些',{social:6},{flag:'opening-shift-settled',familyDelta:-2},'两个人拼好的小木桥'),
   choice('opening-shift-help','陪对方等一会儿，帮忙联系另一位邻居','给邻居找一个能帮忙的人，也守住原来的安排',{social:3,happiness:2},{flag:'opening-shift-settled'},'一张写着两家门牌的纸条'),
  ],
 },
 'thread-opening-sunday-return':{
  id:'thread-opening-sunday-return',min:3,max:6,weight:1,once:true,title:'画纸上的第一个朋友',
  text:(_l,s)=>s.flags.includes('opening-sunday-class')
   ?'上过几次小课后，你等着的已经不只是新画笔。和你同桌的孩子要换时间，问你们还能不能一起画完那只歪歪扭扭的船。'
   :'在公园认识的孩子带了一盒蜡笔。雨下得太大，去不成公园了。你们可以在屋里继续昨天画的船，也可以等雨停再见。',
  options:()=>[
   choice('opening-sunday-finish','换个地方，把船一起画完','你们会有一件可以共同记住的东西',{knowledge:2,social:5},{flag:'opening-sunday-settled'},'两个人画完的一只蜡笔小船'),
   choice('opening-sunday-next','把画纸送给对方，约下次各带一张画','留住约定，也各自试试想画的东西',{knowledge:4,happiness:2},{flag:'opening-sunday-settled'},'画在两张纸上的小船'),
  ],
 },
};

export const openingThreads = [
 {id:'opening-rent',title:'房租单后面的家',start:'opening-rent-moved',alternateStart:'opening-rent-stayed',done:['opening-rent-settled'],queue:'thread-opening-rent-return',waiting:'这次住在哪里的决定，还会影响几年后的去留。',closed:'你为家选了下一个能安心量身高的地方。'},
 {id:'opening-shift',title:'两家的半天',start:'opening-shift-shared',alternateStart:'opening-shift-kept',done:['opening-shift-settled'],queue:'thread-opening-shift-return',waiting:'那户曾经愿意帮忙的邻居，也会有需要搭把手的一天。',closed:'你们都记得那只小书包等在门口的下午。'},
 {id:'opening-sunday',title:'星期日画的小船',start:'opening-sunday-class',alternateStart:'opening-sunday-park',done:['opening-sunday-settled'],queue:'thread-opening-sunday-return',waiting:'一个星期日结识的人，还会和你一起翻开画纸。',closed:'你把那只小船带进了往后的人生。'},
];

export const lifeTurns:Encounter[] = [
 {
  id:'turn-closed-bridge',min:13,max:29,weight:10,once:true,title:'桥封了，报名今天截止',
  text:()=> '你带着攒了很久的作品赶去报名。最短的路临时封了，绕过去可能迟到。旁边也有个赶时间的人，手里拿着同一张通知。',
  options:()=>[
   choice('turn-bridge-reroute','一起绕路，尽力赶到截止前','有机会交出作品，也可能赶不上',{}, {risk:{base:.62,stat:'knowledge',success:{text:'门卫正准备锁门。你把作品递了进去，也把旁边那个人的名字记在了名单边上。',effects:{knowledge:6,social:4}},failure:{text:'你们晚到了几分钟。回程路上，对方问愿不愿意下次一起准备。',effects:{happiness:-3,social:3}}}}),
   choice('turn-bridge-rework','把作品带回家，留给下一次征集','这次交不上，但能把赶工留下的毛病修完',{knowledge:4,happiness:-2}),
  ],
 },
 {
  id:'turn-power-outage',min:25,max:82,weight:11,once:true,title:'停电那晚，有人来敲门',
  text:()=> '楼道一下子静下来。隔壁的人刚买了一堆食材，冰箱停了，问大家愿不愿意在院子里把能做的东西都做掉。你原本只想吃完自己的饭就休息。',
  options:()=>[
   choice('turn-outage-cook','拿出家里的锅，和大家一起做','会忙到很晚，也能认识平时只打过招呼的人',{social:7,health:-2},undefined,'停电那晚写下的拼桌菜单'),
   choice('turn-outage-share','把手电借过去，回家早点睡','帮楼道留一点光，也把休息时间留给自己',{health:4,social:2}),
  ],
 },
];

const outcomes:Record<string,string> = {
 'opening-rent-move':'亲友把房门推开，你看见半间屋里已经放好了给你的小床。',
 'opening-rent-stay':'那张涨租单被夹进账本。晚上，窗外仍是你听熟的脚步声。',
 'opening-shift-share':'两家人把能照看的日子圈在同一张纸上。邻居说，钥匙就先放你们这里。',
 'opening-shift-keep':'家里把换班的机会婉拒了。那几天，来接你的人仍然在原来的时间出现。',
 'opening-sunday-class':'你摸了半天不同颜色的蜡笔，最后抓住一支蓝色的。旁边的孩子也选了蓝色。',
 'opening-sunday-park':'你们没照着任何安排玩。回家时，你把捡来的小树叶分给了新认识的孩子。',
 'opening-rent-near':'大人把旧身高线描在纸尺上，带到了新房。你踮脚去够最上面那一道。',
 'opening-rent-old':'你沿着熟悉的路走回家，第一次从门口认出了自己住的那一扇窗。',
 'opening-shift-welcome':'积木桥一直搭到晚饭前。回家时，对方把桥留在这里，说下次还想接着玩。',
 'opening-shift-help':'另一位邻居来接孩子时，你帮忙背了一会儿书包，记住了对方家是哪扇门。',
 'opening-sunday-finish':'船终于画完了，两个人各给它添了一面小旗。',
 'opening-sunday-next':'你把没画完的船送了出去。下次见面时，两张纸上出现了两片不一样的海。',
 'turn-bridge-rework':'你把作品拆开重做了一次。第一眼就能看出，当时是哪里太着急了。',
 'turn-outage-cook':'来电时，桌上的碗已经空了。有人把今晚每个人带来的东西写成一张菜单。',
 'turn-outage-share':'第二天，手电被挂回你的门把手上，边上多了两块昨天烤的面包。',
};

export function lifeTurnOutcome(id:string){return outcomes[id];}
