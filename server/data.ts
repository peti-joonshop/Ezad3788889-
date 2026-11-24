export type LeadStage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type Channel = "sms" | "whatsapp" | "telegram" | "instagram";

export type SeedLead = {
  id: string;
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
  lastTouch: string;
  createdAt: string;
};

export type SeedDiscoveryLead = SeedLead & {
  signal: string;
  reason: string;
  website: boolean;
  signage: boolean;
};

export type SeedCampaign = {
  id: string;
  name: string;
  channel: Channel;
  audience: string;
  status: "active" | "scheduled" | "completed";
  sent: number;
  replies: number;
  conversion: string;
  copy: string;
};

export type SeedTask = { id: string; title: string; meta: string; urgent: boolean };

export const seedLeads: SeedLead[] = [
  { id: "L-1042", business: "کافه دارک", owner: "آرمان رضایی", category: "کافه و رستوران", city: "تهران", score: 92, stage: "qualified", source: "Google Maps", need: "تابلو چلنیوم + لایت‌باکس", phone: "0912•••4812", budget: "۴۵–۷۰ م تومان", lastTouch: "امروز، ۱۰:۴۲", createdAt: "۲ روز پیش" },
  { id: "L-1038", business: "کلینیک دکتر نادری", owner: "دکتر نادری", category: "پزشکی", city: "کرج", score: 87, stage: "proposal", source: "اینستاگرام", need: "تابلو حروف برجسته", phone: "0935•••1209", budget: "۳۰–۵۰ م تومان", lastTouch: "دیروز، ۱۶:۲۰", createdAt: "۳ روز پیش" },
  { id: "L-1031", business: "بوتیک هرمس", owner: "نگین کریمی", category: "پوشاک", city: "تهران", score: 78, stage: "lead", source: "کشف هوشمند", need: "نئون و نورپردازی ویترین", phone: "0910•••7731", budget: "۲۰–۳۵ م تومان", lastTouch: "بدون پیگیری", createdAt: "امروز" },
  { id: "L-1027", business: "فروشگاه آریا", owner: "میلاد احمدی", category: "لوازم خانگی", city: "کرج", score: 74, stage: "negotiation", source: "معرفی مشتری", need: "تابلو LED متحرک", phone: "0902•••8450", budget: "۵۰–۸۰ م تومان", lastTouch: "شنبه، ۱۱:۰۵", createdAt: "۵ روز پیش" },
  { id: "L-1021", business: "آموزشگاه زبان پُل", owner: "سارا موسوی", category: "آموزشی", city: "تهران", score: 69, stage: "won", source: "وب‌سایت", need: "تابلو سردر + سایت", phone: "0919•••0045", budget: "۶۰–۹۰ م تومان", lastTouch: "هفته پیش", createdAt: "۱۱ روز پیش" },
  { id: "L-1018", business: "سالن زیبایی لی‌لی", owner: "الهام حسینی", category: "زیبایی", city: "تهران", score: 61, stage: "lead", source: "دیوار", need: "لایت‌باکس ورودی", phone: "0936•••6502", budget: "۱۵–۲۵ م تومان", lastTouch: "بدون پیگیری", createdAt: "امروز" },
  { id: "L-1012", business: "سوپرمارکت شبانه‌روزی", owner: "حامد اکبری", category: "خرده‌فروشی", city: "کرج", score: 55, stage: "lost", source: "کتاب اول", need: "تابلو LED", phone: "0911•••9980", budget: "۲۰–۳۰ م تومان", lastTouch: "۲ هفته پیش", createdAt: "۱۸ روز پیش" },
];

export const seedDiscoveryLeads: SeedDiscoveryLead[] = [
  { id: "D-221", business: "رستوران عمارت", owner: "پیمان صادقی", category: "رستوران", city: "تهران", score: 96, stage: "lead", source: "Google Maps", need: "تابلو ورودی دیده نمی‌شود", phone: "0912•••7741", budget: "۷۰–۱۰۰ م تومان", lastTouch: "کشف شده ۲ ساعت پیش", createdAt: "امروز", signal: "افتتاح شعبه جدید", reason: "سایت دارد اما تابلو قدیمی و کم‌نور است", website: true, signage: true },
  { id: "D-218", business: "مزون ماهورا", owner: "مهسا کریمی", category: "پوشاک", city: "کرج", score: 91, stage: "lead", source: "اینستاگرام", need: "برندینگ سردر و ویترین", phone: "0935•••0921", budget: "۳۵–۶۰ م تومان", lastTouch: "کشف شده ۴ ساعت پیش", createdAt: "امروز", signal: "رشد سریع صفحه", reason: "فالوئر زیاد، بدون حضور محیطی قابل‌تشخیص", website: false, signage: false },
  { id: "D-214", business: "مطب دندانپزشکی سپید", owner: "دکتر مرادی", category: "پزشکی", city: "تهران", score: 86, stage: "lead", source: "Google Maps", need: "تابلو حروف برجسته", phone: "0910•••4458", budget: "۲۵–۴۵ م تومان", lastTouch: "کشف شده دیروز", createdAt: "دیروز", signal: "ریویوهای جدید", reason: "ریویو عالی دارد اما از خیابان پیدا نیست", website: false, signage: false },
  { id: "D-209", business: "باشگاه انرژی پلاس", owner: "وحید احمدی", category: "ورزشی", city: "کرج", score: 82, stage: "lead", source: "کتاب اول", need: "تابلو LED + نورپردازی", phone: "0902•••1377", budget: "۴۰–۷۰ م تومان", lastTouch: "کشف شده دیروز", createdAt: "دیروز", signal: "تغییر لوکیشن", reason: "جابجایی اخیر و نیاز به دیده‌شدن سریع", website: false, signage: true },
  { id: "D-205", business: "گالری چوبینه", owner: "رضا موسوی", category: "دکوراسیون", city: "تهران", score: 76, stage: "lead", source: "دیوار", need: "تابلو چلنیوم", phone: "0936•••3108", budget: "۳۰–۵۵ م تومان", lastTouch: "کشف شده ۲ روز پیش", createdAt: "۲ روز پیش", signal: "آگهی استخدام", reason: "در حال توسعه کسب‌وکار و آماده بازطراحی برند", website: false, signage: false },
];

export const seedCampaigns: SeedCampaign[] = [
  { id: "C-08", name: "کافه‌ها | تهران | پاییز", channel: "whatsapp", audience: "۳۴ لید گرم", status: "active", sent: 26, replies: 9, conversion: "۱۸٪", copy: "سلام {{owner}} جان، برای دیده‌شدن کافه‌تون یک پیشنهاد کوتاه داریم…" },
  { id: "C-07", name: "کلینیک‌ها | کرج", channel: "sms", audience: "۵۸ لید واجد شرایط", status: "scheduled", sent: 0, replies: 0, conversion: "—", copy: "{{business}} عزیز، تابلو فقط اسم نیست؛ اولین دلیل ورود مشتریه…" },
  { id: "C-06", name: "پیگیری پیشنهادهای باز", channel: "sms", audience: "۱۲ فرصت فروش", status: "completed", sent: 12, replies: 4, conversion: "۲۵٪", copy: "سلام، برای برآورد {{business}} هنوز در خدمتیم؛ مشاوره و بازدید اولیه رایگانه." },
];

export const seedTasks: SeedTask[] = [
  { id: "T-1", title: "پیگیری پیشنهاد کافه دارک", meta: "امروز · ۱۰:۴۲", urgent: true },
  { id: "T-2", title: "ارسال نمونه‌کار برای کلینیک نادری", meta: "امروز · ۱۳:۰۰", urgent: false },
  { id: "T-3", title: "تماس با مزون ماهورا", meta: "فردا · ۰۹:۳۰", urgent: false },
];
