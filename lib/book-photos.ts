import type {Entry,Life} from './engine';
import {SCENES,entrySceneFor,sceneCaption,sceneInfo} from './scenes.ts';
const escape=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function bookPhotoDefinitions(images:ReadonlyMap<number,string>):string{
 const symbols=[...images].filter(([id,data])=>SCENES.some(s=>s.id===id)&&/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(data)).map(([id,data])=>`<symbol id="memory-scene-${id}" viewBox="0 0 500 333"><image href="${data}" width="500" height="333" preserveAspectRatio="xMidYMid slice"/></symbol>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" style="position:absolute;overflow:hidden"><defs>${symbols}</defs></svg>`;
}
export function bookEventFigure(life:Life,event:Entry):string{
 const id=entrySceneFor(life,event);return `<figure class="book-event-photo"><svg class="memory-scene" viewBox="0 0 500 333" role="img" aria-label="${escape(sceneInfo(id).alt)}"><use href="#memory-scene-${id}"/></svg><figcaption>${escape(sceneCaption(life,id,event.year))}</figcaption></figure>`;
}
