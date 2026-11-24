# راهنمای استقرار روی DirectAdmin

این بسته، سورس کامل frontend و backend پروژهٔ `(Mooooobadel*&_-__----💰)` را برای اجرای production روی یک هاست DirectAdmin شامل Node.js و MySQL/MariaDB آماده می‌کند.

## نکتهٔ مهم دربارهٔ «کاملاً مستقل از Manus»

این انتقال، سایت را از hosting و Live URL مربوط به Manus مستقل می‌کند؛ اما کد فعلی هنوز برای دو قابلیت به سرویس‌های Manus متکی است:

1. ورود واقعی، از جمله **Continue with Google**، از Manus OAuth استفاده می‌کند.
2. دستیار فروش برای پاسخ‌های هوشمند از Manus API/LLM استفاده می‌کند و در نبود آن به پاسخ‌های محلی fallback می‌کند.

برای حفظ همین رفتار باید متغیرهای `MANUS_*` را تنظیم کنید و callback دامنهٔ جدید را در پروژهٔ OAuth مربوط به Manus مجاز کنید. اگر استقلال کامل از Manus، شامل Auth و LLM، هدف قطعی است، باید provider احراز هویت و سرویس LLM جداگانه جایگزین شوند؛ این کار خارج از صرفاً انتقال hosting است.

## نیازمندی‌ها

- Node.js **22.x LTS**. نسخهٔ مورد استفاده در `Dockerfile` پروژه `node:22-bookworm-slim` است.
- pnpm **10.18.0**؛ نسخه در `package.json` و `pnpm-lock.yaml` قفل شده است.
- MySQL 8.x یا MariaDB سازگار با `mysql2`.
- دسترسی SSH یا Terminal در DirectAdmin.
- Node.js Selector/Application Manager در DirectAdmin با اجرای Passenger یا reverse proxy.
- گواهی SSL فعال برای دامنه، مخصوصاً برای cookie و OAuth.

از Node.js خیلی قدیمی یا npm به‌جای pnpm برای نصب نهایی استفاده نکنید؛ lockfile پروژه pnpm است و نصب با npm ممکن است dependency graph متفاوتی بسازد.

## ۱. ساخت دیتابیس در DirectAdmin

در DirectAdmin به **MySQL Management** بروید و این موارد را بسازید:

- یک database، مثلاً `tablojadoo_prod`
- یک database user اختصاصی
- رمز قوی برای همان user
- دسترسی کامل user به همان database

نام نهایی database در بعضی هاست‌ها با username هاست prefix می‌شود؛ مقدار واقعی را از DirectAdmin بردارید و همان را در `DATABASE_URL` قرار دهید.

فرمت اتصال:

```text
mysql://DB_USER:DB_PASSWORD@127.0.0.1:3306/DB_NAME
```

اگر هاست مقدار host یا port متفاوتی اعلام کرده است، همان مقدار را جایگزین کنید. در صورت وجود کاراکترهایی مثل `@`, `:`, `/` یا `#` در رمز، آن‌ها را URL-encode کنید.

## ۲. آپلود سورس

ZIP را در مسیر دلخواه دامنه، مثلاً مسیر application جدا از `public_html`، آپلود و extract کنید:

```bash
mkdir -p ~/domains/tablojadoo.ir/nodeapp
cd ~/domains/tablojadoo.ir/nodeapp
# ZIP را اینجا upload و extract کنید.
```

سورس باید مستقیماً در همین پوشه باشد؛ یعنی فایل‌های زیر در root آن دیده شوند:

```text
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
Dockerfile
client/
server/
drizzle/
shared/
```

`node_modules/`, `dist/`, `.git/` و فایل `.env` واقعی داخل ZIP قرار ندارند و باید روی هاست ساخته شوند.

## ۳. نصب Node.js و pnpm

در Terminal هاست، پس از انتخاب Node.js 22.x در DirectAdmin، اجرا کنید:

```bash
cd ~/domains/tablojadoo.ir/nodeapp
node --version
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm --version
```

خروجی مورد انتظار تقریباً این است:

```text
v22.x.x
10.18.0
```

اگر `corepack` روی build هاست موجود نبود، pnpm را در سطح کاربر نصب کنید:

```bash
npm install --global pnpm@10.18.0
```

## ۴. ساخت فایل محیطی

فایل نمونه را کپی کنید:

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

حداقل این مقادیر را واقعی کنید:

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://DB_USER:DB_PASSWORD@127.0.0.1:3306/DB_NAME
MANUS_PROJECT_ID=...
MANUS_JWT_SECRET=...
MANUS_OAUTH_API_URL=https://api.manus.ai
MANUS_OAUTH_PORTAL_URL=https://manus.im
MANUS_API_URL=https://forge.manus.ai
MANUS_API_KEY=...
```

برای ساخت secret امن:

```bash
openssl rand -base64 48
```

مقدار تولیدشده را برای `MANUS_JWT_SECRET` قرار دهید. `.env` را commit یا public نکنید.

## ۵. نصب dependencyها و build

در root پروژه اجرا کنید:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

`pnpm build` هم frontend را با Vite در `dist/public` می‌سازد و هم backend production را در `dist/index.js` bundle می‌کند.

اگر هاست فقط npm را پیشنهاد می‌کند، دستور معادل ممکن است کار کند، اما روش توصیه‌شدهٔ این پروژه همچنان pnpm است:

```bash
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm install --frozen-lockfile
pnpm build
```

## ۶. اجرای migration دیتابیس

بعد از قرار دادن `DATABASE_URL` و قبل از اولین اجرای واقعی:

```bash
pnpm exec drizzle-kit migrate
```

این دستور migrationهای commit‌شدهٔ پوشهٔ `drizzle/` را روی MySQL اجرا می‌کند. از `db:push` روی production استفاده نکنید مگر اینکه آگاهانه بخواهید schema را با روش push تغییر دهید؛ روش استاندارد این بسته migration است.

برای بررسی دستی اتصال:

```bash
mysql -h 127.0.0.1 -u DB_USER -p DB_NAME
```

## ۷. تنظیم Node.js Application در DirectAdmin

در **Node.js Selector / Node.js Application / Application Manager** یک application بسازید:

- **Application root:** مسیر root پروژه، مثلاً `domains/tablojadoo.ir/nodeapp`
- **Application URL:** `https://tablojadoo.ir`
- **Node.js version:** 22.x
- **Environment:** Production
- **Startup file:** `dist/index.js`
- **Application mode:** production، در صورت وجود
- **Environment variables:** مقادیر `.env.example` را در پنل نیز ثبت کنید اگر Passenger فایل `.env` را load نمی‌کند.

این backend روی `process.env.PORT` گوش می‌دهد و باید روی `0.0.0.0` در همان port اجرا شود؛ port عمومی را در کد hardcode نکنید. DirectAdmin/Passenger یا reverse proxy باید ترافیک HTTPS دامنه را به application منتقل کند.

برای تست دستی موقت:

```bash
cd ~/domains/tablojadoo.ir/nodeapp
NODE_ENV=production pnpm start
```

برای اجرای دائمی، از process manager ارائه‌شده توسط DirectAdmin/Passenger استفاده کنید. اجرای `screen` یا `nohup` راه‌حل دائمی توصیه‌شده نیست.

## ۸. SSL، callback و Google Login

قبل از تست login، Let’s Encrypt را برای `tablojadoo.ir` فعال کنید. آدرس callback مورد نیاز این پروژه:

```text
https://tablojadoo.ir/api/oauth/callback
```

در تنظیمات OAuth پروژهٔ Manus، دامنهٔ production و callback بالا را مجاز کنید. سپس در Chrome یک پنجرهٔ ناشناس باز کنید و مسیر زیر را تست کنید:

```text
https://tablojadoo.ir/
```

صفحه باید به Manus Login Portal برود و **Continue with Google** را نشان دهد. پس از بازگشت از OAuth، باید به `/` برگردد و session در cookie `webdev_app_session` ذخیره شود.

بدون `MANUS_PROJECT_ID`, `MANUS_JWT_SECRET`, `MANUS_OAUTH_API_URL` و `MANUS_OAUTH_PORTAL_URL` ورود فعلی کار نمی‌کند. برای استقلال کامل از Manus باید OAuth را در کد با یک provider مستقل جایگزین کنید.

## ۹. تست نهایی

```bash
curl -i https://tablojadoo.ir/api/health
curl -I https://tablojadoo.ir/
```

پاسخ health باید شبیه این باشد:

```json
{"status":"ok"}
```

سپس این موارد را بررسی کنید:

- صفحهٔ اصلی با HTTPS باز می‌شود.
- فایل‌های frontend بدون خطای 404 بارگذاری می‌شوند.
- Login و callback کامل می‌شوند.
- در صفحهٔ Settings وضعیت database و authentication فعال است.
- ساخت lead، تغییر stage، ساخت campaign و reports روی دیتابیس جدید کار می‌کنند.

## ۱۰. تنظیم کانال‌های پیامکی، تلگرام و واتساپ از داخل داشبورد

پس از ورود به حساب، به مسیر `https://tablojadoo.ir/settings` بروید. در بخش «اتصال کانال‌های پیام‌رسان» برای هر کانال credentialهای همان حساب را وارد کنید، گزینهٔ فعال را روشن کنید و ابتدا «ذخیره» و سپس «تست» را بزنید. credentialها در backend با AES-256-GCM و کلید مشتق‌شده از `MANUS_JWT_SECRET` رمزنگاری می‌شوند؛ در frontend و پاسخ API فقط مقدار ماسک‌شده نمایش داده می‌شود.

برای پیامک، نسخهٔ فعلی از Kavenegar پشتیبانی می‌کند و API Key، شمارهٔ فرستنده و شمارهٔ تست را می‌گیرد. تست Kavenegar واقعاً یک پیامک به `testRecipient` ارسال می‌کند و ممکن است هزینه داشته باشد. برای Telegram، Bot Token از BotFather لازم است و برای ارسال تست باید Chat ID معتبر و مجوز ارسال بات وجود داشته باشد. برای WhatsApp، Access Token، Phone Number ID و دسترسی Meta WhatsApp Cloud API لازم است؛ این بخش بدون Business/Cloud API رسمی Meta به شبکهٔ خصوصی WhatsApp دسترسی ندارد.

اگر `MANUS_JWT_SECRET` تنظیم نشده باشد، ذخیرهٔ credentialها عمداً شکست می‌خورد. برای تغییر secret پس از ذخیرهٔ کانال‌ها، ابتدا credentialها را دوباره با secret جدید وارد و ذخیره کنید؛ در غیر این صورت داده‌های رمزنگاری‌شدهٔ قبلی قابل رمزگشایی نخواهند بود.

## دستورات نگهداری و به‌روزرسانی

برای update بعدی:

```bash
cd ~/domains/tablojadoo.ir/nodeapp
# source جدید را آپلود یا pull کنید
pnpm install --frozen-lockfile
pnpm exec drizzle-kit migrate
pnpm check
pnpm build
# سپس application را از DirectAdmin restart کنید
```

هیچ‌گاه `.env`، `MANUS_API_KEY`، `MANUS_JWT_SECRET` یا رمز دیتابیس را داخل ZIP عمومی، Git یا چت قرار ندهید.
