import {assetUrl} from './web-hosting';

export function textileAsset(name:string){return assetUrl(`/images/textile/${name}.webp`);}
export function portraitFor(id:string,sex?:string,older=false){let hash=0;for(const c of id)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;const pool=sex==='女'?(older?[4,7]:[0,2,6,7]):sex==='男'?(older?[5]:[1,3]):[0,1,2,3,4,5,6,7];return textileAsset(`portrait-${pool[hash%pool.length]}`);}
