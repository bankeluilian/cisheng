import {assetUrl} from '../lib/web-hosting';

export type TextileIconName='leaf'|'globe'|'book'|'heart'|'wallet'|'briefcase'|'home'|'ticket'|'calendar'|'flower'|'luggage'|'sun';
export default function TextileIcon({name,className=''}:{name:TextileIconName;className?:string}){
 return <img className={`textile-icon ${className}`} src={assetUrl(`/images/textile/icon-${name}.webp`)} alt="" aria-hidden="true" width={48} height={48} loading="lazy"/>;
}
