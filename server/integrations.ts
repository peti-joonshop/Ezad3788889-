export type IntegrationChannel = "sms" | "telegram" | "whatsapp";

type IntegrationConfig = Record<string, string>;

function required(config: IntegrationConfig, key: string) {
  const value = config[key]?.trim();
  if (!value) throw new Error(`فیلد ${key} الزامی است`);
  return value;
}

async function readResponse(response: Response) {
  const text = await response.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* keep text */ }
  if (!response.ok) {
    const detail = typeof body === "object" && body !== null && "message" in body ? String((body as { message?: unknown }).message) : text;
    throw new Error(detail || `HTTP ${response.status}`);
  }
  return body;
}

async function testSms(config: IntegrationConfig) {
  const provider = (config.provider || "kavenegar").toLowerCase();
  if (provider !== "kavenegar") throw new Error("در حال حاضر پنل SMS پشتیبانی‌شده Kavenegar است");
  const apiKey = required(config, "apiKey");
  const sender = config.sender?.trim();
  const receptor = config.testRecipient?.trim();
  if (!receptor) throw new Error("برای تست پیامک، شماره گیرندهٔ تست را وارد کنید");
  const body = new URLSearchParams({ receptor, message: config.testMessage?.trim() || "تست اتصال از ابزار فروش", ...(sender ? { sender } : {}) });
  const response = await fetch(`https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/sms/send.json`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  await readResponse(response);
  return "پیامک تست با موفقیت ارسال شد";
}

async function testTelegram(config: IntegrationConfig) {
  const token = required(config, "botToken");
  const base = `https://api.telegram.org/bot${encodeURIComponent(token)}`;
  const me = await readResponse(await fetch(`${base}/getMe`)) as { ok?: boolean; result?: { username?: string } };
  const chatId = config.chatId?.trim();
  if (chatId) {
    await readResponse(await fetch(`${base}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: config.testMessage?.trim() || "تست اتصال از ابزار فروش" }) }));
    return `اتصال تلگرام و ارسال تست موفق بود${me.result?.username ? ` (@${me.result.username})` : ""}`;
  }
  return `توکن تلگرام معتبر است${me.result?.username ? ` (@${me.result.username})` : ""}؛ برای ارسال تست، Chat ID را هم وارد کنید`;
}

async function testWhatsapp(config: IntegrationConfig) {
  const token = required(config, "accessToken");
  const phoneNumberId = required(config, "phoneNumberId");
  const version = config.apiVersion?.trim() || "v20.0";
  const response = await fetch(`https://graph.facebook.com/${encodeURIComponent(version)}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name`, { headers: { authorization: `Bearer ${token}` } });
  const body = await readResponse(response) as { display_phone_number?: string; verified_name?: string };
  return `اتصال WhatsApp معتبر است${body.verified_name ? ` · ${body.verified_name}` : ""}`;
}

export async function testIntegration(channel: IntegrationChannel, config: IntegrationConfig) {
  if (channel === "sms") return testSms(config);
  if (channel === "telegram") return testTelegram(config);
  return testWhatsapp(config);
}
