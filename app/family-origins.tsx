'use client';
import {assetUrl} from "../lib/web-hosting";
import {BriefcaseBusiness,Info} from 'lucide-react';
import type {Life} from '../lib/engine';
import {familyBasisNote,sectorWeights,sectorLabels} from '../lib/family-background';
export default function FamilyOrigins({life}:{life:Life}){
 const parents=life.people.filter(p=>p.birthWork),data=sectorWeights(life.country);if(!parents.length)return null;
 return <section className="family-origins" aria-label="你出生时父母的职业"><div className="family-origin-heading"><BriefcaseBusiness size={18}/><h3>父母工作的日常</h3><span>你出生时</span></div><div className="parent-work-grid">{parents.map(p=><article className="parent-work" key={p.id}><span>{p.name}</span>{p.fullName&&<b className="parent-full-name">{p.fullName}</b>}<strong>{p.birthWork!.title}</strong><small>{sectorLabels[p.birthWork!.sector]}</small><p>{p.birthWork!.description}</p></article>)}</div><details className="family-source"><summary><Info size={13}/>职业如何生成？</summary><p>{familyBasisNote(life)}</p><p>参考部门占比：农业 {(data.weights.agriculture*100).toFixed(1)}% · 工业 {(data.weights.industry*100).toFixed(1)}% · 服务业 {(data.weights.services*100).toFixed(1)}%。这些是就业人口的部门结构，不是父母职业或就业状态的实测概率。具体岗位结合本局家庭资源抽取，不限制父母的性别。</p><p>过去与未来情景仍使用同一统计基线；职业是出生档案，不表示多年后的工作。<a href={assetUrl("/data/employment-notes.json")} target="_blank" rel="noreferrer">就业资料与缺失说明 ↗</a></p></details></section>;
}
