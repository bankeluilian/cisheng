import type {Life,Stats,Option} from './engine';
export type JobState='school'|'employed'|'unemployed'|'independent'|'retired';
export type StoryResult={text:string;effects?:Partial<Stats>;cash?:number;flag?:string;job?:JobState;multiplier?:number;queue?:{after:number;id:string}};
export type StoryChoice={flag?:string;removeFlag?:string;job?:JobState;multiplier?:number;familyDelta?:number;queue?:{after:number;id:string};risk?:{base:number;stat:keyof Stats;success:StoryResult;failure:StoryResult}};
export type StoryState={version:2;family:{tier:'tight'|'steady'|'comfortable';support:number};opportunity:number;schoolQuality:number;job:JobState;jobMultiplier:number;energy:number;flags:string[];seen:Record<string,number>;queue:{due:number;id:string}[];lastOutcome?:{title:string;text:string;age:number};waiting?:string};
export type StoryOption=Option&{story?:StoryChoice};
export type Encounter={id:string;min:number;max:number;weight:number;cooldown?:number;once?:boolean;when?:(life:Life,s:StoryState)=>boolean;title:string;text:(life:Life,s:StoryState)=>string;options:(life:Life,s:StoryState)=>StoryOption[]};
