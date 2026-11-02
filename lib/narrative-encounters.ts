import type {Life,Stats} from './engine';
import type {Encounter,StoryChoice,StoryOption} from './story-types';
const option=(id:string,label:string,hint:string,effects:Partial<Stats>,story?:StoryChoice,keepsake?:string):StoryOption=>({id,label,hint,effects,...(story?{story}:{}),...(keepsake?{keepsake}:{})});
const relative=(l:Life)=>l.people.find(p=>p.role==='家人'&&p.alive);
// Original, optional fiction. People outside the relationship model remain unnamed.
export const narrativeEncounters:Encounter[]=[
 {id:'thread-letter',min:10,max:17,weight:8,once:true,title:'同桌要搬走了',
  text:()=> '放学后，同桌还没收书包。过了一会儿才说，家里要搬去别的地方。你们约好以后写信，可谁也不知道，长大以后还能不能找到彼此。',
  options:()=>[
   option('thread-letter-write','写好地址，把约定认真留下','人际 +5 · 8 年后可能有一封回信',{social:5},{flag:'thread-letter-started',queue:{after:8,id:'thread-letter-return'}},'一封写着旧地址的信'),
   option('thread-letter-bye','陪对方走完最后一段放学路','幸福 +4 · 把告别留在这一天',{happiness:4},{flag:'thread-letter-goodbye'}),
  ]},
 {id:'thread-chair',min:8,max:40,weight:7,once:true,when:l=>!!relative(l),title:'家里那把摇晃的椅子',
  text:l=>`${relative(l)!.fullName||relative(l)!.name}扶住椅背，问你要不要一起把它修好。那把椅子不值多少钱，可你记得，小时候总有人坐在这里等你。`,
  options:()=>[
   option('thread-chair-fix','坐下来一起修，把它留下','知识 +4 · 家庭支持 +2 · 12 年后重访',{knowledge:4},{flag:'thread-chair-started',familyDelta:2,queue:{after:12,id:'thread-chair-return'}},'一枚从旧椅子上换下的木钉'),
   option('thread-chair-time','收起工具，先陪家人聊一会儿','幸福 +5 · 人际 +2',{happiness:5,social:2},{flag:'thread-chair-talk'}),
  ]},
 {id:'thread-mentor',min:24,max:54,weight:8,once:true,when:(_l,s)=>s.job==='employed'||s.job==='independent',title:'前辈多留了十分钟',
  text:()=> '别人收工以后，一位前辈把你叫住，没有讲大道理，只把容易出错的地方又演示了一遍。你手边有一张纸，突然觉得，这几句话值得记下来。',
  options:()=>[
   option('thread-mentor-note','认真记下，再做一遍给对方看','知识 +5 · 6 年后，这页笔记会有下文',{knowledge:5},{flag:'thread-mentor-started',queue:{after:6,id:'thread-mentor-return'}},'一页写着做事顺序的笔记'),
   option('thread-mentor-rest','道过谢，今天先回去好好休息','健康 +4 · 幸福 +2',{health:4,happiness:2},{flag:'thread-mentor-rested'}),
  ]},
];
export const narrativeFollowups:Record<string,Encounter>={
 'thread-letter-return':{id:'thread-letter-return',min:18,max:29,weight:1,once:true,when:(_l,s)=>s.flags.includes('thread-letter-started'),title:'多年后的回信',
  text:()=> '一封转了几次地址的信到了你手里。开头还是当年的称呼，后面写着这些年换过的住处和工作。末尾只有一句：不知道你现在，过得怎么样。',
  options:()=>[
   option('thread-letter-reply','写一封长信，约好再见一面','人际 +6 · 幸福 +3',{social:6,happiness:3},{flag:'thread-letter-reunited'},'一封终于等来的回信'),
   option('thread-letter-fold','认真回一句近况，把信妥善收好','幸福 +4 · 用自己的方式保持联系',{happiness:4},{flag:'thread-letter-kept'},'夹在书里的旧友来信'),
  ]},
 'thread-chair-return':{id:'thread-chair-return',min:20,max:55,weight:1,once:true,when:(_l,s)=>s.flags.includes('thread-chair-started'),title:'又摸到那道修补的痕迹',
  text:l=>`整理旧物时，你又看见那把椅子。手指摸过去，还能碰到当年修补的地方。${relative(l)?`${relative(l)!.fullName||relative(l)!.name}还记得，你那次把工具摆了一地。`:'你记得当年一起修椅子的人，也记得那些没说完的闲话。'}`,
  options:()=>[
   option('thread-chair-keep','给它找个常能坐下的位置','幸福 +5 · 让旧物继续陪你生活',{happiness:5},{flag:'thread-chair-home'}),
   option('thread-chair-give','修整好，送给需要它的人','人际 +5 · 让这份心意继续往前走',{social:5},{flag:'thread-chair-gift'}),
  ]},
 'thread-mentor-return':{id:'thread-mentor-return',min:30,max:64,weight:1,once:true,when:(_l,s)=>s.flags.includes('thread-mentor-started'),title:'轮到你带一个新人',
  text:(_l,s)=>s.job==='retired'||s.job==='unemployed'?'有人向你请教一件以前做熟了的事。你翻出那页旧笔记，忽然想起，当年也有人愿意多留十分钟。':'新来的人又在同一个地方出错。你准备开口时，忽然想起那页旧笔记——以前的自己，也曾站在同样的位置。',
  options:()=>[
   option('thread-mentor-teach','把那十分钟，也留给后来的人','人际 +5 · 知识 +2',{social:5,knowledge:2},{flag:'thread-mentor-pass'}),
   option('thread-mentor-thank','把笔记借给对方，向前辈道声谢','幸福 +4 · 人际 +2',{happiness:4,social:2},{flag:'thread-mentor-thanks'}),
  ]},
};

const outcomes:Record<string,string>={
 'thread-letter-write':'你把地址写了两遍，把自己的那张夹进书里。临走时，你们都没有再说很多话。',
 'thread-letter-bye':'你们比平常走得慢了一点。路还是那条路，只是明天，身边会空出一个位置。',
 'thread-letter-reply':'你把近况写了好几页，最后问了一个能见面的日子。写完才发现，这些年攒下了很多想说的话。',
 'thread-letter-fold':'回信很短，却是认真写的。你把来信折回原样，放到以后还能找到的地方。',
 'thread-chair-fix':'你们拆下松动的木钉，试了几次才把椅背固定好。天色慢慢暗下来，那把椅子终于不晃了。',
 'thread-chair-time':'工具暂时放到一边。你们从椅子聊到最近的日子，发现原来有些话，得坐下来才会说。',
 'thread-chair-keep':'你给它找了一个用得上的位置。以后坐下时，手指仍会碰到那道不太平整的修补痕迹。',
 'thread-chair-give':'你把旧椅子擦干净，叮嘱对方有一点旧痕，却很结实。东西离开了，修好它的那一天还在。',
 'thread-mentor-note':'你照着笔记又做了一遍。这回对方点了点头，说下次试着自己来。那张纸，被你认真收好了。',
 'thread-mentor-rest':'你说了谢谢，记住今天学到的一个步骤，就先回去休息。剩下的事情，明天再继续。',
 'thread-mentor-teach':'你没有急着替对方做完，只把动作放慢，等对方再试一次。原来，当年那十分钟也能这样传下去。',
 'thread-mentor-thank':'笔记借出去之前，你又看了一遍边上的批注。那句迟到了几年的谢谢，终于认真说了出来。',
};
export function narrativeOutcome(id:string){return outcomes[id];}
