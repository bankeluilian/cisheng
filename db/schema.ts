// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const stories=sqliteTable('stories',{
 id:text('id').primaryKey(), name:text('name').notNull(),country:text('country').notNull(),
 birth:integer('birth').notNull(),age:integer('age').notNull(),scene:integer('scene').notNull(),
 summary:text('summary').notNull(),farewell:text('farewell').notNull(),moments:text('moments').notNull(),
 created:integer('created').notNull(),deleteHash:text('delete_hash').notNull().unique(),
});
export const candles=sqliteTable('candles',{
 storyId:text('story_id').notNull().references(()=>stories.id,{onDelete:'cascade'}),visitor:text('visitor').notNull(),created:integer('created').notNull(),
},t=>[primaryKey({columns:[t.storyId,t.visitor]})]);
