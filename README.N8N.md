# راه‌اندازی n8n روی VPS

n8n باید روی یک VPS دائمی اجرا شود؛ اجرای آن در `public_html` یا Sandbox مناسب نیست. این بسته n8n را با Docker Compose، PostgreSQL و volume دائمی نصب می‌کند.

## نصب

DNS یک زیردامنه مثل `n8n.tablojadoo.ir` را به IP VPS وصل کنید. سپس روی VPS پروژه را به‌روز کنید و اجرا کنید:

```bash
cd /opt/tablojadoo
sudo N8N_DOMAIN=n8n.tablojadoo.ir bash scripts/install-n8n.sh
```

Nginx را تنظیم کنید:

```bash
sudo cp deploy/nginx-n8n.conf /etc/nginx/sites-available/n8n.conf
sudo sed -i 's/n8n.example.com/n8n.tablojadoo.ir/g' /etc/nginx/sites-available/n8n.conf
sudo ln -s /etc/nginx/sites-available/n8n.conf /etc/nginx/sites-enabled/n8n.conf
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d n8n.tablojadoo.ir
```

بعد از بازکردن `https://n8n.tablojadoo.ir`، حساب owner اولیهٔ n8n را بسازید. کلید `N8N_ENCRYPTION_KEY` را تغییر ندهید؛ credentials و workflowهای n8n با آن رمزنگاری می‌شوند.

برای به‌روزرسانی:

```bash
cd /opt/n8n
docker compose --env-file .env.n8n -f docker-compose.n8n.yml pull
docker compose --env-file .env.n8n -f docker-compose.n8n.yml up -d
```

## اتصال به پنل

n8n و پنل باید روی یک VPS یا شبکهٔ قابل‌دسترسی باشند. برای workflowهایی که به backend پنل درخواست می‌فرستند، endpoint عمومی پنل را استفاده کنید؛ secretها را در n8n Credentials نگه دارید، نه در nodeهای متنی یا GitHub.

ترتیب پیشنهادی workflowهای بازاریابی:

1. Schedule Trigger روزانه برای گزارش فروش و taskهای پیگیری.
2. Webhook برای رویدادهای لید و وضعیت پیام.
3. HTTP Request به API پنل برای ثبت activity و نتیجهٔ کمپین.
4. Telegram/WhatsApp/SMS node برای ارسال فقط به مخاطب دارای رضایت.
5. ذخیرهٔ delivery status و خطاها، سپس اعلان به owner.

در حال حاضر نسخهٔ پنل، CRM، کشف لید، کمپین، گزارش، دستیار فارسی و ذخیرهٔ امن credentialهای کانال‌ها را دارد. برای اجرای fully automated واقعی باید endpointهای webhook و ارسال کمپین با opt-in/rate-limit به‌صورت جداگانه تکمیل و سپس workflowها در n8n import و فعال شوند؛ نصب n8n به‌تنهایی مجوز ارسال پیام یا دسترسی به دادهٔ مشتری ایجاد نمی‌کند.

منابع رسمی: [Docker n8n](https://docs.n8n.io/hosting/installation/docker/) و [Webhook پشت reverse proxy](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/configuration-examples/configure-webhook-urls-with-reverse-proxy).
