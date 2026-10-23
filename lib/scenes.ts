import {assetUrl} from "./web-hosting.ts";
import type {Life,Entry} from './engine';
import {encounters,followups} from './encounters.ts';
import {REGIONAL_SCENES,regionalSceneFor} from './regional-scenes.ts';
import type {Scene} from './regional-scenes';

export const SCENES:ReadonlyArray<Scene>=[
 {id:1,label:'街巷与远方',alt:'阳光下的小镇街道与远方的海'},
 {id:2,label:'故事的第一页',alt:'晨光中的木婴儿床与窗外的海湾'},
 {id:3,label:'出发的车票',alt:'站台上的行李与等待出发的列车'},
 {id:4,label:'一桌家常饭',alt:'暖灯下为家人准备的一桌饭菜'},
 {id:5,label:'城市里的日子',alt:'树影与阳光中的城市街道'},
 {id:6,label:'岁月的窗边',alt:'窗边安静的房间与远处的风景'},
 {id:7,label:'把想法写下来',alt:'窗边的书桌、笔记本与一杯热饮'},
 {id:8,label:'走过的风景',alt:'海边停放的自行车与开阔的天空'},
 {id:9,label:'童年的小小世界',alt:'雨后庭院里的玩具车、弹珠与小操场'},
 {id:10,label:'求学的日子',alt:'阳光照进摆着书包和练习本的教室'},
 {id:11,label:'学一门手艺',alt:'整齐的工具与等待修整的木凳组成的培训工坊'},
 {id:12,label:'平凡的工作日',alt:'放着文件、杯子和电脑的普通办公室'},
 {id:13,label:'靠双手谋生',alt:'清晨开门的小店与摆放整齐的蔬果'},
 {id:14,label:'认真照顾身体',alt:'有阳光、绿植与诊察用品的安静诊室'},
 {id:15,label:'有人等你吃饭',alt:'夜色里亮着暖灯的家庭厨房与餐桌'},
 {id:16,label:'不赶时间的下午',alt:'河边花园的长椅、书本与一壶茶'},
 {id:17,label:'小屋里的第一天',alt:'乡间小屋里铺着柔软毯子的婴儿床'},
 {id:18,label:'城市里的第一声啼哭',alt:'城市公寓里有绿植和挂饰的婴儿床'},
 {id:19,label:'下班后的课本',alt:'夜晚台灯照亮的练习本、杯子与工作包'},
 {id:20,label:'去另一个地方',alt:'晨光里放着行李的小站与等候的列车'},
 ...REGIONAL_SCENES,
];
export const SCENE_COUNT=SCENES.length;
export function sceneInfo(id:number){return SCENES.find(scene=>scene.id===id)||SCENES[6];}
export function sceneImage(id:number,thumb=false){return assetUrl(`/images/${thumb?'thumb':'scene'}-${String(sceneInfo(id).id).padStart(2,'0')}.webp`);}
// Visual choices never advance life.rng: browsing or exporting cannot change fate.
function variant(l:Life,ids:readonly number[],salt=0){return ids[((l.seed>>>0)+Math.max(0,l.age)+salt)%ids.length];}
export function birthSceneFor(l:Life){return regionalSceneFor(l.country,l.birthYear)??variant({...l,age:0},[2,17,18]);}
const encounterScenes:Record<string,number>={
 'small-budget':9,'full-shelf':9,'child-fever':14,'first-neighborhood':9,'spilled-cup':9,
 'school-materials':10,'club-signup':10,'school-sport':9,'school-friend':10,'scholarship-preparation':19,
 'school-income-pressure':13,'exam-week':10,'thin-school-resources':10,'good-school-project':10,'higher-education-or-work':10,
 'meet-partner':4,'welcome-child':18,'vocational-training':11,'first-interview':12,'probation-task':12,
 'redundancy':12,'weekend-gig':13,'rental-choice':5,'rental-repair':11,'shared-housework':15,'child-time':15,
 'family-care':15,'health-warning':14,'work-burnout':12,'small-business':13,'vague-contract':12,'debt-call':7,
 'city-opportunity':20,'promotion-choice':12,'friend-borrowing':4,'midlife-retraining':11,'adult-night-study':19,
 'retirement-budget':6,'community-table':16,'grown-child-boundary':15,'old-classmate-call':16,'daily-care':14,
 'old-notebooks':7,'retired-small-work':13,'training-offer':11,'business-review':13,'scholarship-result':10,
 'school-friend-return':4,'probation-review':12,'gig-payment':13,'repair-reply':11,'health-review':14,'care-review':15,'retraining-offer':11,
 'ctx-shift-clock':15,'ctx-care-invisible':15,'ctx-changing-plans':9,'ctx-seed-notebook':9,'ctx-service-words':13,
 'ctx-paid-work-time':12,'ctx-shared-study-box':10,'ctx-old-tools':11,'ctx-weekend-ledger':13,'ctx-learning-proof':10,
 'ctx-small-order-book':13,'ctx-evening-class':19,'ctx-income-bridge':12,'ctx-parenting-roster':15,
 'ctx-family-distance':20,'ctx-family-buffer':7,'ctx-work-archive':7,'ctx-neighbor-exchange':16,
 'ctx-study-circle-return':10,'ctx-weekend-work-return':13,'ctx-order-trial-return':13,
 'ctx-evening-study-return':19,'ctx-income-bridge-return':12,'ctx-family-visits-return':20,
};
const titleScenes=new Map([...encounters,...Object.values(followups)].filter(e=>encounterScenes[e.id]).map(e=>[e.title,encounterScenes[e.id]]));
for(const [title,id] of [['到了上学的年纪',10],['毕业以后，仍有一段路',10],['把时间重新安排',16],['认真照顾身体',14],['把时间留给重要的人',15],['好好休息了一会儿',16]] as const)titleScenes.set(title,id);
export function sceneCaption(l:Life,id:number,year=l.birthYear+l.age){
 const scene=sceneInfo(id);return scene.region?`${l.country.name} · ${year} 年 · ${year>2026?'未来情景，沿用当代意象':scene.era==='early'?'旧时光意象':'当代生活意象'}`:`${year} 年 · ${scene.label} · 生活意象`;
}
export function captureEntryScene(l:Life,event:Entry):number{return titleScenes.get(event.title)??(event.title==='学一点新的东西'?(event.age<6?9:event.age<18?10:19):sceneFor(l));}
export function entrySceneFor(l:Life,event:Entry):number{
 if(event.scene&&SCENES.some(scene=>scene.id===event.scene))return event.scene;
 const explicit=titleScenes.get(event.title);if(explicit)return explicit;
 if(event.title==='学一点新的东西')return event.age<6?9:event.age<18?10:19;
 if(event.age===0)return birthSceneFor(l);
 if(event.age<6)return 9;
 if(event.age<18)return 10;
 return regionalSceneFor(l.country,event.year)??variant({...l,age:event.age},event.kind==='ending'?[6,8]:[1,7]);
}
export function sceneFor(l:Life):number{
 if(l.ended)return regionalSceneFor(l.country,l.birthYear+l.age)??(l.age<2?birthSceneFor(l):l.age<18?variant(l,[9,10]):l.age>=65?variant(l,[6,16,8]):variant(l,[1,7,8]));
 const encounter=l.pending?.id.match(/^encounter-(.+)-\d+$/)?.[1];
 if(encounter&&encounterScenes[encounter])return encounterScenes[encounter];
 // A completed choice keeps its scene for this year only, even after a side action.
 if(!l.pending){for(let i=l.events.length-1;i>=0;i--){const event=l.events[i];if(event.age!==l.age)break;if(event.kind==='choice'&&titleScenes.has(event.title))return titleScenes.get(event.title)!;}}
 if(l.age<2)return birthSceneFor(l);
 if(l.age<6)return variant(l,[9,birthSceneFor(l),9]);
 if(l.age<18)return variant(l,[10,9]);
 if(l.age>=65||l.story?.job==='retired')return variant(l,[16,6,8]);
 const plans=l.story?.commitments?.filter(p=>p.remaining>0)||[];
 if(plans.some(p=>/night|evening|study/.test(p.id)))return 19;
 if(plans.some(p=>/training/.test(p.id)))return 11;
 if(l.story?.job==='school'||l.career==='学生')return variant(l,[10,19]);
 if(l.focus==='study')return variant(l,[19,7]);
 if((l.focus==='family'||l.age%3===0)&&l.people.some(p=>p.alive&&(p.role==='伴侣'||p.role==='孩子')))return variant(l,[4,15]);
 if(l.story?.job==='independent')return variant(l,[13,11]);
 if(l.story?.job==='unemployed')return regionalSceneFor(l.country,l.birthYear+l.age)??variant(l,[5,7]);
 if(l.age%3===0){const regional=regionalSceneFor(l.country,l.birthYear+l.age);if(regional)return regional;}
 return variant(l,[12,5,11]);
}
