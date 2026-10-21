// Independent channels keep background generation and name previews out of the fate RNG.
export function originRandom(seed:number,channel:string){
 let n=seed>>>0;for(const c of channel)n=Math.imul(n^c.codePointAt(0)!,16777619)>>>0;
 return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
}
