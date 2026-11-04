import type {Life} from './engine';
export function keepsakeKind(name:string){return /信|来信/.test(name)?'letter':/车票/.test(name)?'ticket':'other';}
export function journeyTicket(l:Life){
 if(l.pending?.id.startsWith('encounter-city-opportunity-'))return {state:'proposed' as const,year:l.birthYear+l.age,passenger:l.name,from:'熟悉的生活',to:'远方的岗位'};
 const k=l.keepsakes.findLast(k=>keepsakeKind(k.name)==='ticket'),e=k&&l.events.find(e=>e.id===k.eventId);
 if(!e||e.age!==l.age||l.pending)return null;
 return {state:'departed' as const,year:e.year,passenger:l.name,from:'熟悉的生活',to:'新城市的生活'};
}
