import {MapPin,CalendarDays,GraduationCap,BriefcaseBusiness,PencilLine} from 'lucide-react';
import type {Life} from '../lib/engine';

export default function LifeIdentity({life,onRename}:{life:Life;onRename:()=>void}){
 const facts=[
  {label:'出生地',value:life.country.name,Icon:MapPin},
  {label:'出生年份',value:`${life.birthYear} 年`,Icon:CalendarDays},
  {label:'教育经历',value:life.education,Icon:GraduationCap},
  {label:'当前职业',value:life.career,Icon:BriefcaseBusiness},
 ];
 return <header className="game-title life-identity">
  <div className="identity-copy"><span className="eyebrow">正在发生的此生 · {life.birthYear+life.age} 年</span>
   <div className="identity-title-row"><h1>{life.name}</h1><button className="identity-rename" onClick={onRename} aria-label="修改姓名"><PencilLine size={17}/><span>修改姓名</span></button></div>
   <p className="identity-caption">这是你正在走过的人生</p>
  </div>
  <div className="age-display"><strong>{life.age}</strong><span>岁</span><small>{life.age<6?'初见世界':life.age<18?'慢慢长大':life.age<40?'向外生长':life.age<65?'日子深处':'岁月回声'}</small></div>
  <dl className="identity-facts">{facts.map(({label,value,Icon})=><div key={label}><dt><Icon size={17}/><span>{label}</span></dt><dd>{value}</dd></div>)}</dl>
  {life.place!==life.country.name&&<p className="identity-location"><MapPin size={17}/><span>现居 {life.place}</span></p>}
 </header>;
}
