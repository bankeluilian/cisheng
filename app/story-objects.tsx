import {Mail,ArrowRight,TrainFront,Bookmark} from 'lucide-react';
import type {Life} from '../lib/engine';
import {journeyTicket,keepsakeKind} from '../lib/story-artifacts';

export function EventStoryObject({life,text,title}:{life:Life;text:string;title:string}){
 const ticket=journeyTicket(life),letter=life.pending?.id.startsWith('encounter-thread-letter-return-')||!life.pending&&title==='多年后的回信';
 if(letter)return <details className="story-envelope" key={`${life.id}-${life.pending?.id||'read'}`} open={!life.pending}>
  <summary><span className="envelope-fold" aria-hidden="true"/><span className="envelope-stamp" aria-hidden="true"><Mail size={27}/><small>此生邮局</small></span><span className="envelope-postmark" aria-hidden="true">{life.birthYear+life.age}<br/>旧友来信</span><span className="envelope-address"><small>收信人</small><strong>{life.name}</strong><span>来自一位旧同学 · 辗转寄达</span></span><span className="envelope-seal" aria-hidden="true">信</span><span className="envelope-toggle"><span className="when-sealed">拆开这封信</span><span className="when-opened">收起信纸</span></span></summary>
  <div className="letter-paper"><span className="letter-date">{life.birthYear+life.age} 年 · 一封迟来的信</span><p>{text}</p><span className="letter-signature">那些没说完的话，留在这一页。</span></div>
 </details>;
 return <>{ticket&&<figure className={`story-ticket is-${ticket.state}`} aria-label="人生旅程纪念票"><div className="ticket-main"><header><TrainFront size={20}/><span>此生 · 行旅纪念</span><small>{ticket.state==='proposed'?'待你决定':'已启程'}</small></header><div className="ticket-route"><strong>{ticket.from}</strong><ArrowRight size={23}/><strong>{ticket.to}</strong></div><footer><span>乘客 <b>{ticket.passenger}</b></span><span>{ticket.year} 年</span></footer></div><div className="ticket-stub"><span>{ticket.state==='proposed'?'下一站':'出发于'}</span><strong>{ticket.year}</strong><span>人生的一程</span><i aria-hidden="true"/></div><figcaption>故事纪念票 · 旅程意象</figcaption></figure>}<p className="event-story-text">{text}</p></>;
}
export function KeepsakeEmblem({name}:{name:string}){const kind=keepsakeKind(name);return <span className={`keepsake-emblem emblem-${kind}`} aria-hidden="true">{kind==='letter'?<Mail size={31}/>:kind==='ticket'?<TrainFront size={29}/>:<Bookmark size={28}/>}</span>;}
