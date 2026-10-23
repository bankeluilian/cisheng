function meta(name:string){return typeof document==='undefined'?'':document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content||'';}
export function assetUrl(path:string,base=meta('cisheng-base')||'/'){return `${base.replace(/\/$/,'')}/${path.replace(/^\//,'')}`;}
export function apiUrl(path:string,origin=meta('cisheng-api-origin')){return `${origin.replace(/\/$/,'')}${path}`;}
