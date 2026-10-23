import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bookPhotoDefinitions,bookEventFigure} from '../lib/book-photos.ts';
import {createLife} from '../lib/engine.ts';
test('offline photographs embed each scene once and reject non-image URLs',()=>{
 const data='data:image/webp;base64,UklGRg==';
 const defs=bookPhotoDefinitions(new Map([[21,data],[22,'javascript:alert(1)'],[999,data]]));
 assert.equal(defs.split(data).length-1,1);
 assert.match(defs,/id="memory-scene-21"/);assert.doesNotMatch(defs,/javascript:|memory-scene-999/);
});
test('offline event figures use local shared symbols and escape captions',()=>{
 const life=createLife([{id:'CHN',regionId:'EAS',name:'<img src=x onerror=alert(1)>',population:1000,births:10,lifeFemale:80,lifeMale:78,gdpPpp:30000}],{seed:1,year:1980,mode:'past',sampling:'births',pace:30});
 const event={...life.events[0],scene:21};const figure=bookEventFigure(life,event);
 assert.match(figure,/href="#memory-scene-21"/);assert.doesNotMatch(figure,/<img|<script|https?:/);
 assert.match(figure,/&lt;img/);
});
