import type {Country} from './engine';

export type VisualRegion='china'|'japan'|'korea'|'southeast'|'southasia'|'middleeast'|'africa'|'europe'|'centralasia'|'latin'|'northamerica'|'oceania'|'pacific';
export type Scene={id:number;label:string;alt:string;region?:VisualRegion;era?:'early'|'modern'};
const regions:ReadonlyArray<[VisualRegion,string]>=[['china','中国街巷'],['japan','日本街巷'],['korea','朝鲜半岛生活'],['southeast','东南亚街区'],['southasia','南亚街巷'],['middleeast','中东与北非街巷'],['africa','撒哈拉以南生活'],['europe','欧洲街区'],['centralasia','中亚与内陆街区'],['latin','拉美与加勒比街区'],['northamerica','北美街区'],['oceania','澳新社区'],['pacific','太平洋岛屿生活']];
export const REGIONAL_SCENES:ReadonlyArray<Scene>=regions.flatMap(([region,label],i)=>[
 {id:21+i*2,label:`${label} · 旧时光`,alt:`手绘${label}，树荫中的低层住宅与2000年以前的日常物件`,region,era:'early' as const},
 {id:22+i*2,label:`${label} · 当代`,alt:`手绘${label}，当代住宅、邻里街道与生活细节`,region,era:'modern' as const},
]);
const exact:Record<string,VisualRegion>={CHN:'china',HKG:'china',MAC:'china',TWN:'china',JPN:'japan',KOR:'korea',PRK:'korea',AUS:'oceania',NZL:'oceania',MNG:'centralasia',KAZ:'centralasia',KGZ:'centralasia',TJK:'centralasia',TKM:'centralasia',UZB:'centralasia',AFG:'centralasia',PAK:'southasia',IND:'southasia',BGD:'southasia',BTN:'southasia',NPL:'southasia',LKA:'southasia',MDV:'southasia',BRN:'southeast',IDN:'southeast',KHM:'southeast',LAO:'southeast',MMR:'southeast',MYS:'southeast',PHL:'southeast',SGP:'southeast',THA:'southeast',TLS:'southeast',VNM:'southeast'};
const fallback:Record<string,VisualRegion>={EAS:'pacific',SAS:'southasia',MEA:'middleeast',MNA:'middleeast',SSF:'africa',ECS:'europe',LCN:'latin',NAC:'northamerica'};
export function visualRegionForCountry(country:Country):VisualRegion|null{return exact[country.id.toUpperCase()]||fallback[country.regionId||'']||null;}
export function regionalSceneFor(country:Country,year:number):number|null{
 const region=visualRegionForCountry(country);if(!region)return null;
 return REGIONAL_SCENES.find(scene=>scene.region===region&&scene.era===(year<2000?'early':'modern'))?.id||null;
}
