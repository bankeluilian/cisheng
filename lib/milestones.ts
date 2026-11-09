import type {Entry,Life} from './engine';
import {openingFollowups} from './life-turns.ts';
import {narrativeFollowups} from './narrative-encounters.ts';

export const milestonePlayUrl='https://bankeluilian.github.io/cisheng/';

const callbacks=new Set([...Object.values(openingFollowups),...Object.values(narrativeFollowups)].map(event=>event.title));

export function lifeMilestones(life:Life):Entry[]{
 const firstChoice=life.events.find(event=>event.kind==='choice');
 const keepsakes=new Set(life.keepsakes.map(item=>item.eventId));
 return life.events.filter(event=>
  event.kind==='milestone'||event.kind==='ending'||event.kind==='relationship'||
  (event.kind==='choice'&&(event===firstChoice||keepsakes.has(event.id)||callbacks.has(event.title)))
 ).reverse();
}

export function milestoneShareContent(life:Life,event:Entry,showName:boolean){
 const identity=showName?`${life.name} · ${life.country.name}`:life.country.name;
 const date=`${event.year} 年 · ${event.age} 岁`;
 const keepsake=life.keepsakes.find(item=>item.eventId===event.id)?.name;
 const choice=event.kind==='choice'?event.text.match(/^你选择了：([^。\n]+)。/)?.[1]:undefined;
 const detail=keepsake?`留下的小物 · ${keepsake}`:choice?`这一刻的选择 · ${choice}`:'把走过的日子，留在这一页。';
 const caption=`我在《此生》走到了「${event.title}」\n${date} · ${identity}\n${detail}\n如果重来，你会是谁？\n${milestonePlayUrl}`;
 return {title:event.title,identity,date,detail,caption};
}
