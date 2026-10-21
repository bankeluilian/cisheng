import { env } from 'cloudflare:workers';
import { z } from 'zod';
const headers={'Cache-Control':'no-store'};
const json=(v:unknown,status=200)=>Response.json(v,{status,headers});
const body=z.object({name:z.string().min(1).max(30),country:z.string().min(1).max(70),birth:z.number().int().min(1850).max(2200),age:z.number().int().min(0).max(110),scene:z.number().int().min(1).max(8),summary:z.string().min(1).max(600),farewell:z.string().max(120),moments:z.array(z.object({age:z.number().int().min(0).max(110),title:z.string().max(60)})).max(5),deleteToken:z.string().uuid()});
async function hash(s:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(v=>v.toString(16).padStart(2,'0')).join('');}
export async function GET(){try{if(!env.DB)return json({error:'故事服务暂未连接，请稍后再试。'},503);const r=await env.DB.prepare('SELECT s.id,s.name,s.country,s.birth,s.age,s.scene,s.summary,s.farewell,s.moments,s.created,COUNT(c.visitor) AS candles FROM stories s LEFT JOIN candles c ON c.story_id=s.id GROUP BY s.id ORDER BY s.created DESC LIMIT 60').all();return json({stories:r.results.map(r=>({...r,moments:JSON.parse(String(r.moments))}))});}catch{return json({error:'故事服务暂时不可用，你的本地人生仍然安全。'},503);}}
export async function POST(req:Request){
 try{
  if(!env.DB)return json({error:'故事服务暂未连接。'},503);
  if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return json({error:'请求来源不匹配'},403);
  if(Number(req.headers.get('content-length')||0)>12000)return json({error:'内容过长'},413);
  const text=await req.text();if(text.length>12000)return json({error:'内容过长'},413);
  const parsed=body.safeParse(JSON.parse(text));if(!parsed.success)return json({error:'卡片格式不正确。'},400);
  const b=parsed.data,h=await hash(b.deleteToken),id=crypto.randomUUID();
  await env.DB.prepare('INSERT INTO stories (id,name,country,birth,age,scene,summary,farewell,moments,created,delete_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(delete_hash) DO UPDATE SET name=excluded.name,country=excluded.country,birth=excluded.birth,age=excluded.age,scene=excluded.scene,summary=excluded.summary,farewell=excluded.farewell,moments=excluded.moments').bind(id,b.name,b.country,b.birth,b.age,b.scene,b.summary,b.farewell,JSON.stringify(b.moments),Date.now(),h).run();
  const stored=await env.DB.prepare('SELECT id FROM stories WHERE delete_hash=?').bind(h).first();return json({id:stored!.id},201);
 }catch{return json({error:'发布失败，请稍后再试。'},503);}
}
export async function DELETE(req:Request){try{if(!env.DB)return json({error:'服务未连接'},503);if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return json({error:'请求来源不匹配'},403);const b=z.object({id:z.string().uuid(),token:z.string().uuid()}).safeParse(await req.json());if(!b.success)return json({error:'格式错误'},400);const r=await env.DB.prepare('DELETE FROM stories WHERE id=? AND delete_hash=?').bind(b.data.id,await hash(b.data.token)).run();if(!r.meta.changes)return json({error:'未找到这份发布记录的删除凭证。'},403);return json({ok:true});}catch{return json({error:'删除失败，请稍后再试。'},503);}}
