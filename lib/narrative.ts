import type {Life,Entry} from './engine';

// Presentation is derived from saved facts; reading never advances life.rng.
export function birthOpening(l:Life){
 const parents=l.people.filter(p=>p.birthWork),mother=parents.find(p=>p.id==='mother'),father=parents.find(p=>p.id==='father');
 const portrait=(p:typeof mother)=>p?`${p.name}${p.fullName?`（${p.fullName}）`:""}是一位${p.birthWork!.title}`:'家人把你的名字认真记了下来';
 const details=parents.length?`${parents.map(p=>portrait(p)).join('。')}。你还不会说话，大人已经开始商量，要怎样把你慢慢带大。`:'家人把你的名字认真记了下来，日子从此多了一份牵挂。';
 const support=l.story?.family.tier==='tight'?'家里的钱需要一笔笔算，大人还是想把能给的留给你。':l.story?.family.tier==='comfortable'?'大人为你准备了不少东西，却还不知道，你会喜欢怎样的生活。':'日子有需要操心的地方，也有人愿意为你挪出时间。';
 return {title:`${l.birthYear} 年，有人在等你。`,text:`${l.birthYear} 年，你出生在${l.country.name}。${details}${support}`,promise:['慢慢来，先把日子过好。','愿你长大后，也有喜欢做的事。','去走自己的路，累了就回家。'][(l.seed>>>0)%3]};
}
export function lifeChapter(l:Life){
 if(l.ended)return {number:'终章',title:'把这一生，轻轻合上',text:'留下来的，是你遇见的人，和真正做过的选择。'};
 if(l.age<6)return {number:'第一章',title:'世界先抱住了你',text:'你还不懂得选择，大人的日常已经和你连在一起。'};
 if(l.age<18)return {number:'第二章',title:'你开始有自己的秘密',text:'同学、课本和没说出口的话，慢慢长成你的世界。'};
 if(l.age<35)return {number:'第三章',title:'试着走出自己的路',text:'有些路是第一次走，有些人还会在以后重逢。'};
 if(l.age<60)return {number:'第四章',title:'生活有了牵挂的重量',text:'工作、家人和自己，都需要你留出一点时间。'};
 return {number:'第五章',title:'那些日子，开始有了回声',text:'旧物、旧友和熟悉的手艺，也能陪你把今天过好。'};
}
const threads=[
 {id:'kite',title:'没丢掉的风筝线轴',start:'thread-kite-started',done:['thread-kite-flew','thread-kite-told'],queue:'thread-kite-return',waiting:'那只收好的线轴，还在等一个有风的下午。',closed:'那天解开的结，已经成了一段可以讲给别人听的往事。'},
 {id:'photo',title:'雨天站棚下的合影',start:'thread-photo-started',done:['thread-photo-met','thread-photo-framed'],queue:'thread-photo-return',waiting:'你们各留了一张照片。后来，总有人会先把它翻出来。',closed:'你重新看到了那场雨留下的照片。'},
 {id:'shop',title:'街角的早餐铺',start:'thread-shop-started',done:['thread-shop-cooked','thread-shop-remembered'],queue:'thread-shop-return',waiting:'你记住了小铺忙乱的一个早晨。街角还会有一次道别。',closed:'你在小铺的最后一个早晨，作出了自己的回应。'},
 {id:'letter',title:'那封没有丢掉的信',start:'thread-letter-started',done:['thread-letter-reunited','thread-letter-kept'],queue:'thread-letter-return',waiting:'你写下的地址，可能在多年后被再次翻开。',closed:'你决定怎样回应那位旧同学，这段往事已经写进小记。'},
 {id:'chair',title:'家里那把旧椅子',start:'thread-chair-started',done:['thread-chair-home','thread-chair-gift'],queue:'thread-chair-return',waiting:'你把修好的椅子留下了。以后，还会有人想起它。',closed:'旧椅子最后留在了哪里，你已经作出了自己的安排。'},
 {id:'mentor',title:'前辈留给你的那一页',start:'thread-mentor-started',done:['thread-mentor-pass','thread-mentor-thanks'],queue:'thread-mentor-return',waiting:'那页记着做事顺序的纸，还夹在你的笔记本里。',closed:'当年学到的东西，你选择传下去，或认真向前辈道了谢。'},
];
export function storyThreads(l:Life){const flags=l.story?.flags||[];return threads.filter(t=>flags.includes(t.start)).map(t=>{const q=l.story?.queue.find(q=>q.id===t.queue),completed=t.done.some(f=>flags.includes(f)),current=l.pending?.id.startsWith(`encounter-${t.queue}-`);return {id:t.id,title:t.title,status:completed?'completed' as const:current?'current' as const:q?'waiting' as const:'paused' as const,text:completed?t.closed:current?'多年以前的那件事，已经来到你面前。你的回应会写进这段故事。':q?t.waiting:'这段往事仍留在小记里，原先的约定没有继续。',due:q?.due};});}
const choiceLabel=(e:Entry)=>e.text.match(/^你选择了：(.+?)。/)?.[1];
export function storyRetrospective(l:Life){
 const all=l.events.filter(e=>['choice','milestone','relationship'].includes(e.kind)),unique=all.filter((e,i)=>all.findIndex(v=>v.title===e.title)===i);
 const selected=unique.length<=5?unique:Array.from({length:5},(_,i)=>unique[Math.round(i*(unique.length-1)/4)]);
 // Give a completed personal story a place in the card, alongside the birth and later life.
 const callback=all.findLast(e=>e.kind==='choice'&&/^(多年后的回信|又摸到那道修补的痕迹|轮到你带一个新人|线轴还在抽屉里|雨天的照片又出现了|早餐铺的最后一个早晨)$/.test(e.title));
 if(callback&&!selected.some(e=>e.id===callback.id)&&selected.length>=3)selected[selected.length-2]=callback;
 const moments=[...selected].sort((a,b)=>a.age-b.age||l.events.indexOf(a)-l.events.indexOf(b));
 if(l.age<6)return {line:`${l.birthYear} 年，你在${l.country.name}来到这个世界。短暂的时光里，曾有人抱起你，认真记住你的名字。`,moments};
 const decisions=all.filter(e=>e.kind==='choice'&&choiceLabel(e));const first=decisions[0],last=callback||decisions.at(-1);
 let line=`${l.birthYear} 年，你在${l.country.name}出生。`;
 if(first)line+=`${first.age} 岁时，${first.age<6?'家人为你选择了':'你选择了'}“${choiceLabel(first)}”。`;
 if(last&&last.id!==first?.id)line+=`到了 ${last.age} 岁，你又选择了“${choiceLabel(last)}”。`;
 if(!decisions.length)line+='你走过求学与日常，把平常的日子过成了自己的生活。';
 line+=l.people.some(p=>p.role==='伴侣')?'这一路，有人曾与你相伴。':'走过的路，留在这些小记里。';
 return {line,moments};
}

export function storyRecall(l:Life){const start:Record<string,string>={'thread-kite-return':'风把线扯得很紧','thread-photo-return':'雨停之前，拍一张吧','thread-shop-return':'早餐铺今天少一个人','thread-letter-return':'同桌要搬走了','thread-chair-return':'家里那把摇晃的椅子','thread-mentor-return':'前辈多留了十分钟'};const id=l.pending?.id.match(/^encounter-(thread-(?:letter|chair|mentor|kite|photo|shop)-return)-\d+$/)?.[1];if(!id)return null;const e=l.events.find(e=>e.kind==='choice'&&e.title===start[id]);return e?{age:e.age,years:l.age-e.age,text:e.text}:null;}
