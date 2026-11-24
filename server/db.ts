import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activityEvents,
  campaigns,
  channelIntegrations,
  discoveryLeads,
  leads,
  tasks,
  users,
  type Campaign,
  type DiscoveryLead,
  type InsertUser,
  type Lead,
  type Task,
} from "../drizzle/schema";
import { seedCampaigns, seedDiscoveryLeads, seedLeads, seedTasks, type Channel, type LeadStage } from "./data";
import { ENV } from "./_core/env";
import { decryptSecret, encryptSecret } from "./_core/secrets";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _db = drizzle(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function checkDatabase() {
  try {
    const db = await getDb();
    if (!db) return false;
    await db.execute(sql`select 1`);
    return true;
  } catch (error) {
    console.warn("[Database] Health check failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

function requireDb() {
  return getDb().then(db => {
    if (!db) throw new Error("Database is not available");
    return db;
  });
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await requireDb();
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  } else {
    values.lastSignedIn = new Date();
    updateSet.lastSignedIn = new Date();
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await requireDb();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

async function hasRows(table: typeof leads | typeof discoveryLeads | typeof campaigns | typeof tasks, ownerId: number) {
  const db = await requireDb();
  const result = await db.select({ id: table.id }).from(table).where(eq(table.ownerId, ownerId)).limit(1);
  return result.length > 0;
}

export async function ensureWorkspaceSeed(ownerId: number) {
  const db = await requireDb();
  if (!(await hasRows(leads, ownerId))) {
    await db.insert(leads).values(seedLeads.map(item => {
      const { createdAt: _createdAt, ...rest } = item;
      return { ...rest, id: `${ownerId}-${item.id}`, ownerId, createdLabel: item.createdAt };
    }));
  }
  if (!(await hasRows(discoveryLeads, ownerId))) {
    await db.insert(discoveryLeads).values(seedDiscoveryLeads.map(item => {
      const { createdAt: _createdAt, ...rest } = item;
      return { ...rest, id: `${ownerId}-${item.id}`, ownerId, createdLabel: item.createdAt };
    }));
  }
  if (!(await hasRows(campaigns, ownerId))) {
    await db.insert(campaigns).values(seedCampaigns.map(item => ({ ...item, id: `${ownerId}-${item.id}`, ownerId })));
  }
  if (!(await hasRows(tasks, ownerId))) {
    await db.insert(tasks).values(seedTasks.map(item => ({ ...item, id: `${ownerId}-${item.id}`, ownerId })));
  }
}

export function mapLead(row: Lead) {
  return { ...row, createdAt: row.createdLabel };
}

export function mapDiscoveryLead(row: DiscoveryLead) {
  return { ...row, createdAt: row.createdLabel };
}

export function mapCampaign(row: Campaign) {
  return row;
}

export async function getLeadsForUser(ownerId: number, input?: { search?: string; stage?: string }) {
  await ensureWorkspaceSeed(ownerId);
  const db = await requireDb();
  const rows = await db.select().from(leads).where(eq(leads.ownerId, ownerId));
  const search = input?.search?.trim().toLowerCase() ?? "";
  return rows.filter(row => {
    const matchesSearch = !search || [row.business, row.owner, row.category, row.city].some(value => value.toLowerCase().includes(search));
    const matchesStage = !input?.stage || input.stage === "all" || row.stage === input.stage;
    return matchesSearch && matchesStage;
  }).map(mapLead);
}

export async function getSummaryForUser(ownerId: number) {
  const userLeads = await getLeadsForUser(ownerId);
  const db = await requireDb();
  await ensureWorkspaceSeed(ownerId);
  const userTasks = await db.select().from(tasks).where(and(eq(tasks.ownerId, ownerId), eq(tasks.completed, false))).limit(10);
  return {
    kpis: { newLeads: 124, activeOpportunities: 38, conversionRate: 18.6, forecast: "۴۸۰ م" },
    pipeline: [
      { key: "lead" as LeadStage, label: "لید جدید", count: userLeads.filter(l => l.stage === "lead").length + 18, value: "۱۴۲ م", tone: "gold" },
      { key: "qualified" as LeadStage, label: "واجد شرایط", count: userLeads.filter(l => l.stage === "qualified").length + 8, value: "۱۱۰ م", tone: "purple" },
      { key: "proposal" as LeadStage, label: "پیشنهاد قیمت", count: userLeads.filter(l => l.stage === "proposal").length + 5, value: "۹۴ م", tone: "pink" },
      { key: "negotiation" as LeadStage, label: "مذاکره", count: userLeads.filter(l => l.stage === "negotiation").length + 3, value: "۷۸ م", tone: "blue" },
      { key: "won" as LeadStage, label: "برنده", count: userLeads.filter(l => l.stage === "won").length + 1, value: "۵۶ م", tone: "green" },
    ],
    tasks: userTasks.map(task => ({ id: task.id, title: task.title, meta: task.meta, urgent: task.urgent })),
    chart: [48, 62, 54, 78, 66, 91, 84, 96, 75, 88, 94, 100],
  };
}

export async function updateLeadStage(ownerId: number, id: string, stage: LeadStage) {
  const db = await requireDb();
  await db.update(leads).set({ stage, lastTouch: "همین الان" }).where(and(eq(leads.id, id), eq(leads.ownerId, ownerId)));
  const result = await db.select().from(leads).where(and(eq(leads.id, id), eq(leads.ownerId, ownerId))).limit(1);
  if (!result[0]) return undefined;
  await recordActivity(ownerId, "lead_stage_changed", "مرحلهٔ لید تغییر کرد", `${result[0].business} به مرحلهٔ جدید منتقل شد.`);
  return mapLead(result[0]);
}

export async function getDiscoveryForUser(ownerId: number, input?: { city?: string; category?: string; minScore?: number }) {
  await ensureWorkspaceSeed(ownerId);
  const db = await requireDb();
  const rows = await db.select().from(discoveryLeads).where(eq(discoveryLeads.ownerId, ownerId));
  return rows.filter(row => (!input?.city || input.city === "همه شهرها" || row.city === input.city) && (!input?.category || input.category === "همه صنف‌ها" || row.category === input.category) && (!input?.minScore || row.score >= input.minScore)).map(mapDiscoveryLead);
}

export async function addDiscoveryToCrm(ownerId: number, discoveryId: string) {
  await ensureWorkspaceSeed(ownerId);
  const db = await requireDb();
  const discovery = (await db.select().from(discoveryLeads).where(and(eq(discoveryLeads.id, discoveryId), eq(discoveryLeads.ownerId, ownerId))).limit(1))[0];
  if (!discovery) return { success: false, message: "لید پیدا نشد" };
  const leadId = `${ownerId}-L-${discovery.id.split("-").slice(1).join("-")}`;
  const existing = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.id, leadId), eq(leads.ownerId, ownerId))).limit(1);
  if (existing.length) return { success: true, message: "این لید قبلاً در CRM هست" };
  await db.insert(leads).values({ id: leadId, ownerId, business: discovery.business, owner: discovery.owner, category: discovery.category, city: discovery.city, score: discovery.score, stage: "lead", source: `کشف هوشمند · ${discovery.source}`, need: discovery.need, phone: discovery.phone, budget: discovery.budget, lastTouch: "بدون پیگیری", createdLabel: discovery.createdLabel });
  await recordActivity(ownerId, "lead_added", "لید کشف‌شده به CRM اضافه شد", `${discovery.business} در فهرست لیدهای فروش قرار گرفت.`);
  return { success: true, message: "به CRM اضافه شد" };
}

export async function getCampaignsForUser(ownerId: number) {
  await ensureWorkspaceSeed(ownerId);
  const db = await requireDb();
  return (await db.select().from(campaigns).where(eq(campaigns.ownerId, ownerId))).map(mapCampaign);
}

export async function launchCampaign(ownerId: number, campaignId: string, channel: Channel) {
  const db = await requireDb();
  const result = await db.update(campaigns).set({ status: "active", channel }).where(and(eq(campaigns.id, campaignId), eq(campaigns.ownerId, ownerId)));
  void result;
  const campaign = (await db.select().from(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.ownerId, ownerId))).limit(1))[0];
  if (campaign) await recordActivity(ownerId, "campaign_launched", "کمپین فعال شد", `${campaign.name} در حالت پیش‌نمایش فعال شد.`);
  return campaign ? mapCampaign(campaign) : undefined;
}

export type CreateLeadInput = {
  business: string;
  owner: string;
  category: string;
  city: string;
  score: number;
  stage: LeadStage;
  source: string;
  need: string;
  phone: string;
  budget: string;
};

function createEntityId(prefix: string, ownerId: number) {
  return `${ownerId}-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createLeadForUser(ownerId: number, input: CreateLeadInput) {
  const db = await requireDb();
  const id = createEntityId("L", ownerId);
  const lead = {
    id,
    ownerId,
    ...input,
    lastTouch: "بدون پیگیری",
    createdLabel: "همین الان",
  };
  await db.insert(leads).values(lead);
  await recordActivity(ownerId, "lead_created", "لید جدید ثبت شد", `${input.business} با موفقیت در CRM ذخیره شد.`);
  return mapLead(lead as Lead);
}

export async function createCampaignForUser(ownerId: number, input: { name: string; channel: Channel; audience: string; copy: string }) {
  const db = await requireDb();
  const campaign = {
    id: createEntityId("C", ownerId),
    ownerId,
    ...input,
    status: "scheduled" as const,
    sent: 0,
    replies: 0,
    conversion: "—",
  };
  await db.insert(campaigns).values(campaign);
  await recordActivity(ownerId, "campaign_created", "کمپین جدید ساخته شد", `${input.name} برای ${input.audience} زمان‌بندی شد.`);
  return mapCampaign(campaign as Campaign);
}

export async function completeTask(ownerId: number, taskId: string) {
  const db = await requireDb();
  await db.update(tasks).set({ completed: true }).where(and(eq(tasks.id, taskId), eq(tasks.ownerId, ownerId)));
  const task = (await db.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.ownerId, ownerId))).limit(1))[0];
  if (task) await recordActivity(ownerId, "task_completed", "کار انجام شد", task.title);
  return task;
}

export async function getReportForUser(ownerId: number) {
  await ensureWorkspaceSeed(ownerId);
  const db = await requireDb();
  const [userLeads, userCampaigns, userTasks] = await Promise.all([
    db.select().from(leads).where(eq(leads.ownerId, ownerId)),
    db.select().from(campaigns).where(eq(campaigns.ownerId, ownerId)),
    db.select().from(tasks).where(eq(tasks.ownerId, ownerId)),
  ]);
  const won = userLeads.filter(lead => lead.stage === "won").length;
  const closed = userLeads.filter(lead => lead.stage === "won" || lead.stage === "lost").length;
  const sourceCounts = new Map<string, number>();
  for (const lead of userLeads) sourceCounts.set(lead.source, (sourceCounts.get(lead.source) ?? 0) + 1);
  return {
    totalLeads: userLeads.length,
    activeLeads: userLeads.filter(lead => !["won", "lost"].includes(lead.stage)).length,
    conversionRate: closed ? Math.round((won / closed) * 1000) / 10 : 0,
    completedTasks: userTasks.filter(task => task.completed).length,
    campaignCount: userCampaigns.length,
    totalSent: userCampaigns.reduce((sum, campaign) => sum + campaign.sent, 0),
    totalReplies: userCampaigns.reduce((sum, campaign) => sum + campaign.replies, 0),
    byStage: (["lead", "qualified", "proposal", "negotiation", "won", "lost"] as LeadStage[]).map(stage => ({ stage, count: userLeads.filter(lead => lead.stage === stage).length })),
    bySource: Array.from(sourceCounts.entries()).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 5),
  };
}

export async function recordActivity(ownerId: number, type: string, title: string, detail: string) {
  const db = await requireDb();
  await db.insert(activityEvents).values({
    id: createEntityId("E", ownerId),
    ownerId,
    type,
    title,
    detail,
    read: false,
  });
}

export async function getNotificationsForUser(ownerId: number) {
  const db = await requireDb();
  const events = await db.select().from(activityEvents).where(eq(activityEvents.ownerId, ownerId)).orderBy(desc(activityEvents.createdAt)).limit(20);
  return { items: events, unreadCount: events.filter(event => !event.read).length };
}

export async function markAllNotificationsRead(ownerId: number) {
  const db = await requireDb();
  await db.update(activityEvents).set({ read: true }).where(and(eq(activityEvents.ownerId, ownerId), eq(activityEvents.read, false)));
  return { success: true } as const;
}

export type IntegrationChannel = "sms" | "telegram" | "whatsapp";
export type IntegrationConfig = Record<string, string>;

export async function getChannelIntegrations(ownerId: number) {
  const database = await requireDb();
  const rows = await database.select().from(channelIntegrations).where(eq(channelIntegrations.ownerId, ownerId));
  return rows.map(row => ({
    channel: row.channel as IntegrationChannel,
    enabled: row.enabled,
    config: decryptSecret<IntegrationConfig>(row.encryptedConfig),
    updatedAt: row.updatedAt,
  }));
}

export async function getChannelIntegration(ownerId: number, channel: IntegrationChannel) {
  const database = await requireDb();
  const rows = await database.select().from(channelIntegrations).where(and(eq(channelIntegrations.ownerId, ownerId), eq(channelIntegrations.channel, channel))).limit(1);
  const row = rows[0];
  if (!row) return undefined;
  return { channel, enabled: row.enabled, config: decryptSecret<IntegrationConfig>(row.encryptedConfig), updatedAt: row.updatedAt };
}

export async function saveChannelIntegration(ownerId: number, channel: IntegrationChannel, enabled: boolean, config: IntegrationConfig) {
  const database = await requireDb();
  const encryptedConfig = encryptSecret(config);
  const existing = await database.select({ id: channelIntegrations.id }).from(channelIntegrations).where(and(eq(channelIntegrations.ownerId, ownerId), eq(channelIntegrations.channel, channel))).limit(1);
  if (existing[0]) {
    await database.update(channelIntegrations).set({ enabled, encryptedConfig }).where(eq(channelIntegrations.id, existing[0].id));
  } else {
    await database.insert(channelIntegrations).values({ ownerId, channel, enabled, encryptedConfig });
  }
  return { channel, enabled };
}
