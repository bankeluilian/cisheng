import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLife,choose,validateLife} from '../lib/engine.ts';
import {nextStoryEncounter} from '../lib/story-engine.ts';
import {birthOpening,lifeChapter,storyThreads,storyRetrospective,storyRecall} from '../lib/narrative.ts';
import {narrativeEncounters,narrativeFollowups} from '../lib/narrative-encounters.ts';
const make=()=>createLife([{id:'JPN',name:'日本',population:1000,births:10,lifeFemale:90,lifeMale:88,gdpPpp:40000}],{seed:57,year:1989,mode:'past',sampling:'births',pace:30});
const pending=(l,e)=>{l.pending={id:`encounter-${e.id}-${l.age}`,title:e.title,text:e.text(l,l.story),options:e.options(l,l.story)};return l;};
test('opening and chapters use this life without changing fate or inventing a past decision',()=>{
 const l=make(),before=structuredClone(l),opening=birthOpening(l);
 assert.ok(opening.text.includes('1989')&&opening.text.includes('日本'));
 assert.ok(opening.text.includes(l.people[0].fullName));
 assert.notEqual(lifeChapter(l).title,lifeChapter({...l,age:24}).title);
 assert.deepEqual(storyThreads(l),[]);assert.deepEqual(l,before);
 const old=structuredClone(l);delete old.story;delete old.people[0].birthWork;assert.ok(birthOpening(old).text);assert.ok(storyRetrospective(old).line);assert.equal(old.story,undefined);
});
test('each story arc has distinct branches, persisted consequences and a due-year followup',()=>{
 assert.equal(narrativeEncounters.length,6);
 for(const e of narrativeEncounters){
  let l=make();l.age=e.min;l.story.job='employed';l.cash=10000;
  assert.equal(e.when?.(l,l.story)??true,true);
  const options=e.options(l,l.story);assert.ok(options.length>=2);
  const scheduled=options.find(o=>o.story?.queue),other=options.find(o=>!o.story?.queue);assert.ok(scheduled&&other);
  const original=structuredClone(l);
  let next=choose(pending(l,e),scheduled.id,'choose');assert.equal(validateLife(next),true);assert.equal(storyThreads(next).length,1);
  const alternate=choose(pending(structuredClone(original),e),other.id,'other');assert.equal(alternate.story.queue.length,0);
  next=JSON.parse(JSON.stringify(next));const q=next.story.queue.find(q=>q.id===scheduled.story.queue.id);assert.ok(q);
  next.age=q.due;next.pending=null;const follow=narrativeFollowups[q.id];assert.ok(follow);assert.equal(follow.when?.(next,next.story)??true,true);
  next.pending=nextStoryEncounter(next);assert.ok(next.pending.id.includes(q.id));
  assert.equal(storyThreads(next)[0].status,'current');
  assert.equal(storyRecall(next).age,e.min);assert.ok(storyRecall(next).text.includes(scheduled.label));
  next=choose(next,next.pending.options[0].id,'reply');assert.equal(validateLife(next),true);assert.equal(next.story.queue.some(q=>q.id===q.id&&q.id===scheduled.story.queue.id),false);
  assert.equal(storyThreads(next)[0].status,'completed');
  const review=storyRetrospective(next);assert.ok(review.moments.some(m=>m.title===e.title));assert.ok(review.line.includes('你选择了'));
 }
});
test('family and mentor callbacks respect absence and retirement; each scheduled callback fits its latest start age',()=>{
 for(const e of narrativeEncounters){const l=make();l.age=e.max;l.story.job='employed';const q=e.options(l,l.story).find(o=>o.story?.queue).story.queue;assert.ok(e.max+q.after<=narrativeFollowups[q.id].max);}
 const l=make();l.age=45;l.people.forEach(p=>p.alive=false);l.story.flags.push('thread-chair-started');const text=narrativeFollowups['thread-chair-return'].text(l,l.story);assert.ok(text.includes('记得'));assert.ok(!text.includes('陪你坐'));
 l.story.job='retired';for(const o of narrativeFollowups['thread-mentor-return'].options(l,l.story))assert.notEqual(o.story?.job,'employed');
});
