import type {Country,Life} from './engine';
import {employmentSectors,employmentYear} from './data/employment-sectors.ts';
import {originRandom} from './origin-random.ts';
export type Sector='agriculture'|'industry'|'services';
export type ParentWork={title:string;sector:Sector|'none';arrangement:'regular'|'self'|'casual'|'care'|'seeking';description:string};
export type FamilyBackground={basis:'country'|'region'|'world'|'game';key:string;year:number;backfilled:boolean};
const sectors:Sector[]=['agriculture','industry','services'];
const regionOf:Record<string,string>={JPN:'EAS',CHN:'EAS',KOR:'EAS',USA:'NAC',IND:'SAS',NGA:'SSF'};
export function sectorWeights(country:Pick<Country,'id'>&{regionId?:string}){
 const region=country.regionId||regionOf[country.id];
 const complete=(v:typeof employmentSectors[string]|undefined)=>v&&sectors.every(k=>typeof v[k]==='number'&&Number.isFinite(v[k])&&v[k]!>=0&&v[k]!<=100)&&sectors.reduce((a,k)=>a+(v[k]||0),0)>0;
 let key=country.id,basis:FamilyBackground['basis']='country';
 if(!complete(employmentSectors[key])){key=region||'';basis='region';}
 if(!complete(employmentSectors[key])){key='WLD';basis='world';}
 if(!complete(employmentSectors[key])){key='game';basis='game';}
 const raw=basis==='game'?{agriculture:1,industry:1,services:1}:employmentSectors[key],total=sectors.reduce((a,k)=>a+(raw[k]||0),0);
 const weights={agriculture:raw.agriculture!/total,industry:raw.industry!/total,services:raw.services!/total};
 return {weights,basis,key,year:employmentYear};
}
type Job={title:string;kind:ParentWork['arrangement'];weights:[number,number,number];description:string};
const jobs:Record<Sector,Job[]>={
 agriculture:[
  {title:'农场雇工',kind:'casual',weights:[5,2,1],description:'跟着农忙安排工时，收入会随季节变化。'},
  {title:'家庭农场经营者',kind:'self',weights:[3,5,3],description:'照看作物和农具，收成关系着家里的日子。'},
  {title:'养殖场工作人员',kind:'regular',weights:[3,4,2],description:'每天照料牲畜，工作常常从清晨开始。'},
  {title:'农业技术员',kind:'regular',weights:[1,3,4],description:'帮助种植者处理土壤、灌溉与作物管理。'},
  {title:'农场经营管理者',kind:'self',weights:[1,2,5],description:'安排生产、采购与销售，忙时也会亲自下地。'}
 ],
 industry:[
  {title:'制造业装配工',kind:'regular',weights:[5,5,2],description:'按班次完成装配任务，下班后常需要休息。'},
  {title:'建筑工地工人',kind:'casual',weights:[5,3,1],description:'跟着工程找活，工期之间可能需要等待。'},
  {title:'设备维修技工',kind:'regular',weights:[2,5,3],description:'靠技术排查故障，偶尔要在夜间处理急修。'},
  {title:'工程技术人员',kind:'regular',weights:[1,3,5],description:'参与工程和生产计划，工作需要持续学习。'},
  {title:'小型加工坊经营者',kind:'self',weights:[2,3,4],description:'接订单、采购材料，也要承担经营起伏。'},
  {title:'生产班组负责人',kind:'regular',weights:[1,3,4],description:'协调同事和生产进度，忙碌时会带着工作回家。'}
 ],
 services:[
  {title:'商店店员',kind:'regular',weights:[5,4,1],description:'站柜台、整理货架，周末也可能排班。'},
  {title:'餐饮服务员',kind:'casual',weights:[5,3,1],description:'用餐高峰最忙，工时和收入有时不太稳定。'},
  {title:'运输司机',kind:'regular',weights:[3,4,2],description:'沿熟悉的路线接送和运输，回家时间常随排班变化。'},
  {title:'学校教师',kind:'regular',weights:[1,4,4],description:'备课、上课，也会留意你在学习中的小变化。'},
  {title:'护理人员',kind:'regular',weights:[2,4,4],description:'照顾需要帮助的人，夜班时由家人互相照应。'},
  {title:'行政文员',kind:'regular',weights:[2,4,3],description:'处理文件、预约和日常协调，作息相对有规律。'},
  {title:'小商铺经营者',kind:'self',weights:[3,4,3],description:'经营家里的小店，收入跟客流和进货成本一起变化。'},
  {title:'软件技术人员',kind:'regular',weights:[1,2,5],description:'用技术解决问题，项目忙时也需要加班。'},
  {title:'会计',kind:'regular',weights:[1,3,4],description:'整理账目和报表，月末年末尤其忙碌。'},
  {title:'企业经营管理者',kind:'regular',weights:[1,2,5],description:'协调业务与同事，家中条件稍宽裕时也仍要安排陪伴。'}
 ]
};
// These titles are authored examples, never measured within-sector probabilities.
const localTitles:Record<string,Record<string,string>>={
 JPN:{'制造业装配工':'机械装配工','商店店员':'便利店店员','护理人员':'医院护理人员'},
 BGD:{'制造业装配工':'成衣车间工人','小型加工坊经营者':'小型缝制作坊经营者'},
 IND:{'制造业装配工':'纺织车间工人'},
 VNM:{'制造业装配工':'电子装配工'},
 DEU:{'设备维修技工':'工业设备维修技工'},
 BRA:{'家庭农场经营者':'家庭种植农场经营者'},
 CHN:{'商店店员':'社区商店店员'}
};
function parentWork(l:Life,id:string):ParentWork{
 const random=originRandom(l.seed,`parent-work-${l.country.id}-${id}`),tier=l.story?.family.tier||'steady',tierIndex=tier==='tight'?0:tier==='comfortable'?2:1;
 // Out-of-work and care probabilities are explicit fictional rules, identical for both parents.
 const status=random(),inactive=tier==='tight'?.14:tier==='comfortable'?.08:.10;
 if(status<inactive/2)return {title:'照料家庭，暂未从事有薪工作',sector:'none',arrangement:'care',description:'把时间留给照料和家务；这也是家中重要的劳动。'};
 if(status<inactive)return {title:'待业，正在寻找工作',sector:'none',arrangement:'seeking',description:'投递申请、打听机会，家人一起安排这段过渡期。'};
 const {weights}=sectorWeights(l.country);let n=random(),sector:Sector='services';for(const k of sectors){if(n<weights[k]){sector=k;break;}n-=weights[k];}
 const pool=jobs[sector];let pick=random()*pool.reduce((a,j)=>a+j.weights[tierIndex],0),job=pool.at(-1)!;for(const j of pool){if(pick<j.weights[tierIndex]){job=j;break;}pick-=j.weights[tierIndex];}
 return {title:localTitles[l.country.id]?.[job.title]||job.title,sector,arrangement:job.kind,description:job.description};
}
export function withParentBackground(source:Life,fresh=false):Life{
 const missing=source.people.some(p=>['mother','father'].includes(p.id)&&!p.birthWork);
 if(source.familyBackground&&!missing)return source;
 const l=structuredClone(source),d=sectorWeights(l.country);
 for(const p of l.people)if(['mother','father'].includes(p.id)&&!p.birthWork)p.birthWork=parentWork(l,p.id);
 l.familyBackground??={basis:d.basis,key:d.key,year:d.year,backfilled:!fresh};return l;
}
export const sectorLabels:Record<Sector|'none',string>={agriculture:'农业',industry:'工业',services:'服务业',none:'家庭照料／求职中'};
export function familyBasisNote(l:Life){const d=l.familyBackground;return d?`${d.basis==='country'?'参考出生地':d.basis==='region'?'本地资料缺失，参考所属区域':d.basis==='world'?'当地及区域资料缺失，参考全球':'统计资料缺失，采用游戏等权'}${d.basis==='game'?'':` ${d.year} 年三部门就业结构`}。具体岗位和就业状态为游戏设定；这是出生时背景。${d.backfilled?'旧存档已补齐职业背景，原有经历与数值保留。':''}`:'';}
