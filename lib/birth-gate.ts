import {z} from 'zod';
const optionsSchema=z.object({year:z.number().int().min(1850).max(2200),mode:z.enum(['present','past','future']),sampling:z.enum(['births','population']),pace:z.union([z.literal(30),z.literal(60),z.literal(90)])}).strict();
const gateSchema=z.discriminatedUnion('stage',[
 z.object({stage:z.literal('waiting'),options:optionsSchema}).strict(),
 z.object({stage:z.literal('revealed'),lifeId:z.string().min(1).max(120)}).strict()
]);
export type BirthOptions=z.infer<typeof optionsSchema>;
export type BirthGate=z.infer<typeof gateSchema>;
const defaults:BirthOptions={year:2026,mode:'present',sampling:'births',pace:30};
export function waitingBirth(options:{year:number;mode:string;sampling:string;pace:number}=defaults):BirthGate{
 const parsed=optionsSchema.safeParse(options);return {stage:'waiting',options:parsed.success?parsed.data:{...defaults}};
}
export function revealedBirth(lifeId:string):BirthGate{return gateSchema.parse({stage:'revealed',lifeId});}
export function birthIsRevealed(gate:BirthGate,life:{id:string}|null|undefined){return gate.stage==='revealed'&&gate.lifeId===life?.id;}
export function restoreBirthGate(raw:string|null,currentLifeId?:string):BirthGate{
 try{const parsed=gateSchema.safeParse(JSON.parse(raw||'null'));if(parsed.success&&(parsed.data.stage==='waiting'||parsed.data.lifeId===currentLifeId))return parsed.data;}catch{}
 return waitingBirth();
}
