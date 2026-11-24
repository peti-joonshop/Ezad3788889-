import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUpLeft,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  Database,
  Clock3,
  FileBarChart,
  Filter,
  Gauge,
  KanbanSquare,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Loader2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Radar,
  Search,
  Send,
  ShieldCheck,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_NAME } from "@shared/const";

const fallbackLeads = [
  { id: "L-1042", business: "کافه دارک", owner: "آرمان رضایی", category: "کافه و رستوران", city: "تهران", score: 92, stage: "qualified", source: "Google Maps", need: "تابلو چلنیوم + لایت‌باکس", phone: "0912•••4812", budget: "۴۵–۷۰ م تومان", lastTouch: "امروز، ۱۰:۴۲", createdAt: "۲ روز پیش" },
  { id: "L-1038", business: "کلینیک دکتر نادری", owner: "دکتر نادری", category: "پزشکی", city: "کرج", score: 87, stage: "proposal", source: "اینستاگرام", need: "تابلو حروف برجسته", phone: "0935•••1209", budget: "۳۰–۵۰ م تومان", lastTouch: "دیروز، ۱۶:۲۰", createdAt: "۳ روز پیش" },
  { id: "L-1031", business: "بوتیک هرمس", owner: "نگین کریمی", category: "پوشاک", city: "تهران", score: 78, stage: "lead", source: "کشف هوشمند", need: "نئون و نورپردازی ویترین", phone: "0910•••7731", budget: "۲۰–۳۵ م تومان", lastTouch: "بدون پیگیری", createdAt: "امروز" },
  { id: "L-1027", business: "فروشگاه آریا", owner: "میلاد احمدی", category: "لوازم خانگی", city: "کرج", score: 74, stage: "negotiation", source: "معرفی مشتری", need: "تابلو LED متحرک", phone: "0902•••8450", budget: "۵۰–۸۰ م تومان", lastTouch: "شنبه، ۱۱:۰۵", createdAt: "۵ روز پیش" },
  { id: "L-1021", business: "آموزشگاه زبان پُل", owner: "سارا موسوی", category: "آموزشی", city: "تهران", score: 69, stage: "won", source: "وب‌سایت", need: "تابلو سردر + سایت", phone: "0919•••0045", budget: "۶۰–۹۰ م تومان", lastTouch: "هفته پیش", createdAt: "۱۱ روز پیش" },
];

const fallbackDiscovery = [
  { id: "D-221", business: "رستوران عمارت", owner: "پیمان صادقی", category: "رستوران", city: "تهران", score: 96, stage: "lead", source: "Google Maps", need: "تابلو ورودی دیده نمی‌شود", phone: "0912•••7741", budget: "۷۰–۱۰۰ م تومان", lastTouch: "کشف شده ۲ ساعت پیش", createdAt: "امروز", signal: "افتتاح شعبه جدید", reason: "سایت دارد اما تابلو قدیمی و کم‌نور است", website: true, signage: true },
  { id: "D-218", business: "مزون ماهورا", owner: "مهسا کریمی", category: "پوشاک", city: "کرج", score: 91, stage: "lead", source: "اینستاگرام", need: "برندینگ سردر و ویترین", phone: "0935•••0921", budget: "۳۵–۶۰ م تومان", lastTouch: "کشف شده ۴ ساعت پیش", createdAt: "امروز", signal: "رشد سریع صفحه", reason: "فالوئر زیاد، بدون حضور محیطی قابل‌تشخیص", website: false, signage: false },
  { id: "D-214", business: "مطب دندانپزشکی سپید", owner: "دکتر مرادی", category: "پزشکی", city: "تهران", score: 86, stage: "lead", source: "Google Maps", need: "تابلو حروف برجسته", phone: "0910•••4458", budget: "۲۵–۴۵ م تومان", lastTouch: "کشف شده دیروز", createdAt: "دیروز", signal: "ریویوهای جدید", reason: "ریویو عالی دارد اما از خیابان پیدا نیست", website: false, signage: false },
  { id: "D-209", business: "باشگاه انرژی پلاس", owner: "وحید احمدی", category: "ورزشی", city: "کرج", score: 82, stage: "lead", source: "کتاب اول", need: "تابلو LED + نورپردازی", phone: "0902•••1377", budget: "۴۰–۷۰ م تومان", lastTouch: "کشف شده دیروز", createdAt: "دیروز", signal: "تغییر لوکیشن", reason: "جابجایی اخیر و نیاز به دیده‌شدن سریع", website: false, signage: true },
];

const stageLabel: Record<string, string> = { lead: "لید جدید", qualified: "واجد شرایط", proposal: "پیشنهاد قیمت", negotiation: "مذاکره", won: "برنده", lost: "از دست‌رفته" };
const stageTone: Record<string, string> = { lead: "gold", qualified: "purple", proposal: "pink", negotiation: "blue", won: "green", lost: "muted" };
type ChatMessage = { role: "user" | "assistant"; content: string };
type LeadForm = { business: string; owner: string; category: string; city: string; score: string; need: string; phone: string; budget: string };
type CampaignForm = { name: string; channel: "sms" | "whatsapp" | "telegram" | "instagram"; audience: string; copy: string };

const emptyLeadForm: LeadForm = { business: "", owner: "", category: "", city: "تهران", score: "50", need: "", phone: "", budget: "" };
const emptyCampaignForm: CampaignForm = { name: "", channel: "sms", audience: "", copy: "" };
const initialAssistantMessage: ChatMessage = { role: "assistant", content: `سلام بهمن! من دستیار فروش ${APP_NAME} هستم. امروز می‌خوای روی کدوم لید یا کمپین کار کنیم؟ می‌تونم جواب مشتری رو آماده کنم، لیدها رو اولویت‌بندی کنم یا متن پیگیری بسازم.` };

const navItems = [
  { key: "dashboard", label: "نمای کلی", icon: LayoutDashboard, path: "/" },
  { key: "crm", label: "CRM فروش", icon: KanbanSquare, path: "/crm", badge: "۳۸" },
  { key: "leads", label: "کشف لید", icon: Radar, path: "/leads", badge: "۱۲" },
  { key: "outreach", label: "کمپین‌ها", icon: Send, path: "/outreach" },
  { key: "assistant", label: "دستیار هوشمند", icon: Bot, path: "/assistant", accent: true },
];

const formatNumber = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-mark"><Sparkles size={18} strokeWidth={2.5} /></div>
      <div>
        <div className="text-[11px] font-black leading-tight tracking-tight text-white sm:text-[13px]">{APP_NAME}</div>
        <div className="mt-0.5 text-[10px] font-medium text-[#a8a1b8]">رازِ دیده‌شدن</div>
      </div>
    </div>
  );
}

function Sidebar({ view, navigate }: { view: string; navigate: (path: string) => void }) {
  return (
    <aside className="hidden w-[248px] shrink-0 border-l border-white/[0.07] bg-[#0b0a11] px-4 py-5 lg:flex lg:flex-col">
      <div className="mb-9 px-3"><Logo /></div>
      <div className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-[#746b83]">مدیریت فروش</div>
      <nav className="space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = view === item.key;
          return (
            <button key={item.key} onClick={() => navigate(item.path)} className={`nav-item ${active ? "nav-item-active" : ""} ${item.accent ? "nav-item-accent" : ""}`}>
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge && <span className={`mr-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/15 text-white" : "bg-white/[0.06] text-[#9e94ac]"}`}>{item.badge}</span>}
            </button>
          );
        })}
      </nav>
      <div className="my-7 h-px bg-white/[0.06]" />
      <div className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-[#746b83]">ابزارها</div>
      <nav className="space-y-1">
        <button onClick={() => navigate("/reports")} className={`nav-item ${view === "reports" ? "nav-item-active" : ""}`}><BarChart3 size={18} /><span>گزارش‌ها</span></button>
        <button onClick={() => navigate("/settings")} className={`nav-item ${view === "settings" ? "nav-item-active" : ""}`}><Settings2 size={18} /><span>تنظیمات</span></button>
      </nav>
      <div className="mt-auto rounded-2xl border border-[#8d55ff]/20 bg-gradient-to-br from-[#21143c] to-[#120e1d] p-4">
        <div className="mb-3 flex items-center gap-2 text-[#d9bcff]"><Zap size={16} /><span className="text-xs font-bold">نسخه حرفه‌ای</span></div>
        <p className="text-[11px] leading-6 text-[#b8a9c9]">هوش فروش فعال است و هر روز لیدهای تازه را برایت پیدا می‌کند.</p>
        <button onClick={() => navigate("/reports")} className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#e8bf55]">مشاهده گزارش مصرف <ArrowLeft size={13} /></button>
      </div>
    </aside>
  );
}

function MobileNav({ view, navigate }: { view: string; navigate: (path: string) => void }) {
  return <div className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl border border-white/[0.1] bg-[#17141f]/95 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
    {navItems.slice(0, 5).map(item => { const Icon = item.icon; return <button key={item.key} onClick={() => navigate(item.path)} className={`mobile-nav-item ${view === item.key ? "mobile-nav-active" : ""}`}><Icon size={18} /><span>{item.label.split(" ")[0]}</span></button>; })}
  </div>;
}

function NotificationsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const notifications = trpc.notifications.list.useQuery(undefined, { enabled: open });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => notifications.refetch() });
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent dir="rtl" className="border-white/[0.1] bg-[#15111f] text-white">
      <DialogHeader><DialogTitle className="text-white">اعلان‌ها</DialogTitle><DialogDescription className="text-[#8f8499]">آخرین رویدادهای واقعی workspace تو</DialogDescription></DialogHeader>
      <div className="max-h-[360px] space-y-2 overflow-y-auto">
        {notifications.isLoading ? <div className="flex items-center gap-2 py-8 text-xs text-[#a79cad]"><Loader2 size={15} className="animate-spin" />در حال دریافت اعلان‌ها...</div> : notifications.data?.items.length ? notifications.data.items.map(item => <div key={item.id} className={`rounded-xl border p-3 ${item.read ? "border-white/[0.06] bg-white/[0.02]" : "border-[#8d55ff]/25 bg-[#8d55ff]/[0.08]"}`}><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold text-[#f4eff7]">{item.title}</div><div className="mt-1 text-[11px] leading-6 text-[#a79cad]">{item.detail}</div></div>{!item.read && <span className="mt-1 size-2 rounded-full bg-[#d95cff]" />}</div><div className="mt-2 text-[9px] text-[#746b83]">{new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}</div></div>) : <div className="py-8 text-center text-xs text-[#8f8499]">هنوز رویدادی ثبت نشده است.</div>}
      </div>
      <DialogFooter><Button variant="ghost" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending || !notifications.data?.unreadCount} className="text-xs text-[#cbb5e6] hover:bg-white/[0.06]">همه را خوانده‌شده کن</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function Topbar({ view, navigate }: { view: string; navigate: (path: string) => void }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = trpc.notifications.list.useQuery();
  const current = [...navItems, { key: "reports", label: "گزارش‌ها" }, { key: "settings", label: "تنظیمات" }].find(item => item.key === view);
  return <header className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-5 sm:px-8">
    <div className="flex items-center gap-3 lg:hidden"><Logo /></div>
    <div className="hidden lg:block"><div className="text-sm font-bold text-white">{current?.label ?? "نمای کلی"}</div><div className="mt-1 text-[11px] text-[#898096]">شنبه، ۲ آذر ۱۴۰۴ · روزت پُر از معامله</div></div>
    <div className="flex items-center gap-2 sm:gap-4">
      <button onClick={() => navigate("/assistant")} aria-label="راهنمای هوشمند" className="icon-button"><CircleHelp size={18} /></button>
      <button onClick={() => setNotificationsOpen(true)} aria-label="اعلان‌ها" className="icon-button relative"><Bell size={18} />{Boolean(notifications.data?.unreadCount) && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#d95cff]" />}</button>
      <div className="mx-1 hidden h-7 w-px bg-white/[0.1] sm:block" />
      <button onClick={() => navigate("/assistant")} className="flex items-center gap-2 rounded-xl border border-[#8d55ff]/30 bg-[#8d55ff]/10 px-2.5 py-2 text-xs font-bold text-[#d4bcff] transition hover:bg-[#8d55ff]/20 sm:px-3"><Bot size={16} /><span className="hidden sm:inline">کمک از هوش فروش</span></button>
      <button onClick={() => navigate("/settings")} aria-label="تنظیمات حساب" className="avatar">ب</button>
    </div>
    <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
  </header>;
}

function Score({ score }: { score: number }) {
  return <span className={`score score-${score >= 85 ? "high" : score >= 70 ? "mid" : "low"}`}><span className="size-1.5 rounded-full bg-current" />{formatNumber(score)}</span>;
}

function Dashboard({ navigate }: { navigate: (path: string) => void }) {
  const summary = trpc.crm.summary.useQuery(undefined, { staleTime: 60_000 });
  const leadsQuery = trpc.crm.leads.useQuery({ search: "" });
  const completeTask = trpc.tasks.complete.useMutation({ onSuccess: result => { if (result.success) { toast.success("کار انجام‌شده ثبت شد"); summary.refetch(); } else toast.error(result.message); }, onError: () => toast.error("ثبت انجام کار ممکن نشد") });
  const data = summary.data;
  const leads = leadsQuery.data ?? fallbackLeads;
  const kpis = data?.kpis ?? { newLeads: 124, activeOpportunities: 38, conversionRate: 18.6, forecast: "۴۸۰ م" };
  const pipeline = data?.pipeline ?? [
    { key: "lead", label: "لید جدید", count: 22, value: "۱۴۲ م", tone: "gold" }, { key: "qualified", label: "واجد شرایط", count: 10, value: "۱۱۰ م", tone: "purple" }, { key: "proposal", label: "پیشنهاد قیمت", count: 6, value: "۹۴ م", tone: "pink" }, { key: "negotiation", label: "مذاکره", count: 4, value: "۷۸ م", tone: "blue" }, { key: "won", label: "برنده", count: 2, value: "۵۶ م", tone: "green" },
  ];
  return <>
    <div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> داشبورد هوشمند فروش</div><h1>سلام بهمن، <span className="gradient-text">آماده‌ای بدرخشی؟</span></h1><p>اینجا همه‌چیز برای تبدیل یک دیده‌شدن به یک فروش آماده‌ست.</p></div><Button onClick={() => navigate("/leads")} className="gold-button hidden sm:inline-flex"><Radar size={17} />کشف لید جدید</Button></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard icon={Users} label="لیدهای جدید" value={formatNumber(kpis.newLeads)} change="+۲۴٪" hint="نسبت به ماه قبل" tone="gold" />
      <KpiCard icon={Target} label="فرصت‌های فعال" value={formatNumber(kpis.activeOpportunities)} change="+۱۲٪" hint="در قیف فروش" tone="purple" />
      <KpiCard icon={TrendingUp} label="نرخ تبدیل" value={`${kpis.conversionRate}%`} change="+۳.۲٪" hint="از لید تا قرارداد" tone="pink" />
      <KpiCard icon={Gauge} label="پیش‌بینی درآمد" value={kpis.forecast} change="+۱۸٪" hint="تا پایان این ماه" tone="green" />
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_0.9fr]">
      <section className="panel min-w-0"><div className="section-head"><div><h2>قیف فروش</h2><p>ارزش فرصت‌ها در هر مرحله</p></div><button onClick={() => navigate("/crm")} className="text-xs font-bold text-[#e8bf55]">مشاهده CRM <ArrowLeft className="mr-1 inline" size={13} /></button></div><div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">{pipeline.map(item => <div key={item.key} className={`pipeline-column tone-${item.tone}`}><div className="mb-3 flex items-center justify-between"><span className="pipeline-dot" /><span className="text-[11px] text-[#9a90a5]">{item.label}</span></div><div className="text-xl font-black text-white">{formatNumber(item.count)}</div><div className="mt-1 text-[11px] text-[#8b8297]">{item.value}</div><div className="pipeline-line" /></div>)}</div><div className="mt-8 flex items-end gap-2 border-t border-white/[0.06] pt-5"><div className="flex-1"><div className="mb-2 flex items-center justify-between text-[11px] text-[#8c8396]"><span>روند درآمد ۱۲ ماهه</span><span className="text-[#62d6a7]">رشد پایدار</span></div><div className="flex h-24 items-end gap-1.5 sm:gap-3">{(data?.chart ?? [48, 62, 54, 78, 66, 91, 84, 96, 75, 88, 94, 100]).map((height, index) => <div key={index} className="chart-bar" style={{ height: `${height}%`, opacity: 0.35 + index / 20 }} />)}</div><div className="mt-2 flex justify-between text-[9px] text-[#6f687a]"><span>دی</span><span>اسفند</span><span>اردیبهشت</span><span>تیر</span><span>مهر</span><span>آذر</span></div></div><div className="hidden rounded-xl bg-white/[0.035] px-4 py-3 text-left sm:block"><div className="text-[10px] text-[#83798f]">ارزش کل قیف</div><div className="mt-1 text-lg font-black text-white">۴۸۰ <span className="text-xs font-medium text-[#9c91a5]">م تومان</span></div><div className="mt-1 flex items-center gap-1 text-[10px] text-[#62d6a7]"><ArrowUpLeft size={12} /> ۱۸.۴٪</div></div></div></section>
      <section className="panel"><div className="section-head"><div><h2>هوش فروش می‌گوید</h2><p>۳ پیشنهاد برای امروز</p></div><div className="ai-orb"><WandSparkles size={17} /></div></div><div className="mt-5 space-y-3"><Insight icon={Sparkles} title="۲ لید داغ آماده تماس‌اند" text="رستوران عمارت و مزون ماهورا امتیاز بالای ۹۰ دارند." action="مشاهده لیدها" onClick={() => navigate("/leads")} tone="purple" /><Insight icon={MessageCircle} title="پیگیری امروز را از دست نده" text="پیشنهاد کافه دارک ۲۴ ساعت بدون پاسخ مانده." action="باز کردن CRM" onClick={() => navigate("/crm")} tone="gold" /><Insight icon={Lightbulb} title="بهترین ساعت ارسال" text="امروز ساعت ۱۸:۳۰ برای صنف کافه بیشترین پاسخ را دارد." action="ساخت کمپین" onClick={() => navigate("/outreach")} tone="pink" /></div></section>
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="panel"><div className="section-head"><div><h2>آخرین لیدهای داغ</h2><p>بر اساس امتیاز هوشمند</p></div><button onClick={() => navigate("/crm")} className="icon-button"><MoreHorizontal size={18} /></button></div><div className="mt-4 overflow-x-auto"><table className="data-table"><thead><tr><th>کسب‌وکار</th><th>صنف</th><th>امتیاز</th><th>مرحله</th><th>آخرین تماس</th></tr></thead><tbody>{leads.slice(0, 4).map(lead => <tr key={lead.id}><td><div className="flex items-center gap-3"><div className="business-avatar">{lead.business.slice(0, 1)}</div><div><div className="font-bold text-[#f4f0f7]">{lead.business}</div><div className="mt-0.5 text-[10px] text-[#837a91]">{lead.owner} · {lead.city}</div></div></div></td><td>{lead.category}</td><td><Score score={lead.score} /></td><td><span className={`stage-badge stage-${stageTone[lead.stage]}`}>{stageLabel[lead.stage]}</span></td><td className="whitespace-nowrap">{lead.lastTouch}</td></tr>)}</tbody></table></div></section>
      <section className="panel"><div className="section-head"><div><h2>کارهای امروز</h2><p>پیگیری‌هایت را سبک کن</p></div><Clock3 size={18} className="text-[#8d55ff]" /></div><div className="mt-4 space-y-2">{(data?.tasks ?? [{ id: "1", title: "پیگیری پیشنهاد کافه دارک", meta: "امروز · ۱۰:۴۲", urgent: true }, { id: "2", title: "ارسال نمونه‌کار برای کلینیک نادری", meta: "امروز · ۱۳:۰۰", urgent: false }, { id: "3", title: "تماس با مزون ماهورا", meta: "فردا · ۰۹:۳۰", urgent: false }]).map(task => <div key={task.id} className="task-row"><button onClick={() => completeTask.mutate({ id: task.id })} disabled={completeTask.isPending} aria-label="تکمیل کار" className={`task-check ${task.urgent ? "task-check-urgent" : ""}`}><Check size={13} /></button><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-[#eee9f2]">{task.title}</div><div className="mt-1 text-[10px] text-[#847b90]">{task.meta}</div></div><ArrowLeft size={14} className="text-[#625a6d]" /></div>)}</div><button onClick={() => navigate("/crm")} className="mt-4 w-full rounded-xl border border-white/[0.08] py-2.5 text-xs font-bold text-[#b3a8bb] transition hover:bg-white/[0.04]">مشاهده همه پیگیری‌ها</button></section>
    </div>
  </>;
}

function KpiCard({ icon: Icon, label, value, change, hint, tone }: { icon: typeof Users; label: string; value: string; change: string; hint: string; tone: string }) {
  return <div className="kpi-card"><div className={`kpi-icon kpi-${tone}`}><Icon size={18} /></div><div className="mt-5 text-[11px] text-[#91869d]">{label}</div><div className="mt-1 flex items-end gap-2"><span className="text-[25px] font-black tracking-tight text-white">{value}</span><span className="mb-1 rounded-md bg-[#62d6a7]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#62d6a7]">{change}</span></div><div className="mt-1 text-[10px] text-[#756c80]">{hint}</div></div>;
}

function Insight({ icon: Icon, title, text, action, onClick, tone }: { icon: typeof Sparkles; title: string; text: string; action: string; onClick: () => void; tone: string }) {
  return <div className="insight-row"><div className={`insight-icon insight-${tone}`}><Icon size={15} /></div><div className="min-w-0 flex-1"><div className="text-xs font-bold text-[#ede7f1]">{title}</div><p className="mt-1 text-[10px] leading-5 text-[#8f8499]">{text}</p><button onClick={onClick} className="mt-1 text-[10px] font-bold text-[#cdb2ff]">{action} <ArrowLeft className="mr-0.5 inline" size={11} /></button></div></div>;
}

function CRMView() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [manualLeadOpen, setManualLeadOpen] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadForm>(emptyLeadForm);
  const leadsQuery = trpc.crm.leads.useQuery({ search, stage });
  const updateStage = trpc.crm.updateStage.useMutation({ onSuccess: result => { if (result.success) { toast.success(`مرحله لید به «${result.label}» تغییر کرد`); leadsQuery.refetch(); } }, onError: () => toast.error("تغییر مرحله انجام نشد") });
  const createLead = trpc.crm.createLead.useMutation({ onSuccess: () => { toast.success("لید جدید در CRM ذخیره شد"); setManualLeadOpen(false); setLeadForm(emptyLeadForm); leadsQuery.refetch(); }, onError: error => toast.error(error.message || "ثبت لید انجام نشد") });
  const leads = leadsQuery.data ?? fallbackLeads;
  const stages = ["lead", "qualified", "proposal", "negotiation", "won"];
  return <><PageTitle eyebrow="مدیریت رابطه با مشتری" title="CRM فروش" description="هر لید را درست در همان مرحله‌ای ببین که باید باشد." action={<Button onClick={() => setManualLeadOpen(true)} className="gold-button"><Plus size={17} />ثبت لید دستی</Button>} /><div className="mb-4 flex flex-wrap items-center gap-2"><div className="search-field"><Search size={16} /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="جست‌وجوی کسب‌وکار، نام یا شهر..." /></div><div className="filter-pills">{[{ key: "all", label: "همه" }, { key: "lead", label: "لید جدید" }, { key: "qualified", label: "واجد شرایط" }, { key: "proposal", label: "پیشنهاد قیمت" }, { key: "negotiation", label: "مذاکره" }].map(item => <button key={item.key} onClick={() => setStage(item.key)} className={stage === item.key ? "active" : ""}>{item.label}</button>)}</div></div><div className="panel overflow-hidden"><div className="mb-5 flex items-center justify-between"><div><h2>قیف فروش</h2><p className="mt-1 text-xs text-[#82798e]">برای تغییر مرحله، از منوی هر کارت استفاده کن.</p></div><button onClick={() => setStage("all")} aria-label="پاک‌کردن فیلتر مرحله" className="icon-button"><Filter size={16} /></button></div><div className="grid gap-3 xl:grid-cols-5">{stages.map(stageKey => <div key={stageKey} className="crm-column"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><span className={`pipeline-dot dot-${stageTone[stageKey]}`} /><span className="text-xs font-bold text-[#d8d0de]">{stageLabel[stageKey]}</span></div><span className="count-pill">{leads.filter(lead => lead.stage === stageKey).length}</span></div><div className="space-y-2">{leads.filter(lead => lead.stage === stageKey).map(lead => <div key={lead.id} className="crm-card"><div className="flex items-start justify-between gap-2"><div><div className="text-xs font-bold text-white">{lead.business}</div><div className="mt-1 text-[10px] text-[#847b91]">{lead.owner} · {lead.city}</div></div><Score score={lead.score} /></div><div className="mt-3 rounded-lg bg-white/[0.035] px-2.5 py-2 text-[10px] leading-5 text-[#aaa0b3]">{lead.need}</div><div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-[#70687a]">{lead.budget}</span><select aria-label="تغییر مرحله" value={lead.stage} onChange={event => updateStage.mutate({ id: lead.id, stage: event.target.value as "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost" })} className="stage-select"><option value="lead">لید جدید</option><option value="qualified">واجد شرایط</option><option value="proposal">پیشنهاد قیمت</option><option value="negotiation">مذاکره</option><option value="won">برنده</option><option value="lost">از دست‌رفته</option></select></div></div>)}</div></div>)}</div></div><ManualLeadDialog open={manualLeadOpen} onOpenChange={setManualLeadOpen} form={leadForm} setForm={setLeadForm} onSubmit={() => createLead.mutate({ ...leadForm, score: Number(leadForm.score) || 50, stage: "lead", source: "ثبت دستی" })} isPending={createLead.isPending} /></>;
}

function ManualLeadDialog({ open, onOpenChange, form, setForm, onSubmit, isPending }: { open: boolean; onOpenChange: (open: boolean) => void; form: LeadForm; setForm: (form: LeadForm) => void; onSubmit: () => void; isPending: boolean }) {
  const update = (key: keyof LeadForm, value: string) => setForm({ ...form, [key]: value });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent dir="rtl" className="border-white/[0.1] bg-[#15111f] text-white"><DialogHeader><DialogTitle className="text-white">ثبت لید دستی</DialogTitle><DialogDescription className="text-[#8f8499]">اطلاعات پایه را وارد کن تا لید در workspace ذخیره شود.</DialogDescription></DialogHeader><form onSubmit={event => { event.preventDefault(); onSubmit(); }} className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-[11px] text-[#a79cad]">نام کسب‌وکار<Input required value={form.business} onChange={event => update("business", event.target.value)} placeholder="مثلاً کافه دارک" /></label><label className="space-y-1 text-[11px] text-[#a79cad]">نام مالک / تماس<Input required value={form.owner} onChange={event => update("owner", event.target.value)} placeholder="نام صاحب کسب‌وکار" /></label><label className="space-y-1 text-[11px] text-[#a79cad]">صنف<Input required value={form.category} onChange={event => update("category", event.target.value)} placeholder="رستوران، پزشکی..." /></label><label className="space-y-1 text-[11px] text-[#a79cad]">شهر<select required value={form.city} onChange={event => update("city", event.target.value)} className="dark-select mt-1 h-9 w-full max-w-none"><option>تهران</option><option>کرج</option><option>سایر</option></select></label><label className="space-y-1 text-[11px] text-[#a79cad]">امتیاز<Input required type="number" min="0" max="100" value={form.score} onChange={event => update("score", event.target.value)} /></label><label className="space-y-1 text-[11px] text-[#a79cad]">شماره تماس<Input required value={form.phone} onChange={event => update("phone", event.target.value)} placeholder="۰۹۱۲..." /></label></div><label className="block space-y-1 text-[11px] text-[#a79cad]">نیاز اصلی<Input required value={form.need} onChange={event => update("need", event.target.value)} placeholder="نوع تابلو یا خدمت موردنیاز" /></label><label className="block space-y-1 text-[11px] text-[#a79cad]">بودجه تقریبی<Input required value={form.budget} onChange={event => update("budget", event.target.value)} placeholder="مثلاً ۳۰–۵۰ م تومان" /></label><DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-xs text-[#cbb5e6] hover:bg-white/[0.06]">انصراف</Button><Button type="submit" disabled={isPending} className="gold-button">{isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}ذخیره در CRM</Button></DialogFooter></form></DialogContent></Dialog>;
}

function LeadsView() {
  const [city, setCity] = useState("همه شهرها");
  const [category, setCategory] = useState("همه صنف‌ها");
  const [added, setAdded] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<(typeof fallbackDiscovery)[number] | null>(null);
  const discoveryQuery = trpc.discovery.leads.useQuery({ city, category, minScore: 70 });
  const addToCrm = trpc.discovery.addToCrm.useMutation({ onSuccess: result => { if (result.success) toast.success(result.message); else toast.error(result.message); }, onError: () => toast.error("افزودن لید انجام نشد") });
  const leads = discoveryQuery.data ?? fallbackDiscovery;
  return <><PageTitle eyebrow="موتور کشف هوشمند" title="لیدهایی که هنوز پیدایشان نکرده‌ای" description="سیگنال‌های بازار تهران و کرج را بررسی کن و قبل از رقبا وارد شو." action={<Button onClick={() => { discoveryQuery.refetch(); toast.success("نتایج کشف از API به‌روز شد"); }} disabled={discoveryQuery.isFetching} className="purple-button">{discoveryQuery.isFetching ? <Loader2 size={17} className="animate-spin" /> : <Radar size={17} />}اسکن دوباره بازار</Button>} /><div className="grid gap-3 sm:grid-cols-3"><div className="mini-stat"><div className="mini-stat-icon purple"><Radar size={16} /></div><div><div className="text-[10px] text-[#8c8297]">لید کشف‌شده امروز</div><div className="mt-1 text-lg font-black text-white">۱۲ <span className="text-[10px] font-medium text-[#62d6a7]">+۴ جدید</span></div></div></div><div className="mini-stat"><div className="mini-stat-icon gold"><Target size={16} /></div><div><div className="text-[10px] text-[#8c8297]">میانگین امتیاز</div><div className="mt-1 text-lg font-black text-white">۸۶.۴ <span className="text-[10px] font-medium text-[#e8bf55]">از ۱۰۰</span></div></div></div><div className="mini-stat"><div className="mini-stat-icon pink"><TrendingUp size={16} /></div><div><div className="text-[10px] text-[#8c8297]">ارزش تخمینی فرصت‌ها</div><div className="mt-1 text-lg font-black text-white">۲۴۰ <span className="text-[10px] font-medium text-[#8c8297]">م تومان</span></div></div></div></div><div className="mt-4 panel"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4"><div><h2>نتایج هوش فروش</h2><p className="mt-1 text-xs text-[#82798e]">بر اساس نیاز به تابلو، رشد کسب‌وکار و نشانه‌های خرید</p></div><div className="flex gap-2"><select value={city} onChange={event => setCity(event.target.value)} className="dark-select"><option>همه شهرها</option><option>تهران</option><option>کرج</option></select><select value={category} onChange={event => setCategory(event.target.value)} className="dark-select"><option>همه صنف‌ها</option><option>رستوران</option><option>پوشاک</option><option>پزشکی</option><option>ورزشی</option></select></div></div><div className="mt-2 divide-y divide-white/[0.05]">{leads.map(lead => <div key={lead.id} className="lead-discovery-row"><div className="flex min-w-0 items-start gap-3"><div className="business-avatar business-avatar-purple">{lead.business.slice(0, 1)}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-bold text-white">{lead.business}</span><Score score={lead.score} /></div><div className="mt-1 text-[10px] text-[#847b91]">{lead.owner} · {lead.category} · {lead.city}</div><div className="mt-2 flex flex-wrap gap-1.5"><span className="signal-chip"><Sparkles size={11} />{lead.signal}</span><span className="text-[10px] text-[#9a90a2]">{lead.reason}</span></div></div></div><div className="hidden text-right md:block"><div className="text-[11px] font-bold text-[#d7cedc]">{lead.need}</div><div className="mt-1 text-[10px] text-[#7f758b]">بودجه احتمالی: {lead.budget}</div></div><div className="flex items-center gap-2"><button onClick={() => { setAdded(items => [...items, lead.id]); addToCrm.mutate({ id: lead.id }); }} disabled={added.includes(lead.id)} className={`add-lead-button ${added.includes(lead.id) ? "added" : ""}`}>{added.includes(lead.id) ? <><Check size={14} />در CRM</> : <><Plus size={14} />افزودن</>}</button><button onClick={() => setSelectedLead(lead as (typeof fallbackDiscovery)[number])} aria-label={`جزئیات ${lead.business}`} className="icon-button"><MoreHorizontal size={16} /></button></div></div>)}</div></div><LeadDetailsDialog lead={selectedLead} onClose={() => setSelectedLead(null)} /></>;
}

function LeadDetailsDialog({ lead, onClose }: { lead: (typeof fallbackDiscovery)[number] | null; onClose: () => void }) {
  return <Dialog open={Boolean(lead)} onOpenChange={open => { if (!open) onClose(); }}><DialogContent dir="rtl" className="border-white/[0.1] bg-[#15111f] text-white">{lead && <><DialogHeader><DialogTitle className="text-white">{lead.business}</DialogTitle><DialogDescription className="text-[#8f8499]">جزئیات لید کشف‌شده از منبع {lead.source}</DialogDescription></DialogHeader><div className="grid gap-2 text-xs text-[#b7adbf] sm:grid-cols-2"><div className="rounded-xl bg-white/[0.035] p-3">مالک: <b className="text-white">{lead.owner}</b></div><div className="rounded-xl bg-white/[0.035] p-3">امتیاز: <b className="text-[#62d6a7]">{formatNumber(lead.score)}</b></div><div className="rounded-xl bg-white/[0.035] p-3">شهر و صنف: <b className="text-white">{lead.city} · {lead.category}</b></div><div className="rounded-xl bg-white/[0.035] p-3">تماس: <b className="text-white">{lead.phone}</b></div></div><div className="rounded-xl border border-[#8d55ff]/15 bg-[#8d55ff]/[0.06] p-3 text-xs leading-6 text-[#c7b9d5]"><div className="font-bold text-[#e4d6f0]">سیگنال خرید</div><div className="mt-1">{lead.signal} · {lead.reason}</div></div><DialogFooter><Button onClick={onClose} className="purple-button">بستن</Button></DialogFooter></>}</DialogContent></Dialog>;
}

function OutreachView({ navigate }: { navigate: (path: string) => void }) {
  const [campaignFilter, setCampaignFilter] = useState<"all" | "sms" | "whatsapp">("all");
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(emptyCampaignForm);
  const campaignsQuery = trpc.outreach.campaigns.useQuery();
  const settings = trpc.settings.status.useQuery();
  const launch = trpc.outreach.launch.useMutation({ onSuccess: result => { if (result.success) { toast.success(result.message); campaignsQuery.refetch(); } else toast.error(result.message); }, onError: () => toast.error("فعال‌سازی کمپین انجام نشد") });
  const createCampaign = trpc.outreach.create.useMutation({ onSuccess: () => { toast.success("کمپین جدید ذخیره شد"); setCampaignOpen(false); setCampaignForm(emptyCampaignForm); campaignsQuery.refetch(); }, onError: error => toast.error(error.message || "ساخت کمپین انجام نشد") });
  const campaigns = campaignsQuery.data ?? [{ id: "C-08", name: "کافه‌ها | تهران | پاییز", channel: "whatsapp" as const, audience: "۳۴ لید گرم", status: "active" as const, sent: 26, replies: 9, conversion: "۱۸٪", copy: "سلام {{owner}} جان، برای دیده‌شدن کافه‌تون یک پیشنهاد کوتاه داریم…" }, { id: "C-07", name: "کلینیک‌ها | کرج", channel: "sms" as const, audience: "۵۸ لید واجد شرایط", status: "scheduled" as const, sent: 0, replies: 0, conversion: "—", copy: "{{business}} عزیز، تابلو فقط اسم نیست؛ اولین دلیل ورود مشتریه…" }];
  const filteredCampaigns = campaigns.filter(campaign => campaignFilter === "all" || campaign.channel === campaignFilter);
  const channelLabel: Record<string, string> = { sms: "پیامک", whatsapp: "واتساپ", telegram: "تلگرام", instagram: "اینستاگرام" };
  return <><PageTitle eyebrow="ارتباطات هدفمند" title="کمپین‌ها" description="پیام درست را، در کانال درست و زمان درست بفرست." action={<><Button onClick={() => setCampaignOpen(true)} className="gold-button"><Plus size={17} />ساخت کمپین هوشمند</Button><CampaignDialog open={campaignOpen} onOpenChange={setCampaignOpen} form={campaignForm} setForm={setCampaignForm} onSubmit={() => createCampaign.mutate(campaignForm)} isPending={createCampaign.isPending} /></>} /><div className="outreach-hero"><div className="outreach-hero-orb"><Send size={22} /></div><div className="flex-1"><div className="text-sm font-black text-white">کمپین بعدی را هوش فروش می‌سازد</div><div className="mt-1 text-xs leading-6 text-[#b9aaca]">صنف، شهر و نقطه‌ضعف هر لید را تحلیل می‌کنیم تا پیام شخصی‌تر و کم‌ریسک‌تری بفرستی.</div></div><div className="hidden text-left sm:block"><div className="text-[10px] text-[#9789a5]">نرخ پاسخ میانگین</div><div className="mt-1 text-xl font-black text-[#e8bf55]">۲۳.۸٪</div></div></div><div className="mb-4 mt-5 flex items-center gap-2"><span className="text-xs font-bold text-[#e7e0eb]">همه کمپین‌ها</span><span className="count-pill">{filteredCampaigns.length}</span><button onClick={() => setCampaignFilter(filter => filter === "all" ? "sms" : filter === "sms" ? "whatsapp" : "all")} className="mr-auto flex items-center gap-1 text-[11px] font-bold text-[#94899f]">فیلتر: {campaignFilter === "all" ? "همه" : channelLabel[campaignFilter]} <Filter size={13} /></button></div><div className="grid gap-4 xl:grid-cols-3">{filteredCampaigns.map(campaign => <div key={campaign.id} className="campaign-card"><div className="flex items-start justify-between"><div className={`channel-icon channel-${campaign.channel}`}>{campaign.channel === "whatsapp" ? <MessageCircle size={18} /> : <Send size={18} />}</div><span className={`campaign-status status-${campaign.status}`}>{campaign.status === "active" ? "فعال" : campaign.status === "scheduled" ? "زمان‌بندی‌شده" : "تمام‌شده"}</span></div><div className="mt-4 text-sm font-black text-white">{campaign.name}</div><div className="mt-1 text-[11px] text-[#82798f]">{channelLabel[campaign.channel]} · {campaign.audience}</div><div className="mt-4 rounded-xl bg-white/[0.035] p-3 text-[11px] leading-6 text-[#aaa0b0]">{campaign.copy}</div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4 text-center"><div><div className="text-base font-black text-white">{formatNumber(campaign.sent)}</div><div className="text-[9px] text-[#766d82]">ارسال</div></div><div><div className="text-base font-black text-white">{formatNumber(campaign.replies)}</div><div className="text-[9px] text-[#766d82]">پاسخ</div></div><div><div className="text-base font-black text-[#62d6a7]">{campaign.conversion}</div><div className="text-[9px] text-[#766d82]">تبدیل</div></div></div><button onClick={() => launch.mutate({ campaignId: campaign.id, channel: campaign.channel as "sms" | "whatsapp" | "telegram" | "instagram" })} disabled={launch.isPending} className="mt-4 w-full rounded-xl border border-[#8d55ff]/25 bg-[#8d55ff]/10 py-2.5 text-xs font-bold text-[#d2b9ff] transition hover:bg-[#8d55ff]/20">{campaign.status === "active" ? "مدیریت کمپین" : "فعال‌سازی کمپین"}</button></div>)}</div><div className="mt-5 panel"><div className="section-head"><div><h2>آمادگی اتصال کانال‌ها</h2><p>در این MVP ارسال‌ها در حالت پیش‌نمایش هستند.</p></div><Badge variant="outline" className="border-[#e8bf55]/30 text-[#e8bf55]">نیازمند تنظیمات</Badge></div><div className="mt-4 grid gap-2 sm:grid-cols-3"><Integration label="پیامک" detail="Kavenegar" configured={Boolean(settings.data?.channels.find(channel => channel.key === "sms")?.configured)} onClick={() => navigate("/settings")} /><Integration label="واتساپ" detail="Business API" configured={Boolean(settings.data?.channels.find(channel => channel.key === "whatsapp")?.configured)} onClick={() => navigate("/settings")} /><Integration label="تلگرام" detail="Bot API" configured={Boolean(settings.data?.channels.find(channel => channel.key === "telegram")?.configured)} onClick={() => navigate("/settings")} /></div></div></>;
}

function Integration({ label, detail, configured, onClick }: { label: string; detail: string; configured: boolean; onClick: () => void }) { return <button onClick={onClick} className="integration-row text-right"><div className="flex items-center gap-3"><div className={`integration-dot ${configured ? "!bg-[#62d6a7] !shadow-[0_0_9px_#62d6a7]" : ""}`} /><div><div className="text-xs font-bold text-white">{label}</div><div className="mt-1 text-[10px] text-[#82798e]">{detail}</div></div></div><span className={configured ? "text-[#62d6a7]" : "text-[#8b8192]"}>{configured ? "متصل" : "تنظیم نشده · تنظیمات"}</span></button>; }

function CampaignDialog({ open, onOpenChange, form, setForm, onSubmit, isPending }: { open: boolean; onOpenChange: (open: boolean) => void; form: CampaignForm; setForm: (form: CampaignForm) => void; onSubmit: () => void; isPending: boolean }) {
  const update = (key: keyof CampaignForm, value: string) => setForm({ ...form, [key]: value as CampaignForm[typeof key] });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent dir="rtl" className="border-white/[0.1] bg-[#15111f] text-white"><DialogHeader><DialogTitle className="text-white">ساخت کمپین هوشمند</DialogTitle><DialogDescription className="text-[#8f8499]">کمپین ابتدا به‌صورت زمان‌بندی‌شده در دیتابیس ذخیره می‌شود.</DialogDescription></DialogHeader><form onSubmit={event => { event.preventDefault(); onSubmit(); }} className="space-y-3"><label className="block space-y-1 text-[11px] text-[#a79cad]">نام کمپین<Input required value={form.name} onChange={event => update("name", event.target.value)} placeholder="مثلاً کافه‌ها · تهران" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-[11px] text-[#a79cad]">کانال<select value={form.channel} onChange={event => update("channel", event.target.value)} className="dark-select mt-1 h-9 w-full max-w-none"><option value="sms">پیامک</option><option value="whatsapp">واتساپ</option><option value="telegram">تلگرام</option><option value="instagram">اینستاگرام</option></select></label><label className="space-y-1 text-[11px] text-[#a79cad]">مخاطب<Input required value={form.audience} onChange={event => update("audience", event.target.value)} placeholder="مثلاً ۳۴ لید گرم" /></label></div><label className="block space-y-1 text-[11px] text-[#a79cad]">متن پیام<textarea required value={form.copy} onChange={event => update("copy", event.target.value)} rows={4} className="mt-1 w-full rounded-md border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-xs leading-6 text-white outline-none focus:border-[#8d55ff]" placeholder="متن شخصی‌سازی‌شدهٔ کمپین..." /></label><DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-xs text-[#cbb5e6] hover:bg-white/[0.06]">انصراف</Button><Button type="submit" disabled={isPending} className="gold-button">{isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}ذخیره کمپین</Button></DialogFooter></form></DialogContent></Dialog>;
}

function AssistantView() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistantMessage]);
  const ask = trpc.assistant.ask.useMutation({ onSuccess: result => setMessages(items => [...items, { role: "assistant" as const, content: result.reply }]), onError: () => setMessages(items => [...items, { role: "assistant" as const, content: `فعلاً اتصال هوشمند در دسترس نیست؛ اما می‌تونم با اطلاعات کسب‌وکار ${APP_NAME} راهنمایی اولیه‌ات کنم. قیمت، نمونه‌کار یا متن پیگیری می‌خوای؟` }]) });
  const send = () => { const trimmed = message.trim(); if (!trimmed || ask.isPending) return; setMessages(items => [...items, { role: "user" as const, content: trimmed }]); setMessage(""); ask.mutate({ message: trimmed, history: messages.slice(-10).map(item => ({ role: item.role, content: item.content })) }); };
  const suggestions = ["برای کافه دارک متن پیگیری بساز", "قیمت تقریبی تابلو چلنیوم چقدره؟", "لیدهای داغ امروز رو معرفی کن"];
  return <><PageTitle eyebrow="Manus AI · Sales Copilot" title="دستیار هوشمند فروش" description="یک هم‌تیمی همیشه‌بیدار برای پاسخ‌گویی، پیگیری و بستن معامله." action={<div className="ai-status"><span className="live-dot" /> آنلاین و آماده کمک</div>} /><div className="assistant-layout"><div className="assistant-chat panel"><div className="assistant-chat-head"><div className="flex items-center gap-3"><div className="ai-avatar"><Bot size={20} /></div><div><div className="text-sm font-black text-white">{APP_NAME} · مشاور فروش</div><div className="mt-1 text-[10px] text-[#62d6a7]">متصل به دانش {APP_NAME}</div></div></div><button onClick={() => setMessages([initialAssistantMessage])} aria-label="شروع گفت‌وگوی جدید" className="icon-button"><MoreHorizontal size={18} /></button></div><div className="assistant-messages">{messages.map((item, index) => <div key={index} className={`message-row ${item.role === "user" ? "message-user" : ""}`}><div className={`message-bubble ${item.role === "user" ? "bubble-user" : "bubble-ai"}`}>{item.role === "assistant" && <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold text-[#cdb2ff]"><Sparkles size={12} /> {APP_NAME}</div>}<div className="text-xs leading-7">{item.content}</div><div className="mt-2 text-[9px] text-[#786e82]">همین الان</div></div></div>)}{ask.isPending && <div className="message-row"><div className="message-bubble bubble-ai"><div className="typing"><span /><span /><span /></div></div></div>}</div><div className="suggestion-row">{suggestions.map(item => <button key={item} onClick={() => setMessage(item)}>{item}</button>)}</div><div className="assistant-input"><textarea value={message} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="پیامت رو بنویس... (Enter برای ارسال)" rows={1} /><button onClick={send} disabled={ask.isPending || !message.trim()} className="send-button"><Send size={17} /></button></div></div><div className="assistant-side"><div className="panel"><div className="section-head"><div><h2>کارهایی که بلدم</h2><p>سریع‌تر بفروش، بهتر پیگیری کن</p></div><Zap size={18} className="text-[#e8bf55]" /></div><div className="mt-4 space-y-2"><AssistantCapability icon={MessageCircle} title="پاسخ‌گویی به مشتری" text="قیمت، متریال، زمان اجرا و تفاوت خدمات" /><AssistantCapability icon={WandSparkles} title="ساخت متن فروش" text="پیامک، واتساپ، DM و پیشنهاد قیمت" /><AssistantCapability icon={Radar} title="اولویت‌بندی لید" text="تشخیص نیت خرید و لید داغ" /><AssistantCapability icon={TrendingUp} title="کوچینگ معامله" text="اعتراضات و قدم بعدی مذاکره" /></div></div><div className="panel"><div className="flex items-center gap-2 text-xs font-black text-white"><BriefcaseBusiness size={16} className="text-[#8d55ff]" />دانش کسب‌وکار</div><div className="mt-4 space-y-3 text-[11px] leading-6 text-[#968b9f]"><div className="flex items-start gap-2"><MapPin size={14} className="mt-1 shrink-0 text-[#e8bf55]" />تهران و کرج</div><div className="flex items-start gap-2"><Target size={14} className="mt-1 shrink-0 text-[#d95cff]" />تابلو، سایت و بازاریابی هوشمند</div><div className="flex items-start gap-2"><MessageCircle size={14} className="mt-1 shrink-0 text-[#62d6a7]" />۰۹۳۶۴۴۲۷۲۷۶</div></div></div></div></div></>;
}

function AssistantCapability({ icon: Icon, title, text }: { icon: typeof MessageCircle; title: string; text: string }) { return <div className="capability-row"><div className="capability-icon"><Icon size={15} /></div><div><div className="text-xs font-bold text-[#ece6f0]">{title}</div><div className="mt-1 text-[10px] text-[#847a90]">{text}</div></div></div>; }

function ReportsView() {
  const report = trpc.reports.overview.useQuery();
  const data = report.data;
  const reportStages = data?.byStage ?? [];
  return <><PageTitle eyebrow="تصمیم‌گیری با داده" title="گزارش‌ها" description="تصویر واقعی از عملکرد لیدها، کمپین‌ها و پیگیری‌ها." action={<button onClick={() => report.refetch()} className="icon-button" aria-label="به‌روزرسانی گزارش"><TrendingUp size={17} /></button>} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard icon={Users} label="کل لیدها" value={formatNumber(data?.totalLeads ?? 0)} change="دیتابیس" hint="در workspace فعلی" tone="gold" /><KpiCard icon={Target} label="فرصت‌های فعال" value={formatNumber(data?.activeLeads ?? 0)} change="زنده" hint="بدون برنده یا از دست‌رفته" tone="purple" /><KpiCard icon={TrendingUp} label="نرخ تبدیل" value={`${data?.conversionRate ?? 0}%`} change="واقعی" hint="از لیدهای بسته‌شده" tone="pink" /><KpiCard icon={Send} label="ارسال کمپین" value={formatNumber(data?.totalSent ?? 0)} change={`${formatNumber(data?.totalReplies ?? 0)} پاسخ`} hint={`${formatNumber(data?.campaignCount ?? 0)} کمپین ثبت‌شده`} tone="green" /></div><div className="mt-4 grid gap-4 xl:grid-cols-2"><section className="panel"><div className="section-head"><div><h2>توزیع قیف فروش</h2><p>تعداد رکوردهای واقعی در هر مرحله</p></div><FileBarChart size={18} className="text-[#e8bf55]" /></div><div className="mt-5 space-y-3">{reportStages.map(item => <div key={item.stage} className="flex items-center gap-3"><span className={`pipeline-dot dot-${stageTone[item.stage]}`} /><span className="w-28 text-xs text-[#b1a6b9]">{stageLabel[item.stage]}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-l from-[#8d55ff] to-[#d95cff]" style={{ width: `${data?.totalLeads ? Math.max(5, (item.count / data.totalLeads) * 100) : 5}%` }} /></div><span className="text-xs font-black text-white">{formatNumber(item.count)}</span></div>)}</div></section><section className="panel"><div className="section-head"><div><h2>منابع پربازده</h2><p>منبع لیدها بر اساس دادهٔ CRM</p></div><Radar size={18} className="text-[#8d55ff]" /></div><div className="mt-5 space-y-2">{data?.bySource.length ? data.bySource.map(item => <div key={item.source} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-3"><span className="text-xs text-[#b1a6b9]">{item.source}</span><span className="count-pill">{formatNumber(item.count)} لید</span></div>) : <div className="py-8 text-center text-xs text-[#8f8499]">هنوز داده‌ای برای گزارش ثبت نشده است.</div>}</div></section></div></>;
}

function SettingsView() {
  const auth = useAuth();
  const status = trpc.settings.status.useQuery();
  const integrations = trpc.settings.integrations.useQuery();
  const saveIntegration = trpc.settings.saveIntegration.useMutation({ onSuccess: () => { toast.success("تنظیمات کانال ذخیره شد"); status.refetch(); integrations.refetch(); }, onError: error => toast.error(error.message || "ذخیره تنظیمات انجام نشد") });
  const testIntegration = trpc.settings.testIntegration.useMutation({ onSuccess: result => toast.success(result.message), onError: error => toast.error(error.message || "تست اتصال ناموفق بود") });
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({ sms: { provider: "kavenegar" }, telegram: {}, whatsapp: { apiVersion: "v20.0" } });
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ sms: false, telegram: false, whatsapp: false });
  useEffect(() => {
    if (!integrations.data) return;
    setEnabled(current => Object.fromEntries(integrations.data.map(item => [item.channel, item.enabled])));
    setForms(current => Object.fromEntries(integrations.data.map(item => [item.channel, { ...current[item.channel], ...Object.fromEntries(Object.entries(item.fields).filter(([key]) => !["apiKey", "botToken", "accessToken"].includes(key))) }])));
  }, [integrations.data]);
  const channelMeta = [
    { key: "sms", title: "پیامک", detail: "Kavenegar", fields: [["apiKey", "API Key پنل", "کلید API را وارد کنید", true], ["sender", "شماره فرستنده", "مثلاً ۱۰۰۰xxxx", false], ["testRecipient", "شماره تست", "شماره‌ای که پیام تست دریافت می‌کند", false], ["testMessage", "متن تست", "تست اتصال از ابزار فروش", false]] },
    { key: "telegram", title: "تلگرام", detail: "Bot API", fields: [["botToken", "Bot Token", "توکن دریافتی از BotFather", true], ["chatId", "Chat ID", "برای ارسال پیام تست", false], ["testMessage", "متن تست", "تست اتصال از ابزار فروش", false]] },
    { key: "whatsapp", title: "واتساپ", detail: "WhatsApp Cloud API", fields: [["accessToken", "Access Token", "توکن Meta Business", true], ["phoneNumberId", "Phone Number ID", "شناسه شماره در Meta", false], ["apiVersion", "نسخه Graph API", "v20.0", false]] },
  ] as const;
  const updateForm = (channel: string, key: string, value: string) => setForms(current => ({ ...current, [channel]: { ...current[channel], [key]: value } }));
  const data = status.data;
  return <><PageTitle eyebrow="کنترل workspace" title="تنظیمات" description="هویت حساب، اتصال‌های سرور و وضعیت کانال‌ها را بررسی کن." action={<Button onClick={() => auth.logout()} className="border border-[#d95cff]/25 bg-[#d95cff]/10 text-[#efb7ff] hover:bg-[#d95cff]/20"><LogOut size={15} />خروج از حساب</Button>} /><div className="grid gap-4 xl:grid-cols-2"><section className="panel"><div className="section-head"><div><h2>حساب فعال</h2><p>احراز هویت با Manus OAuth انجام می‌شود.</p></div><ShieldCheck size={18} className="text-[#62d6a7]" /></div><div className="mt-5 space-y-3"><div className="rounded-xl bg-white/[0.035] p-3"><div className="text-[10px] text-[#82798e]">نام</div><div className="mt-1 text-sm font-bold text-white">{data?.user.name || "بدون نام"}</div></div><div className="rounded-xl bg-white/[0.035] p-3"><div className="text-[10px] text-[#82798e]">ایمیل</div><div className="mt-1 text-sm font-bold text-white">{data?.user.email || "ثبت نشده"}</div></div><div className="flex items-center justify-between rounded-xl border border-[#62d6a7]/15 bg-[#62d6a7]/[0.06] p-3 text-xs"><span className="text-[#b8adb9]">روش ورود: {data?.user.loginMethod || "Manus"}</span><span className="text-[#62d6a7]">تأییدشده</span></div></div></section><section className="panel"><div className="section-head"><div><h2>وضعیت سرویس</h2><p>اتصال‌ها از محیط امن سرور خوانده می‌شوند.</p></div><Database size={18} className="text-[#e8bf55]" /></div><div className="mt-5 space-y-2"><div className="integration-row"><div className="flex items-center gap-3"><div className="integration-dot !bg-[#62d6a7] !shadow-[0_0_9px_#62d6a7]" /><span className="text-xs font-bold text-white">دیتابیس مدیریت‌شده</span></div><span className="text-[#62d6a7]">{data?.database ? "متصل" : "بررسی لازم"}</span></div><div className="integration-row"><div className="flex items-center gap-3"><div className="integration-dot !bg-[#62d6a7] !shadow-[0_0_9px_#62d6a7]" /><span className="text-xs font-bold text-white">session و OAuth</span></div><span className="text-[#62d6a7]">{data?.authentication ? "فعال" : "بررسی لازم"}</span></div>{data?.channels.map(channel => <Integration key={channel.key} label={channel.label} detail={channel.detail} configured={channel.configured} onClick={() => toast.info(channel.configured ? "اتصال کانال آماده است؛ ارسال واقعی فقط با policy و opt-in انجام می‌شود." : "برای فعال‌سازی، credential امن این کانال را در تنظیمات پروژه ثبت کن.")} />)}</div></section></div><section className="panel mt-4"><div className="section-head"><div><h2>اتصال کانال‌های پیام‌رسان</h2><p>کلیدها در backend رمزنگاری می‌شوند و فقط مقدار ماسک‌شده نمایش داده می‌شود.</p></div><Badge variant="outline" className="border-[#8d55ff]/30 text-[#cdb2ff]">۳ کانال</Badge></div><div className="mt-5 grid gap-4 xl:grid-cols-3">{channelMeta.map(channel => <div key={channel.key} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="flex items-center justify-between"><div><div className="text-sm font-black text-white">{channel.title}</div><div className="mt-1 text-[10px] text-[#8d8198]">{channel.detail}</div></div><label className="flex items-center gap-2 text-[10px] text-[#b8aeca]"><input type="checkbox" checked={Boolean(enabled[channel.key])} onChange={event => setEnabled(current => ({ ...current, [channel.key]: event.target.checked }))} /> فعال</label></div><div className="mt-4 space-y-2">{channel.fields.map(([key, label, placeholder, secret]) => <label key={key} className="block text-[10px] text-[#a79cad]">{label}<Input type={secret ? "password" : "text"} value={forms[channel.key]?.[key] ?? ""} onChange={event => updateForm(channel.key, key, event.target.value)} placeholder={integrations.data?.find(item => item.channel === channel.key)?.fields[key] && secret ? "برای حفظ مقدار قبلی خالی بگذارید" : placeholder} className="mt-1" /></label>)}</div><div className="mt-4 flex gap-2"><Button type="button" disabled={saveIntegration.isPending} onClick={() => saveIntegration.mutate({ channel: channel.key as "sms" | "telegram" | "whatsapp", enabled: Boolean(enabled[channel.key]), config: forms[channel.key] ?? {} })} className="gold-button flex-1 text-xs">ذخیره</Button><Button type="button" variant="outline" disabled={testIntegration.isPending} onClick={() => testIntegration.mutate({ channel: channel.key as "sms" | "telegram" | "whatsapp" })} className="border-[#8d55ff]/30 text-xs text-[#d5bcff]">تست</Button></div></div>)}</div></section></>;
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) { return <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>; }

export default function Home() {
  const auth = useAuth({ redirectOnUnauthenticated: true });
  const [location, navigate] = useLocation();
  const view = useMemo(() => location === "/crm" ? "crm" : location === "/leads" ? "leads" : location === "/outreach" ? "outreach" : location === "/assistant" ? "assistant" : location === "/reports" ? "reports" : location === "/settings" ? "settings" : "dashboard", [location]);
  if (auth.loading || !auth.user) {
    return <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#08070d] text-[#cdb2ff]"><div className="flex items-center gap-3 rounded-2xl border border-[#8d55ff]/20 bg-[#15111f] px-5 py-4 text-sm font-bold"><Loader2 className="animate-spin" size={18} />در حال بررسی دسترسی {APP_NAME}…</div></div>;
  }
  return <div dir="rtl" className="app-shell"><Sidebar view={view} navigate={navigate} /><div className="app-main"><Topbar view={view} navigate={navigate} /><main className="page-content">{view === "dashboard" && <Dashboard navigate={navigate} />}{view === "crm" && <CRMView />}{view === "leads" && <LeadsView />}{view === "outreach" && <OutreachView navigate={navigate} />}{view === "assistant" && <AssistantView />}{view === "reports" && <ReportsView />}{view === "settings" && <SettingsView />}</main></div><MobileNav view={view} navigate={navigate} /></div>;
}
