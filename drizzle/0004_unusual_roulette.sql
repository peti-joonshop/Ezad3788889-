CREATE TABLE `channelIntegrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`integrationChannel` enum('sms','telegram','whatsapp') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`encryptedConfig` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channelIntegrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `channelIntegrations` ADD CONSTRAINT `channelIntegrations_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;