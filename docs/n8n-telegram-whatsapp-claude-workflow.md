# Workflow نمونهٔ n8n: Telegram + WhatsApp + Claude برای فروش

این طرح یک workflow مشترک برای پاسخ‌گویی فارسی، امتیازدهی لید و ثبت پیگیری است. آن را می‌توان در n8n با nodeهای رسمی Telegram، Webhook، HTTP Request و Anthropic/Claude ساخت. این فایل عمداً هیچ token یا secret واقعی ندارد.

## نتیجهٔ workflow

هر پیام ورودی به این مسیر می‌رود:

```text
Telegram Trigger یا WhatsApp Webhook
        ↓
Normalize Message
        ↓
Claude: تحلیل intent، امتیاز لید و پاسخ فارسی
        ↓
Switch بر اساس channel
   ↙                    ↘
Telegram sendMessage    WhatsApp Cloud API send message
        ↓                    ↓
ثبت در CRM و اعلان اپراتور
```

## credentialهای لازم در n8n

در بخش **Credentials**، سه credential جدا بسازید و tokenها را در متن nodeها ننویسید:

1. **Telegram API**: Bot Token از BotFather.
2. **Anthropic/Claude API**: API Key رسمی Anthropic.
3. **WhatsApp Cloud API**: Access Token متا و Phone Number ID. برای HTTP Request از credential نوع Header Auth با نام `Authorization` و مقدار `Bearer <token>` استفاده کنید.

برای WhatsApp باید webhook متا روی دامنهٔ عمومی HTTPS تنظیم شود. آدرس verify و receive را از node Webhook کپی کنید. Meta برای verify یک GET با `hub.mode`, `hub.verify_token` و `hub.challenge` می‌فرستد؛ verify token را در n8n به‌عنوان secret workflow نگه دارید و فقط در صورت برابر بودن، مقدار challenge را برگردانید.

## nodeهای پیشنهادی

### 1. Telegram Trigger

- Node: **Telegram Trigger**
- Event: `Message`
- Credential: Telegram API
- خروجی مهم: `message.chat.id`, `message.text`, `message.from`, `message.message_id`

بات باید قبلاً توسط کاربر شروع شده باشد. بات نمی‌تواند بدون تعامل قبلی به کاربر خصوصی پیام بدهد.

### 2. WhatsApp Webhook

- Node: **Webhook**
- Method: `POST`
- Path: `whatsapp-inbox`
- Response: `Using Respond to Webhook node`

در payload واتساپ، پیام متنی معمولاً در مسیر زیر قرار می‌گیرد:

```text
entry[0].changes[0].value.messages[0].text.body
```

شماره یا شناسهٔ فرستنده در `messages[0].from` قرار دارد. پیام‌های status یا eventهای غیرمتنی را قبل از Claude با IF node فیلتر کنید.

برای verify اولیهٔ Meta، یک Webhook جدا با Method `GET` بسازید و با Code node این منطق را اجرا کنید:

```javascript
const q = $json.query ?? {};
const expected = $env.WHATSAPP_VERIFY_TOKEN;
if (q['hub.verify_token'] !== expected) {
  return [{ json: { statusCode: 403, body: 'forbidden' } }];
}
return [{ json: { statusCode: 200, body: q['hub.challenge'] ?? '' } }];
```

در production بهتر است verify token را در credential یا secret manager نگه دارید، نه داخل Code node.

### 3. Normalize Message

یک **Code node** بعد از هر trigger قرار دهید یا خروجی دو trigger را به یک Code node برسانید. خروجی استاندارد پیشنهادی:

```json
{
  "channel": "telegram",
  "externalUserId": "123456789",
  "replyTarget": "123456789",
  "text": "سلام، قیمت تابلو چقدر است؟",
  "displayName": "نام مشتری",
  "receivedAt": "2026-11-24T14:00:00.000Z"
}
```

برای Telegram مقدار `replyTarget` همان `chat.id` است. برای WhatsApp مقدار `replyTarget` همان `messages[0].from` است.

### 4. Claude تحلیل فروش

از node رسمی **Anthropic/Claude** یا HTTP Request به Anthropic استفاده کنید. پاسخ را JSON ساختاریافته بخواهید:

```text
تو دستیار فروش فارسی یک شرکت تابلو و تبلیغات هستی.
پیام مشتری را تحلیل کن و فقط JSON معتبر برگردان:
{
  "intent": "price|quote|support|followup|other",
  "leadScore": 0,
  "reply": "پاسخ کوتاه و محترمانهٔ فارسی",
  "nextAction": "یک اقدام بعدی مشخص",
  "needsHuman": false,
  "optInRequired": false
}

قواعد:
- قیمت قطعی اختراع نکن؛ برای قیمت دقیق اطلاعات و بازدید بخواه.
- اگر مشتری درخواست اپراتور کرد، needsHuman=true قرار بده.
- اگر ارسال تبلیغاتی یا پیگیری بدون رضایت لازم است، optInRequired=true قرار بده.
- پاسخ حداکثر 600 کاراکتر باشد.
- leadScore عددی بین 0 تا 100 باشد.
```

در این مرحله خروجی Claude را با **Structured Output Parser** یا Code node اعتبارسنجی کنید. اگر JSON نامعتبر بود، پاسخ fallback بدهید و آن را برای بررسی انسانی علامت‌گذاری کنید.

### 5. Switch بر اساس کانال

شرط `channel` را بررسی کنید:

- اگر `telegram` بود، به Telegram Send Message بروید.
- اگر `whatsapp` بود، به HTTP Request واتساپ بروید.
- اگر `needsHuman=true` بود، علاوه بر پاسخ، یک اعلان برای اپراتور بفرستید.

### 6. Telegram Send Message

- Node: **Telegram**
- Operation: `Send Message`
- Chat ID: `{{$json.replyTarget}}`
- Text: `{{$json.reply}}`

برای جلوگیری از ارسال ناخواسته، قبل از این node یک IF قرار دهید که `reply` خالی نباشد و مخاطب opt-out نکرده باشد.

### 7. WhatsApp Cloud API Send Message

- Node: **HTTP Request**
- Method: `POST`
- URL:

```text
https://graph.facebook.com/vXX.X/PHONE_NUMBER_ID/messages
```

- Authentication: Header Auth با Bearer Access Token
- Content-Type: `application/json`
- Body:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "{{$json.replyTarget}}",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "{{$json.reply}}"
  }
}
```

`vXX.X` و `PHONE_NUMBER_ID` را با مقادیر واقعی Meta جایگزین کنید. خارج از پنجرهٔ خدمات مشتری، به‌جای text باید از Template تأییدشدهٔ Meta استفاده شود.

### 8. ثبت در CRM

پس از ارسال، یک HTTP Request به endpoint امن پنل یا یک Data Table در n8n اضافه کنید و این فیلدها را ذخیره کنید:

```text
channel
externalUserId
incomingText
assistantReply
intent
leadScore
nextAction
needsHuman
providerMessageId
sentAt
```

در نسخهٔ فعلی پنل، endpoint عمومی مخصوص webhook پیام هنوز جزو APIهای منتشرشده نیست. بنابراین تا زمان اضافه‌شدن endpoint امضاشده، ثبت موقت در Data Table n8n انجام دهید و برای ثبت مستقیم در CRM یک endpoint server-side با HMAC و rate limit اضافه کنید. هرگز برای دور زدن authentication، credential کاربر را در workflow hardcode نکنید.

## کنترل‌های ضروری production

قبل از فعال‌سازی workflow این کنترل‌ها را بگذارید:

- opt-in و opt-out برای هر مخاطب.
- جلوگیری از ارسال تکراری با message ID و idempotency key.
- rate limit برای هر channel و هر مخاطب.
- ثبت خطای provider و retry با backoff.
- مسیر human handoff برای پیام‌های حساس، شکایت یا درخواست قیمت نهایی.
- عدم ارسال تبلیغات WhatsApp خارج از Template و قواعد Meta.
- عدم نمایش API key در execution data و logها.
- backup از PostgreSQL n8n و فعال‌بودن `N8N_ENCRYPTION_KEY` ثابت.

## اجرای زمان‌بندی پیگیری

یک workflow دوم بسازید:

```text
Schedule Trigger هر روز ساعت 09:00
        ↓
Data Table / CRM: لیدهای بدون پیگیری بیش از 24 ساعت
        ↓
Claude: تولید متن پیگیری شخصی‌سازی‌شده
        ↓
IF: رضایت و محدودیت ارسال بررسی شود
        ↓
Telegram یا WhatsApp یا SMS
        ↓
ثبت نتیجه و زمان پیگیری بعدی
```

این workflow باید ابتدا در حالت Manual/Inactive آزمایش شود. پس از بررسی چند اجرای واقعی و تأیید متن‌ها، آن را Active کنید.
