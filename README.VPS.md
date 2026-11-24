# اجرای نسخهٔ production روی VPS یا DirectAdmin

این پروژه یک پنل وب کامل با React/Vite در frontend و Node.js/Express/tRPC در backend است. فقط آپلود `public_html` کافی نیست؛ برای login، دیتابیس، CRM، کشف لید، کمپین، گزارش، دستیار فروش و credentialهای رمزنگاری‌شده، backend و MySQL باید اجرا شوند.

## سریع‌ترین روش روی VPS Ubuntu با Docker

DNS دامنه را به IP سرور وصل کنید، سپس روی VPS اجرا کنید:

```bash
sudo apt-get update
sudo apt-get install -y git curl rsync nginx certbot python3-certbot-nginx
sudo mkdir -p /opt/tablojadoo
sudo chown -R "$USER":"$USER" /opt/tablojadoo
# سورس ZIP را در /opt/tablojadoo extract کنید یا repository را clone کنید.
cd /opt/tablojadoo
cp .env.example .env
chmod 600 .env
nano .env
```

در `.env` علاوه بر متغیرهای Manus، این مقادیر را وارد کنید:

```dotenv
MYSQL_DATABASE=tablojadoo
MYSQL_USER=tablojadoo
MYSQL_PASSWORD=یک_رمز_قوی
MYSQL_ROOT_PASSWORD=یک_رمز_قوی_دیگر
APP_PORT=3000
```

سپس نصب و build را انجام دهید:

```bash
sudo bash scripts/vps-install.sh
curl http://127.0.0.1:3000/api/health
```

باید پاسخ `{"status":"ok"}` دریافت شود. اسکریپت compose دیتابیس را بالا می‌آورد، migrationهای Drizzle را در زمان شروع backend اجرا می‌کند و برنامه را restart-safe اجرا می‌کند.

برای Nginx، فایل `deploy/nginx-tablojadoo.conf` را در `/etc/nginx/sites-available/tablojadoo.conf` کپی کنید، دامنه را اصلاح کنید و بعد SSL بگیرید:

```bash
sudo ln -s /etc/nginx/sites-available/tablojadoo.conf /etc/nginx/sites-enabled/tablojadoo.conf
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d tablojadoo.ir -d www.tablojadoo.ir
```

بعد از هر release جدید:

```bash
cd /opt/tablojadoo
sudo bash scripts/vps-update.sh
```

backup دستی یا cron:

```bash
sudo bash scripts/backup-db.sh
sudo crontab -e
# هر شب ساعت 03:30
30 3 * * * APP_DIR=/opt/tablojadoo /opt/tablojadoo/scripts/backup-db.sh >> /var/log/tablojadoo-backup.log 2>&1
```

## VPS بدون Docker با systemd

اگر Docker در دسترس نیست، Node.js 22، pnpm 10.18 و MySQL را نصب کنید، سورس را در `/opt/tablojadoo` قرار دهید و اجرا کنید:

```bash
cd /opt/tablojadoo
pnpm install --frozen-lockfile
cp .env.example .env
chmod 600 .env
nano .env
pnpm exec drizzle-kit migrate
pnpm build
sudo useradd --system --home /opt/tablojadoo --shell /usr/sbin/nologin tablojadoo || true
sudo chown -R tablojadoo:tablojadoo /opt/tablojadoo
sudo cp deploy/tablojadoo.service /etc/systemd/system/tablojadoo.service
sudo systemctl daemon-reload
sudo systemctl enable --now tablojadoo
sudo systemctl status tablojadoo
```

برای دیدن خطاهای backend از `sudo journalctl -u tablojadoo -f` استفاده کنید. سپس Nginx را طبق بخش قبل فعال کنید.

## DirectAdmin با Node.js Application

اگر هاست DirectAdmin از Node.js 22 و MySQL پشتیبانی می‌کند، ZIP را خارج از `public_html` در مسیر application قرار دهید. `package.json`، `server`، `client`، `drizzle` و `shared` باید در root باشند. سپس:

```bash
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
chmod 600 .env
nano .env
pnpm exec drizzle-kit migrate
pnpm build
```

در Node.js Application مقدار Startup File را `dist/index.js` بگذارید و Node.js را روی 22.x تنظیم کنید. دامنه باید با HTTPS به application متصل شود.

## تنظیم قابلیت‌های بازاریابی و فروش

پس از ورود به `/settings`، کانال‌ها را به‌صورت per-user تنظیم کنید. Telegram با Bot Token و Chat ID تست می‌شود. WhatsApp با Access Token، Phone Number ID و نسخه Graph API بررسی می‌شود. SMS فعلاً از Kavenegar استفاده می‌کند و تست آن پیام واقعی به شماره تست می‌فرستد.

قابلیت‌های موجود شامل داشبورد KPI و قیف فروش، CRM و kanban لید، جست‌وجو و فیلتر، کشف لید نمونه، افزودن لید به CRM، ساخت کمپین، گزارش‌ها، کارهای روزانه، اعلان‌ها و دستیار فارسی فروش است. منابع زندهٔ Google Maps، ارسال انبوه واقعی، opt-in/opt-out، delivery status و webhookهای WhatsApp نیازمند اتصال و پیاده‌سازی جداگانهٔ سرویس مربوط هستند و با قرار دادن secret در frontend فعال نمی‌شوند.

هرگز `.env`، توکن Telegram، Access Token واتساپ، API Key پیامک، رمز دیتابیس یا `MANUS_JWT_SECRET` را داخل GitHub یا ZIP عمومی قرار ندهید.
