/**
 * Refresh the original game's employment-sector data from the official World Bank API.
 * Run from any directory: node /path/to/web/scripts/fetch-employment.mjs
 * Node >=22.13; no credentials, third-party packages, or production-site requests.
 * Raw missing observations remain null. No modeled fallback is written as an observation.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const year=2023;
const sourceLabel='World Bank / ILO modeled estimates';
const indicators={agriculture:'SL.AGR.EMPL.ZS',industry:'SL.IND.EMPL.ZS',services:'SL.SRV.EMPL.ZS'};
const regionIds=['EAS','ECS','SSF','LCN','MEA','SAS','NAC','WLD'];
const countryDocument=JSON.parse(await readFile(resolve(root,'public/data/countries.json'),'utf8'));
const countries=countryDocument.countries;
if(!Array.isArray(countries)||!countries.length)throw Error('countries.json has no country directory');
if(new Set(countries.map(c=>c.id)).size!==countries.length)throw Error('Duplicate economy IDs');

async function download(indicator){
  const attempts=[
    `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${year}&format=json&per_page=400`,
    `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&date=${year}&per_page=1000`,
    `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${year}&format=json&per_page=1000`,
    `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=400&date=${year}`,
  ];
  let lastError;
  for(const url of attempts){
    try{
      const response=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{Accept:'application/json'}});
      if(!response.ok)throw Error(`HTTP ${response.status}`);
      const result=await response.json();
      if(!Array.isArray(result)||!Array.isArray(result[1]))throw Error('Unexpected World Bank response');
      const [metadata,rows]=result;
      if(Number(metadata.pages)!==1||rows.length!==Number(metadata.total))throw Error('Incomplete pagination');
      if(rows.some(row=>String(row.date)!==String(year)))throw Error('Unexpected observation year');
      console.log(`${indicator}: ${rows.length} official API rows`);
      return {url,metadata,rows};
    }catch(error){lastError=error;console.warn(`${indicator}: ${error.message}; trying next official API URL`);}
  }
  throw Error(`Could not download ${indicator}: ${lastError?.message}`);
}

const downloads=Object.fromEntries(await Promise.all(Object.entries(indicators).map(async([key,id])=>[key,await download(id)])));
const maps=Object.fromEntries(Object.entries(downloads).map(([key,d])=>[key,new Map(d.rows.map(row=>[row.countryiso3code,row.value]))]));
function observation(id){
  return Object.fromEntries(Object.keys(indicators).map(key=>{
    const value=maps[key].get(id);
    if(value!==null&&value!==undefined&&(!Number.isFinite(value)||value<0||value>100))throw Error(`Invalid ${key} for ${id}`);
    return [key,value===undefined?null:value];
  }));
}
const countryValues=Object.fromEntries(countries.map(c=>[c.id,observation(c.id)]));
const regionValues=Object.fromEntries(regionIds.map(id=>[id,observation(id)]));
const complete=row=>Object.values(row).every(value=>value!==null)&&Object.values(row).reduce((a,b)=>a+b,0)>0;
const source={
  label:sourceLabel,organization:'World Bank',dataset:'World Development Indicators',
  underlyingSource:'International Labour Organization, ILO Modelled Estimates database (ILOEST), ILOSTAT',
  year,retrievedAt:new Date().toISOString(),unit:'percent of total employment',license:'CC BY 4.0',
  urls:Object.fromEntries(Object.entries(downloads).map(([key,d])=>[key,d.url])),
  indicatorPages:Object.fromEntries(Object.entries(indicators).map(([key,id])=>[key,`https://data.worldbank.org/indicator/${id}`])),
  apiMetadata:Object.fromEntries(Object.entries(downloads).map(([key,d])=>[key,d.metadata])),
};
const fallbackResolution=Object.fromEntries(countries.map(c=>{
  const region=c.regionId;
  const selected=complete(countryValues[c.id])?{level:'country',id:c.id}
    :region&&regionValues[region]&&complete(regionValues[region])?{level:'region',id:region}
    :complete(regionValues.WLD)?{level:'world',id:'WLD'}
    :{level:'game-equal',id:null};
  return [c.id,selected];
}));
const coverage={
  countryCount:countries.length,
  completeCountries:Object.values(countryValues).filter(complete).length,
  countryByIndicator:Object.fromEntries(Object.keys(indicators).map(key=>[key,Object.values(countryValues).filter(row=>row[key]!==null).length])),
  completeRegions:regionIds.filter(id=>complete(regionValues[id])),
  fallbackLevels:Object.fromEntries(['country','region','world','game-equal'].map(level=>[level,Object.values(fallbackResolution).filter(row=>row.level===level).length])),
};
const notes=[
  '三项指标均为 2023 年就业人口中的部门占比（ILO 模型估计），并非所有居民或所有父母的职业分布。',
  '三项指标不区分父母性别、年龄、具体职业，也不说明某位父母一定就业；具体职业与是否就业属于游戏生成规则。',
  '固定采用 2023 年截面，不能据此声称还原较早或未来出生年份的真实就业结构。',
  '保留官方数值精度及 null，不补零、不插值、不换年；各部门之和可能存在微小舍入误差。',
  '仅当同一经济体三项数值均非 null 且合计大于零时使用本国整组数据；否则整组回退到对应世界银行区域，再回退到 WLD。不要把不同层级的部门数值拼接。',
  '国家与区域的对应关系沿用现有 countries.json 中的 regionId，属于目录下载时的世界银行区域分类，不是地理洲别。',
  '若本国、区域、全球均缺少完整三项，允许游戏使用农业/工业/服务业等权 1/3 的显式游戏规则；该均分不是真实统计，未写入原始数值。',
  '用于随机权重时，可在选定的一组真实占比内部按合计归一化；数据资产本身保持原值。',
];
const data={version:'wb-ilo-employment-2023-v1',year,source,countries:countryValues,regions:regionValues,notes};
const provenance={version:data.version,source,indicators,coverage,
  missingCountries:Object.fromEntries(Object.keys(indicators).map(key=>[key,countries.filter(c=>countryValues[c.id][key]===null).map(c=>c.id)])),
  regionByCountry:Object.fromEntries(countries.map(c=>[c.id,c.regionId??null])),fallbackResolution,notes};
const flat={...countryValues,...regionValues};
const typescript=`// Generated by scripts/fetch-employment.mjs from the official World Bank API.\n// Values are percentages of total employment; missing observations remain null.\nexport type EmploymentShares={agriculture:number|null;industry:number|null;services:number|null};\nexport const employmentYear=2023;\nexport const employmentSource='World Bank / ILO modeled estimates';\nexport const employmentSectors:Record<string,EmploymentShares>=${JSON.stringify(flat,null,2)};\n`;

// Download and validate all three series before replacing any local asset.
await mkdir(resolve(root,'lib/data'),{recursive:true});
await mkdir(resolve(root,'public/data'),{recursive:true});
await writeFile(resolve(root,'public/data/employment-sectors.json'),JSON.stringify(data,null,2)+'\n','utf8');
await writeFile(resolve(root,'public/data/employment-notes.json'),JSON.stringify(provenance,null,2)+'\n','utf8');
await writeFile(resolve(root,'lib/data/employment-sectors.ts'),typescript,'utf8');
console.log(JSON.stringify({coverage,examples:Object.fromEntries(['JPN','CHN','IND','NGA','USA'].map(id=>[id,countryValues[id]]))},null,2));
