import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advanceToNextDecision,choose,createLife} from '../lib/engine.ts';
import {lifeMilestones,milestonePlayUrl,milestoneShareContent} from '../lib/milestones.ts';

const country={id:'JPN',name:'日本',population:1000,births:10,lifeFemale:90,lifeMale:88,gdpPpp:40000};

test('a resolved milestone becomes shareable without adding a record to the save',()=>{
 const life=createLife([country],{seed:57,year:1989,mode:'past',sampling:'births',pace:30});
 const opening=advanceToNextDecision(life);
 assert.equal(lifeMilestones(opening).length,1);
 const decided=choose(opening,opening.pending.options[0].id,'milestone-test');
 const restored=JSON.parse(JSON.stringify(decided));
 const before=structuredClone(restored);
 assert.equal(lifeMilestones(restored)[0].title,opening.pending.title);
 assert.equal(lifeMilestones(restored).at(-1).age,0);
 assert.deepEqual(restored,before);
});

test('the share payload uses only public fields and adds the game name on request',()=>{
 const life=createLife([country],{seed:57,year:1989,mode:'past',sampling:'births',pace:30});
 life.name='只在勾选后出现的姓名';
 life.notes[1]='这是私人笔记';
 life.farewell='这是告别语';
 const event={id:'test-choice',age:1,year:1990,title:'老房子里的第一天',kind:'choice',text:'你选择了：去亲友家借住。结算余额是 64851 生活币。'};
 const anonymous=milestoneShareContent(life,event,false);
 assert.ok(anonymous.caption.includes('去亲友家借住'));
 assert.ok(anonymous.caption.endsWith(milestonePlayUrl));
 for(const privateValue of [life.name,life.notes[1],life.farewell,'64851'])assert.ok(!anonymous.caption.includes(privateValue));
 assert.ok(milestoneShareContent(life,event,true).caption.includes(life.name));
});
