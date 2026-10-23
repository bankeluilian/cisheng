import {spawn,execFileSync} from 'node:child_process';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

// Upload only the browser build; gh uses the owner's existing authenticated session.
const root=fileURLToPath(new URL('../',import.meta.url));
const repository='bankeluilian/cisheng';
const artifact=path.join(root,'dist-pages');
async function api(endpoint,data,method=data?'POST':'GET'){
 return new Promise((resolve,reject)=>{
  const p=spawn('gh',['api','--method',method,`repos/${repository}/${endpoint}`,...(data?['--input','-']:[])],{cwd:root,windowsHide:true,stdio:['pipe','pipe','pipe']});
  let out='',err='';p.stdout.on('data',c=>out+=c);p.stderr.on('data',c=>err+=c);p.on('error',reject);
  p.on('close',code=>{if(code){const e=new Error(err);e.notFound=err.includes('HTTP 404');reject(e);}else{try{resolve(JSON.parse(out));}catch{reject(new Error('Invalid GitHub API response'));}}});
  p.stdin.end(data?JSON.stringify(data):undefined);
 });
}
async function ref(){try{return (await api('git/ref/heads/gh-pages')).object.sha;}catch(e){if(e.notFound)return null;throw e;}}
async function files(dir,prefix=''){
 const result=[];
 for(const e of await readdir(dir,{withFileTypes:true})){
  const relative=prefix+e.name;
  if(e.isDirectory())result.push(...await files(path.join(dir,e.name),relative+'/'));
  else if(e.isFile())result.push(relative);
  else throw new Error('Build contains a non-regular file');
 }
 return result;
}
const names=(await files(artifact)).sort();
if(!names.includes('index.html')||!names.includes('.nojekyll'))throw new Error('Run npm run build:pages first');
const source=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const before=await ref(),entries=[];let cursor=0,completed=0;
await Promise.all(Array.from({length:5},async()=>{
 while(cursor<names.length){
  const name=names[cursor++],data=await readFile(path.join(artifact,name));
  const expected=createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
  const blob=await api('git/blobs',{content:data.toString('base64'),encoding:'base64'});
  if(blob.sha!==expected)throw new Error('Artifact checksum mismatch: '+name);
  entries.push({path:name,mode:'100644',type:'blob',sha:blob.sha});
  completed++;if(completed%20===0||completed===names.length)console.log(`Uploaded ${completed}/${names.length} files`);
 }
}));
const tree=await api('git/trees',{tree:entries.sort((a,b)=>a.path.localeCompare(b.path))});
const commit=await api('git/commits',{message:`Publish playable HTML from ${source}`,tree:tree.sha,parents:before?[before]:[]});
if(await ref()!==before)throw new Error('gh-pages changed during upload; refusing to overwrite');
if(before)await api('git/refs/heads/gh-pages',{sha:commit.sha,force:false},'PATCH');
else await api('git/refs',{ref:'refs/heads/gh-pages',sha:commit.sha});
if(await ref()!==commit.sha)throw new Error('Published ref verification failed');
await mkdir(path.join(root,'outputs'),{recursive:true});
const result={repository,source,artifact:commit.sha,files:names.length};
await writeFile(path.join(root,'outputs/pages-deployment.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
