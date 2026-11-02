import type {Life} from '../lib/engine';
import {lifeChapter,storyThreads,storyRecall} from '../lib/narrative';
import TextileIcon from './textile-icon';

export function NarrativeChapter({life}:{life:Life}){const chapter=lifeChapter(life);return <header className="narrative-chapter"><TextileIcon name="book"/><div><span>{chapter.number} · {life.birthYear+life.age} 年</span><h2>{chapter.title}</h2><p>{chapter.text}</p></div></header>;}
export function NarrativeThreads({life}:{life:Life}){const threads=storyThreads(life);if(!threads.length)return null;return <section className="narrative-threads" aria-label="这一生的故事线"><header><TextileIcon name="ticket"/><h3>有些事，还会有下文</h3></header>{threads.map(t=><details key={t.id} open={t.status==='waiting'||t.status==='current'}><summary><span>{t.title}</span><small>{t.status==='completed'?'已写下后续':t.status==='current'?'正在发生':t.status==='waiting'?'等待回音':'留在往事里'}</small></summary><p>{t.text}</p>{t.due!==undefined&&<span className="narrative-due">约 {t.due} 岁时，条件允许会再相遇。</span>}</details>)}</section>;}

export function NarrativeRecall({life}:{life:Life}){const recall=storyRecall(life);return recall?<aside className="choice-echo story-recall"><span>{recall.years} 年前 · {recall.age} 岁时的选择</span><p>{recall.text}</p></aside>:null;}
