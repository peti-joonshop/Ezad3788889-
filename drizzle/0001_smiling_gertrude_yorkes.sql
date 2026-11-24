CREATE TABLE `campaigns` (
	`id` varchar(80) NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(191) NOT NULL,
	`channel` enum('sms','whatsapp','telegram','instagram') NOT NULL,
	`audience` varchar(191) NOT NULL,
	`campaignStatus` enum('active','scheduled','completed') NOT NULL DEFAULT 'scheduled',
	`sent` int NOT NULL DEFAULT 0,
	`replies` int NOT NULL DEFAULT 0,
	`conversion` varchar(32) NOT NULL DEFAULT '—',
	`copy` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discoveryLeads` (
	`id` varchar(80) NOT NULL,
	`ownerId` int NOT NULL,
	`business` varchar(191) NOT NULL,
	`owner` varchar(191) NOT NULL,
	`category` varchar(191) NOT NULL,
	`city` varchar(64) NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`leadStage` enum('lead','qualified','proposal','negotiation','won','lost') NOT NULL DEFAULT 'lead',
	`source` varchar(191) NOT NULL,
	`need` text NOT NULL,
	`phone` varchar(64) NOT NULL,
	`budget` varchar(128) NOT NULL,
	`lastTouch` varchar(128) NOT NULL,
	`createdLabel` varchar(128) NOT NULL,
	`signal` varchar(191) NOT NULL,
	`reason` text NOT NULL,
	`website` boolean NOT NULL DEFAULT false,
	`signage` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discoveryLeads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` varchar(80) NOT NULL,
	`ownerId` int NOT NULL,
	`business` varchar(191) NOT NULL,
	`owner` varchar(191) NOT NULL,
	`category` varchar(191) NOT NULL,
	`city` varchar(64) NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`leadStage` enum('lead','qualified','proposal','negotiation','won','lost') NOT NULL DEFAULT 'lead',
	`source` varchar(191) NOT NULL,
	`need` text NOT NULL,
	`phone` varchar(64) NOT NULL,
	`budget` varchar(128) NOT NULL,
	`lastTouch` varchar(128) NOT NULL,
	`createdLabel` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` varchar(80) NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(191) NOT NULL,
	`meta` varchar(128) NOT NULL,
	`urgent` boolean NOT NULL DEFAULT false,
	`completed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
