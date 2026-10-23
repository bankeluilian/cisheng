import {test} from 'node:test';
import assert from 'node:assert/strict';
const root=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
if(!['127.0.0.1','localhost'].includes(new URL(root).hostname))throw Error('集成测试只允许在本机执行');

test('GitHub Pages can preflight, read and publish to the same community without opening other origins',async()=>{
 const origin='https://bankeluilian.github.io',token=crypto.randomUUID();let id;
 let r=await fetch(root+'/api/stories',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});
 assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);
 r=await fetch(root+'/api/stories',{headers:{Origin:origin}});assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);
 const data={name:'跨域验证',country:'中国',birth:2000,age:60,scene:46,summary:'本地验证',farewell:'',moments:[],deleteToken:token};
 try{
  r=await fetch(root+'/api/stories',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
  assert.equal(r.status,201);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);id=(await r.json()).id;
  r=await fetch(root+'/api/stories',{method:'POST',headers:{Origin:'https://evil.test','Content-Type':'application/json'},body:JSON.stringify(data)});assert.equal(r.status,403);assert.equal(r.headers.has('Access-Control-Allow-Origin'),false);
 }finally{if(id){r=await fetch(root+'/api/stories',{method:'DELETE',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({id,token})});assert.equal(r.status,200);}}
});
test('D1 story publication updates the preview, counts a candle once, keeps secrets private and permits owner withdrawal',async()=>{
 const token=crypto.randomUUID();let id;
 const post={name:'验证样本',country:'中国',birth:2020,age:70,scene:7,summary:'仅用于本地自动验证的虚构人生。',farewell:'第一句话',moments:[{age:0,title:'来到这个世界'}],deleteToken:token};
 const send=(path,data,method='POST')=>fetch(root+path,{method,headers:{'Content-Type':'application/json',Origin:root},body:JSON.stringify(data)});
 try{
  let r=await send('/api/stories',post);assert.equal(r.status,201,await r.clone().text());id=(await r.json()).id;assert.ok(id);
  r=await send('/api/stories',{...post,scene:46,farewell:'更新后的话'});assert.equal(r.status,201);assert.equal((await r.json()).id,id);
  const all=await(await fetch(root+'/api/stories')).json();const s=all.stories.find(s=>s.id===id);
  assert.equal(s.farewell,'更新后的话');assert.equal(s.scene,46);assert.equal('delete_hash' in s,false);assert.equal('deleteToken' in s,false);
  const visitor=crypto.randomUUID();for(let i=0;i<2;i++){r=await send('/api/candles',{storyId:id,visitor});assert.equal(r.status,200);assert.equal((await r.json()).count,1);}
  r=await send('/api/stories',{...post,age:-1});assert.equal(r.status,400);
  r=await send('/api/stories',{...post,scene:47});assert.equal(r.status,400);
  r=await send('/api/stories',{id,token:crypto.randomUUID()},'DELETE');assert.equal(r.status,403);
 }finally{if(id){const r=await send('/api/stories',{id,token},'DELETE');assert.equal(r.status,200);const all=await(await fetch(root+'/api/stories')).json();assert.equal(all.stories.some(s=>s.id===id),false);}}
});
