CREATE TABLE `activityEvents` (
	`id` varchar(96) NOT NULL,
	`ownerId` int NOT NULL,
	`type` varchar(48) NOT NULL,
	`title` varchar(191) NOT NULL,
	`detail` text NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activityEvents` ADD CONSTRAINT `activityEvents_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;