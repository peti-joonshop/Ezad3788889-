import crypto from "node:crypto";
import express, { type Request, type Response } from "express";
import { createLeadForUser, recordActivity } from "../server/db";

/**
 * نمونهٔ قابل اتصال به backend فعلی.
 * این routeها را قبل از express.json() در server/_core/index.ts ثبت کنید؛
 * چون برای HMAC به raw body نیاز داریم.
 */
export function createMessagingWebhookRouter() {
  const router = express.Router();
  const ownerId = Number(process.env.WEBHOOK_OWNER_ID || "0");
  if (!ownerId) throw new Error("WEBHOOK_OWNER_ID is required");

  const parseBody = (req: Request) => {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
    return { raw, json: JSON.parse(raw.toString("utf8")) as Record<string, any> };
  };

  const safeEqual = (a: string, b: string) => {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  };

  const verifyHmacSha256 = (raw: Buffer, header: string | undefined, secret: string | undefined) => {
    if (!header || !secret || !header.startsWith("sha256=")) return false;
    const expected = `sha256=${crypto.createHmac("sha256", secret).update(raw).digest("hex")}`;
    return safeEqual(expected, header);
  };

  const clean = (value: unknown, max = 2000) => String(value ?? "").trim().slice(0, max);

  // Telegram Secret Token is configured when calling setWebhook. It is not the bot token.
  const verifyTelegramSecret = (req: Request) => {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
    const received = req.header("x-telegram-bot-api-secret-token");
    return Boolean(expected && received && safeEqual(expected, received));
  };

  // Minimal idempotency guard for the example. Use a UNIQUE provider event table in production.
  const seen = new Set<string>();
  const once = (key: string) => {
    if (seen.has(key)) return false;
    seen.add(key);
    if (seen.size > 10_000) seen.delete(seen.values().next().value as string);
    return true;
  };

  async function registerLead(input: {
    channel: "telegram" | "whatsapp";
    externalId: string;
    sender: string;
    name: string;
    text: string;
  }) {
    if (!once(`${input.channel}:${input.externalId}`)) return { duplicate: true };

    // This creates a lead in the current CRM schema. In a mature deployment,
    // first look up the contact by phone/externalId and update instead of inserting.
    const lead = await createLeadForUser(ownerId, {
      business: `${input.channel === "telegram" ? "Telegram" : "WhatsApp"} · ${input.name || input.sender}`,
      owner: input.name || input.sender,
      category: "پیام ورودی",
      city: "نامشخص",
      score: 50,
      stage: "lead",
      source: input.channel === "telegram" ? "Telegram webhook" : "WhatsApp webhook",
      need: input.text || "پیام بدون متن",
      phone: input.sender,
      budget: "نامشخص",
    });

    await recordActivity(
      ownerId,
      "inbound_message",
      `پیام جدید از ${input.channel === "telegram" ? "تلگرام" : "واتساپ"}`,
      `${input.name || input.sender}: ${input.text || "بدون متن"}`,
    );
    return { duplicate: false, leadId: lead.id };
  }

  // Telegram: configure BotFather webhook with secret_token and this HTTPS URL.
  router.post("/telegram", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    if (!verifyTelegramSecret(req)) return res.sendStatus(401);
    try {
      const { json } = parseBody(req);
      const message = json.message;
      const text = clean(message?.text);
      const sender = clean(message?.chat?.id || message?.from?.id, 128);
      if (!sender) return res.status(200).json({ ok: true, ignored: true });
      const result = await registerLead({
        channel: "telegram",
        externalId: clean(json.update_id, 128),
        sender,
        name: clean(message?.from?.first_name || message?.chat?.first_name, 191),
        text,
      });
      return res.status(200).json({ ok: true, ...result });
    } catch (error) {
      console.error("[Webhook:Telegram]", error instanceof Error ? error.message : error);
      return res.status(500).json({ ok: false });
    }
  });

  // WhatsApp Cloud API verification handshake.
  router.get("/whatsapp", (req, res) => {
    const mode = clean(req.query["hub.mode"], 32);
    const token = clean(req.query["hub.verify_token"], 256);
    const challenge = clean(req.query["hub.challenge"], 512);
    if (mode === "subscribe" && process.env.WHATSAPP_VERIFY_TOKEN && safeEqual(token, process.env.WHATSAPP_VERIFY_TOKEN)) return res.status(200).send(challenge);
    return res.sendStatus(403);
  });

  // WhatsApp: set META_APP_SECRET and validate x-hub-signature-256.
  router.post("/whatsapp", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    try {
      const { raw, json } = parseBody(req);
      if (!verifyHmacSha256(raw, req.header("x-hub-signature-256"), process.env.META_APP_SECRET)) return res.sendStatus(401);
      if (json.object !== "whatsapp_business_account") return res.status(200).json({ ok: true, ignored: true });

      for (const entry of json.entry ?? []) {
        for (const change of entry.changes ?? []) {
          for (const message of change.value?.messages ?? []) {
            if (message.type !== "text") continue;
            const sender = clean(message.from, 64);
            const text = clean(message.text?.body);
            await registerLead({
              channel: "whatsapp",
              externalId: clean(message.id, 128),
              sender,
              name: clean(change.value?.contacts?.[0]?.profile?.name, 191),
              text,
            });
          }
        }
      }
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("[Webhook:WhatsApp]", error instanceof Error ? error.message : error);
      return res.status(500).json({ ok: false });
    }
  });

  return router;
}

/* Integration in server/_core/index.ts, before the global JSON parser:

import { createMessagingWebhookRouter } from "../webhooks.example";
app.use("/api/webhooks", createMessagingWebhookRouter());
app.use(express.json({ limit: "50mb" }));

Required server environment variables:
WEBHOOK_OWNER_ID=1
TELEGRAM_WEBHOOK_SECRET=<random secret used in setWebhook>
WHATSAPP_VERIFY_TOKEN=<random verify token>
META_APP_SECRET=<Meta app secret, used for HMAC>

Production notes:
- Replace the in-memory `seen` Set with a database table having a unique key on (channel, externalId).
- Map each Telegram bot/WhatsApp account to an ownerId instead of one global WEBHOOK_OWNER_ID.
- Do not log raw tokens or full payloads.
- Return 2xx quickly and enqueue long Claude/API work in a queue or n8n.
*/
