import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const leadStageEnum = mysqlEnum("leadStage", ["lead", "qualified", "proposal", "negotiation", "won", "lost"]);
export const channelEnum = mysqlEnum("channel", ["sms", "whatsapp", "telegram", "instagram"]);
export const campaignStatusEnum = mysqlEnum("campaignStatus", ["active", "scheduled", "completed"]);
export const integrationChannelEnum = mysqlEnum("integrationChannel", ["sms", "telegram", "whatsapp"]);

export const leads = mysqlTable("leads", {
  id: varchar("id", { length: 80 }).primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  business: varchar("business", { length: 191 }).notNull(),
  owner: varchar("owner", { length: 191 }).notNull(),
  category: varchar("category", { length: 191 }).notNull(),
  city: varchar("city", { length: 64 }).notNull(),
  score: int("score").notNull().default(0),
  stage: leadStageEnum.notNull().default("lead"),
  source: varchar("source", { length: 191 }).notNull(),
  need: text("need").notNull(),
  phone: varchar("phone", { length: 64 }).notNull(),
  budget: varchar("budget", { length: 128 }).notNull(),
  lastTouch: varchar("lastTouch", { length: 128 }).notNull(),
  createdLabel: varchar("createdLabel", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const discoveryLeads = mysqlTable("discoveryLeads", {
  id: varchar("id", { length: 80 }).primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  business: varchar("business", { length: 191 }).notNull(),
  owner: varchar("owner", { length: 191 }).notNull(),
  category: varchar("category", { length: 191 }).notNull(),
  city: varchar("city", { length: 64 }).notNull(),
  score: int("score").notNull().default(0),
  stage: leadStageEnum.notNull().default("lead"),
  source: varchar("source", { length: 191 }).notNull(),
  need: text("need").notNull(),
  phone: varchar("phone", { length: 64 }).notNull(),
  budget: varchar("budget", { length: 128 }).notNull(),
  lastTouch: varchar("lastTouch", { length: 128 }).notNull(),
  createdLabel: varchar("createdLabel", { length: 128 }).notNull(),
  signal: varchar("signal", { length: 191 }).notNull(),
  reason: text("reason").notNull(),
  website: boolean("website").notNull().default(false),
  signage: boolean("signage").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const campaigns = mysqlTable("campaigns", {
  id: varchar("id", { length: 80 }).primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 191 }).notNull(),
  channel: channelEnum.notNull(),
  audience: varchar("audience", { length: 191 }).notNull(),
  status: campaignStatusEnum.notNull().default("scheduled"),
  sent: int("sent").notNull().default(0),
  replies: int("replies").notNull().default(0),
  conversion: varchar("conversion", { length: 32 }).notNull().default("—"),
  copy: text("copy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const tasks = mysqlTable("tasks", {
  id: varchar("id", { length: 80 }).primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 191 }).notNull(),
  meta: varchar("meta", { length: 128 }).notNull(),
  urgent: boolean("urgent").notNull().default(false),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const activityEvents = mysqlTable("activityEvents", {
  id: varchar("id", { length: 96 }).primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 48 }).notNull(),
  title: varchar("title", { length: 191 }).notNull(),
  detail: text("detail").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const channelIntegrations = mysqlTable("channelIntegrations", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  channel: integrationChannelEnum.notNull(),
  enabled: boolean("enabled").notNull().default(false),
  encryptedConfig: text("encryptedConfig").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type DiscoveryLead = typeof discoveryLeads.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type ChannelIntegration = typeof channelIntegrations.$inferSelect;
