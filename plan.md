# برنامه‌ی فاز MVP و Beta (Mooooobadel*&_-__----💰)

## هدف

ساخت یک پنل فروش فارسی برای (Mooooobadel*&_-__----💰) که در یک جریان واحد، کشف لید، مدیریت قیف فروش، تولید ارتباط و کمک هوشمند را قابل مشاهده و قابل تست کند.

## معماری

- Frontend: React 19 + Vite + Tailwind CSS v4، با routeهای `/`، `/crm`، `/leads`، `/outreach` و `/assistant`.
- Backend: Express + tRPC؛ قراردادها در `server/routers.ts` و لایه‌ی LLM در `server/_core/llm.ts`.
- Data boundary: store حافظه‌ای برای Preview فاز اول، با typeهای مشخص و مسیر مهاجرت به Drizzle/MySQL.
- AI: Manus built-in LLM از سمت سرور، با knowledge base ثابت (Mooooobadel*&_-__----💰) و fallback محلی.
- Channels: قرارداد کمپین و وضعیت اتصال، بدون ارسال واقعی تا زمان ثبت credential و پیاده‌سازی opt-in/opt-out.

## طراحی

**حرکت طراحی:** داشبورد شبانه‌ی «Mission Control» برای یک تیم فروش ایرانی؛ پنل‌های تیره با نقاط نورانی طلایی و بنفش.

**اصول:** اطلاعات در یک نگاه، کنتراست بالا، فارسی محاوره‌ای اما حرفه‌ای، و تعاملات کوتاه با بازخورد فوری.

**فلسفه‌ی رنگ:** زمینه‌ی نزدیک به مشکی برای تمرکز؛ طلایی برای ارزش و اقدام اصلی؛ بنفش برای قابلیت‌های AI؛ صورتی برای سیگنال‌ها و توجه.

**ساختار:** سایدبار راست در دسکتاپ و bottom-nav در موبایل؛ صفحه‌ها با یک heading کوتاه، summary cards و پنل‌های اطلاعاتی چندلایه ساخته شده‌اند.

**نشانه‌های بصری:** نشان ستاره‌ای برند، چیپ امتیاز لید، pipeline dots و orbهای نورانی برای AI.

**تعامل:** CTAهای اصلی کوتاه و مشخص‌اند؛ تغییر مرحله و افزودن لید با mutation و toast تأیید می‌شوند؛ چت با Enter ارسال می‌شود.

**تایپوگرافی:** fallback فارسی سیستم با وزن‌های پررنگ برای KPI و وزن سبک برای متادیتا؛ بدون وابستگی به فونت خارجی در Preview.

## تصمیم دامنه

برای اینکه فاز اول بدون کلید سرویس‌های بیرونی قابل ارزیابی باشد، ارسال پیامک و واتساپ در حالت preview باقی مانده است. در Beta داده‌های اصلی و عملیات داشبورد روی دیتابیس مدیریت‌شده و APIهای tRPC پایدار می‌شوند. ارسال production کانال‌ها فقط پس از تعریف credential امن و رعایت opt-in/opt-out، rate limit و delivery status مجاز است؛ در نبود credential، UI باید وضعیت «تنظیم نشده» و اقدام بعدی روشن نشان دهد و هرگز ارسال جعلی انجام ندهد.

## معماری فاز Beta

- **Persistence:** همان MySQL مدیریت‌شده با Drizzle؛ جداول `users`, `leads`, `discoveryLeads`, `campaigns`, `tasks` و `activityEvents` با ownerId و migrationهای additive. seed هر workspace idempotent است و دادهٔ کاربر را overwrite نمی‌کند.
- **API boundary:** تمام عملیات UI شامل ثبت لید، تغییر مرحله، افزودن لید کشف‌شده، تکمیل کار، ساخت/فعال‌سازی کمپین، گزارش‌ها و اعلان‌ها از protected tRPC procedure عبور می‌کنند و در سرور بر اساس ownerId محدود می‌شوند.
- **Authentication:** Manus OAuth موجود حفظ می‌شود؛ session با cookie دقیق `webdev_app_session`، اعتبارسنجی JWT و سازگاری cross-site Preview ادامه پیدا می‌کند. هیچ login شبیه‌سازی‌شده‌ای اضافه نمی‌شود.
- **Activity log:** تغییرات مهم در `activityEvents` ثبت می‌شوند تا Bell و مرکز اعلان‌ها دادهٔ واقعی و پایدار داشته باشند.
- **UI constraint:** رنگ‌های تیره/طلایی/بنفش، layout، spacing و componentهای موجود حفظ می‌شوند. قابلیت‌های جدید در همان Dialog، panel و routeهای موجود اضافه می‌شوند و بازطراحی بصری انجام نمی‌شود.
- **New routes:** `/reports` و `/settings` به همان shell فعلی اضافه می‌شوند؛ route manifest همیشه با source همگام می‌ماند.
