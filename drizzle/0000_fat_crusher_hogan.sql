CREATE TABLE `candles` (
	`story_id` text NOT NULL,
	`visitor` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`story_id`, `visitor`),
	FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`country` text NOT NULL,
	`birth` integer NOT NULL,
	`age` integer NOT NULL,
	`scene` integer NOT NULL,
	`summary` text NOT NULL,
	`farewell` text NOT NULL,
	`moments` text NOT NULL,
	`created` integer NOT NULL,
	`delete_hash` text NOT NULL
);
