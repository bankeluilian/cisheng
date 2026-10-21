import type {Country} from './engine';
export function samplingDistribution(countries:Country[],method:string){
 const weights=countries.map(c=>{const n=method==='population'?c.population:c.births;return typeof n==='number'&&Number.isFinite(n)&&n>0?n:0;});
 const rawTotal=weights.reduce((a,b)=>a+b,0),fallback=rawTotal===0,total=fallback?countries.length:rawTotal;
 return {fallback,total,rows:countries.map((country,i)=>({country,weight:fallback?1:weights[i],probability:total?(fallback?1:weights[i])/total:0}))};
}
export function pickBirthCountry(countries:Country[],method:string,unit:number):Country{
 if(!countries.length)throw Error('世界数据尚未准备好');
 const d=samplingDistribution(countries,method);let value=Math.max(0,Math.min(1-Number.EPSILON,unit))*d.total;
 for(const r of d.rows){if(value<r.weight)return r.country;value-=r.weight;}
 return d.rows.filter(r=>r.weight>0).at(-1)!.country;
}
export function probabilityLabel(p:number){
 if(p<=0)return '0%';if(p*100<.000001)return '<0.000001%';
 return `${new Intl.NumberFormat('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:p<.00001?6:p<.001?4:2}).format(p*100)}%`;
}
