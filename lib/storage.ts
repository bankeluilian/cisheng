import { validateLife } from './engine';
import type { Life } from './engine';
const dbName='cisheng-v1';
function open():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open(dbName,1);r.onupgradeneeded=()=>r.result.createObjectStore('lives',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function savedLives():Promise<Life[]>{const db=await open();return new Promise((resolve,reject)=>{const t=db.transaction('lives','readonly');const r=t.objectStore('lives').getAll();r.onsuccess=()=>resolve(r.result.filter(validateLife).sort((a:Life,b:Life)=>b.birthYear-a.birthYear));r.onerror=()=>reject(r.error);t.oncomplete=()=>db.close();});}
export async function saveLife(l:Life){const db=await open();return new Promise<void>((resolve,reject)=>{const t=db.transaction('lives','readwrite');t.objectStore('lives').put(l);t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>{db.close();reject(t.error);};});}
export async function removeLife(id:string){const db=await open();return new Promise<void>((resolve,reject)=>{const t=db.transaction('lives','readwrite');t.objectStore('lives').delete(id);t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>reject(t.error);});}
export function download(text:string,name:string,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
