import { z } from "zod";
import { invokeLLM, type Message } from "./_core/llm";
import { APP_NAME, COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import type { LeadStage, Channel } from "./data";
import { testIntegration } from "./integrations";

const stageLabels: Record<LeadStage, string> = {
  lead: "لید جدید",
  qualified: "واجد شرایط",
  proposal: "پیشنهاد قیمت",
  negotiation: "مذاکره",
  won: "برنده",
  lost: "از دست‌رفته",
};

function toAssistantText(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") return content;
  return content.map(part => part.text ?? "").join(" ").trim();
}

const businessKnowledge = `
تو دستیار فروش «${APP_NAME}» هستی؛ یک مشاور ایرانی، صمیمی و حرفه‌ای. فارسی محاوره‌ای حرف بزن، اما اغراق، وعده قطعی و فشار فروش نداشته باش.
کسب‌وکار: طراحی، ساخت، فروش و نصب تابلوهای تبلیغاتی در تهران و کرج؛ همچنین سایت‌های تبلیغاتی و هوشمند و بازاریابی دیجیتال.
خدمات: تابلو LED، لایت‌باکس، چلنیوم، حروف برجسته، نئون و نورپردازی، مشاوره طراحی، نصب و تحویل، تبلیغات هوشمند با هوش مصنوعی.
برای قیمت دقیق، ابعاد، متریال، نور و محل نصب لازم است بررسی شود. می‌توانی بازه تقریبی بدهی و پیشنهاد بازدید رایگان بدهی؛ عدد قطعی نساز.
پایان پاسخ، فقط وقتی طبیعی است، یک CTA نرم مثل «اگه دوست داری، همین الان برای مشاوره رایگان ابعاد و عکس محل رو بفرست» داشته باش.
اگر نیت خرید بالا بود، به‌صورت کوتاه بگو برای هماهنگی با کارشناس آماده‌ای و اطلاعات تماس بگیر.
`;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  crm: router({
    summary: protectedProcedure.query(({ ctx }) => db.getSummaryForUser(ctx.user.id)),
    leads: protectedProcedure.input(z.object({ search: z.string().optional(), stage: z.string().optional() }).optional()).query(({ ctx, input }) => db.getLeadsForUser(ctx.user.id, input)),
    createLead: protectedProcedure.input(z.object({
      business: z.string().trim().min(2).max(191),
      owner: z.string().trim().min(2).max(191),
      category: z.string().trim().min(2).max(191),
      city: z.string().trim().min(2).max(64),
      score: z.number().int().min(0).max(100).default(50),
      stage: z.enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"]).default("lead"),
      source: z.string().trim().min(2).max(191).default("ثبت دستی"),
      need: z.string().trim().min(2).max(2000),
      phone: z.string().trim().min(3).max(64),
      budget: z.string().trim().min(1).max(128),
    })).mutation(({ ctx, input }) => db.createLeadForUser(ctx.user.id, input)),
    updateStage: protectedProcedure.input(z.object({ id: z.string(), stage: z.enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"]) })).mutation(async ({ ctx, input }) => {
      const lead = await db.updateLeadStage(ctx.user.id, input.id, input.stage);
      if (!lead) return { success: false, message: "لید پیدا نشد" } as const;
      return { success: true, lead, label: stageLabels[input.stage] } as const;
    }),
  }),

  discovery: router({
    leads: protectedProcedure.input(z.object({ city: z.string().optional(), category: z.string().optional(), minScore: z.number().optional() }).optional()).query(({ ctx, input }) => db.getDiscoveryForUser(ctx.user.id, input)),
    addToCrm: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => db.addDiscoveryToCrm(ctx.user.id, input.id)),
  }),

  outreach: router({
    campaigns: protectedProcedure.query(({ ctx }) => db.getCampaignsForUser(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      name: z.string().trim().min(2).max(191),
      channel: z.enum(["sms", "whatsapp", "telegram", "instagram"]),
      audience: z.string().trim().min(2).max(191),
      copy: z.string().trim().min(2).max(4000),
    })).mutation(({ ctx, input }) => db.createCampaignForUser(ctx.user.id, input)),
    launch: protectedProcedure.input(z.object({ campaignId: z.string(), channel: z.enum(["sms", "whatsapp", "telegram", "instagram"]) })).mutation(async ({ ctx, input }) => {
      const campaign = await db.launchCampaign(ctx.user.id, input.campaignId, input.channel as Channel);
      if (!campaign) return { success: false, message: "کمپین پیدا نشد" } as const;
      return { success: true, message: `کمپین در حالت پیش‌نمایش از طریق ${input.channel === "sms" ? "پیامک" : input.channel === "whatsapp" ? "واتساپ" : input.channel} فعال شد` } as const;
    }),
  }),

  tasks: router({
    complete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
      const task = await db.completeTask(ctx.user.id, input.id);
      return task ? { success: true, task } as const : { success: false, message: "کار پیدا نشد" } as const;
    }),
  }),

  reports: router({
    overview: protectedProcedure.query(({ ctx }) => db.getReportForUser(ctx.user.id)),
  }),

  notifications: router({
    list: protectedProcedure.query(({ ctx }) => db.getNotificationsForUser(ctx.user.id)),
    markAllRead: protectedProcedure.mutation(({ ctx }) => db.markAllNotificationsRead(ctx.user.id)),
  }),

  settings: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const integrations = await db.getChannelIntegrations(ctx.user.id);
      const configured = new Map(integrations.map(item => [item.channel, item]));
      return {
        user: { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, loginMethod: ctx.user.loginMethod },
        database: await db.checkDatabase(),
        authentication: Boolean(process.env.MANUS_PROJECT_ID && process.env.MANUS_JWT_SECRET),
        channels: ([
          ["sms", "پیامک", "Kavenegar"],
          ["whatsapp", "واتساپ", "Business API"],
          ["telegram", "تلگرام", "Bot API"],
        ] as const).map(([key, label, detail]) => ({ key, label, detail, configured: Boolean(configured.get(key)), enabled: configured.get(key)?.enabled ?? false })),
      };
    }),
    integrations: protectedProcedure.query(async ({ ctx }) => {
      const rows = await db.getChannelIntegrations(ctx.user.id);
      const mask = (value?: string) => value ? `${value.slice(0, 4)}••••${value.slice(-2)}` : "";
      return (["sms", "telegram", "whatsapp"] as const).map(channel => {
        const row = rows.find(item => item.channel === channel);
        const config = row?.config ?? {};
        return { channel, enabled: row?.enabled ?? false, configured: Boolean(row), fields: Object.fromEntries(Object.entries(config).map(([key, value]) => [key, key.toLowerCase().includes("key") || key.toLowerCase().includes("token") || key.toLowerCase().includes("secret") ? mask(value) : value])) };
      });
    }),
    saveIntegration: protectedProcedure.input(z.object({
      channel: z.enum(["sms", "telegram", "whatsapp"]),
      enabled: z.boolean(),
      config: z.record(z.string(), z.string().max(2000)).default({}),
    })).mutation(async ({ ctx, input }) => {
      const config = Object.fromEntries(Object.entries(input.config).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value.length > 0));
      const current = await db.getChannelIntegration(ctx.user.id, input.channel);
      const merged = { ...(current?.config ?? {}), ...config };
      await db.saveChannelIntegration(ctx.user.id, input.channel, input.enabled, merged);
      return { success: true } as const;
    }),
    testIntegration: protectedProcedure.input(z.object({ channel: z.enum(["sms", "telegram", "whatsapp"]) })).mutation(async ({ ctx, input }) => {
      const integration = await db.getChannelIntegration(ctx.user.id, input.channel);
      if (!integration) throw new Error("ابتدا تنظیمات این کانال را ذخیره کنید");
      const message = await testIntegration(input.channel, integration.config);
      return { success: true, message } as const;
    }),
  }),

  assistant: router({
    ask: protectedProcedure.input(z.object({ message: z.string().min(1).max(3000), history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(3000) })).max(20).default([]) })).mutation(async ({ input }) => {
      const messages: Message[] = [
        { role: "system", content: businessKnowledge },
        ...input.history.map(item => ({ role: item.role, content: item.content }) as Message),
        { role: "user", content: input.message },
      ];
      try {
        const response = await invokeLLM({ model: "gpt-6-luna", messages, maxTokens: 700, reasoning: { effort: "low" } });
        const reply = toAssistantText(response.choices[0]?.message?.content ?? "");
        if (reply) return { reply, source: "manus-ai" as const };
      } catch (error) {
        console.warn("[Assistant] Falling back to local response:", error instanceof Error ? error.message : error);
      }
      const lower = input.message.toLowerCase();
      if (lower.includes("قیمت") || lower.includes("هزینه")) return { reply: "قیمت به ابعاد، جنس حروف، نوع نور و محل نصب بستگی داره؛ برای یک برآورد اولیه معمولاً از حدود ۲۰ میلیون شروع می‌شه. اگه عکس محل و اندازه تقریبی رو بفرستی، دقیق‌تر راهنمایی‌ت می‌کنیم. همین الان مشاوره رایگان بگیریم؟", source: "local-fallback" as const };
      if (lower.includes("واتساپ") || lower.includes("تماس")) return { reply: `حتماً. شماره ۰۹۳۶۴۴۲۷۲۷۶ راه ارتباطی مستقیم ${APP_NAME}ئه. همکارامون برای مشاوره، نمونه‌کار و هماهنگی بازدید رایگان در تهران و کرج در خدمتتن.`, source: "local-fallback" as const };
      return { reply: `سلام! من دستیار فروش ${APP_NAME} هستم. درباره تابلو LED، چلنیوم، نئون، لایت‌باکس، طراحی سایت یا قیمت تقریبی هر چیزی خواستی بپرس؛ با حوصله راهنمایی‌ت می‌کنم.`, source: "local-fallback" as const };
    }),
  }),
});

export type AppRouter = typeof appRouter;
