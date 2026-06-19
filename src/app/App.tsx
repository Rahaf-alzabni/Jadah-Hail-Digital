import { useState, useEffect } from "react";
import {
  MapPin, Search, Star, Heart, Navigation, Clock, ChevronRight,
  ArrowLeft, Send, User, Bell, Settings, BarChart2, Calendar,
  LogOut, Plus, TrendingUp, Users, Eye, Globe, Share2,
  Home, Map, MessageSquare, Menu, Route, Filter,
  Edit, Trash2, Award, Zap, Shield, ChevronDown, X, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useTourism, TourismProvider } from "@/context/TourismContext";
import { CATEGORY_META, getRoutePlaceImages, pickEvent, pickPlace, pickRoute } from "@/lib/mappers";
import { applyDocumentLocale, fontBody, fontHeading, formatReviews, formatVisitors, t } from "@/lib/locale";
import { AIAssistantSection } from "@/app/components/AIAssistantSection";
import { HailMap } from "@/app/components/HailMap";

// ─── Data (admin analytics mock — dashboard charts) ────────────────────────

const VISITOR_DATA = [
  { month: "Jan", visitors: 12400 }, { month: "Feb", visitors: 18200 },
  { month: "Mar", visitors: 22100 }, { month: "Apr", visitors: 19800 },
  { month: "May", visitors: 14300 }, { month: "Jun", visitors: 9200 },
  { month: "Jul", visitors: 7100 }, { month: "Aug", visitors: 8400 },
  { month: "Sep", visitors: 13600 }, { month: "Oct", visitors: 21300 },
  { month: "Nov", visitors: 24800 }, { month: "Dec", visitors: 20100 },
];

const NATIONALITY_DATA = [
  { name: "Saudi", value: 58 }, { name: "GCC", value: 19 },
  { name: "Arab", value: 13 }, { name: "International", value: 10 },
];
const PIE_COLORS = ["#0E1C36", "#C4912A", "#7A6B55", "#C4B89A"];

const POPULARITY_DATA = [
  { name: "Jubbah", nameAr: "جبيل", visits: 4200 }, { name: "Aja Mt.", nameAr: "جبل أجا", visits: 3800 },
  { name: "Zaabal", nameAr: "زعبل", visits: 3100 }, { name: "Khaybar", nameAr: "خيبر", visits: 2600 },
  { name: "Qishlah", nameAr: "القشلة", visits: 2100 }, { name: "Salma", nameAr: "سلمى", visits: 1900 },
];

const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function visitorChartData(ar: boolean) {
  return VISITOR_DATA.map((d, i) => ({ ...d, month: ar ? MONTHS_AR[i] : d.month }));
}

function nationalityChartData(ar: boolean) {
  if (!ar) return NATIONALITY_DATA;
  return [
    { name: "سعوديون", value: 58 },
    { name: "دول الخليج", value: 19 },
    { name: "عرب", value: 13 },
    { name: "دوليون", value: 10 },
  ];
}

function popularityChartData(ar: boolean) {
  return POPULARITY_DATA.map((d) => ({ ...d, name: ar ? d.nameAr : d.name }));
}

function adminTooltipStyle(ar: boolean) {
  return { fontSize: 12, fontFamily: fontBody(ar), borderRadius: 12, border: "1px solid #E8DDD0" };
}

function DataStatus({ ar }: { ar: boolean }) {
  const { loading, error, refresh, attractions, demoMode } = useTourism();
  if (loading && !attractions.length) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[#7A6B55]">
        <Loader2 size={20} className="animate-spin text-[#C4912A]" />
        <span style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
          {ar ? "جاري تحميل البيانات..." : "Loading data from server..."}
        </span>
      </div>
    );
  }
  if (error && !attractions.length) {
    return (
      <div className="mx-6 my-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <p className="text-red-700 text-sm mb-3" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
          {ar ? "تعذّر الاتصال بالخادم. جاري عرض البيانات التجريبية..." : `Could not connect to API: ${error}`}
        </p>
        <button onClick={() => refresh()} className="text-sm font-semibold text-[#C4912A] hover:underline">
          {ar ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }
  if (demoMode) {
    return (
      <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <p className="text-amber-900 text-xs" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
          {ar
            ? "وضع العرض التجريبي — المعالم والصور متاحة. لتسجيل الدخول والتقييمات شغّلي Django محلياً أو انشري الخادم على Render."
            : "Demo mode — attractions and images are shown. Start Django locally or deploy the API on Render for login and reviews."}
        </p>
      </div>
    );
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(rating) ? "fill-[#C4912A] text-[#C4912A]" : "text-[#C4B89A]"} />
      ))}
    </div>
  );
}

function Badge({ children, color = "#C4912A" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: color + "18", color }}>
      {children}
    </span>
  );
}

// ─── Hail Region Map ───────────────────────────────────────────────────────
// Geographic projection: x=(lng-39)*100, y=(29-lat)*100
// Covers: 39°E–43°E longitude, 25°N–29°N latitude → 400×400 px canvas

// ─── Visitor Platform ──────────────────────────────────────────────────────

function HeroSection({ lang, setPage, placeCount }: { lang: string; setPage: (p: string) => void; placeCount: number }) {
  const ar = lang === "ar";
  const { routes } = useTourism();
  const [search, setSearch] = useState("");
  return (
    <section className="relative min-h-[92vh] flex flex-col" dir={ar ? "rtl" : "ltr"}>
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/ISS-64_Jubba_with_Nefud_Desert%2C_Saudi_Arabia.jpg/1280px-ISS-64_Jubba_with_Nefud_Desert%2C_Saudi_Arabia.jpg"
          alt={ar ? "نقوش جبيل — تراث حائل" : "Jubbah Petroglyphs — Hail heritage"}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E1C36]/75 via-[#0E1C36]/50 to-[#0E1C36]/90" />
        {/* Geometric pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="geo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <polygon points="40,4 76,22 76,58 40,76 4,58 4,22" fill="none" stroke="white" strokeWidth="1" />
              <polygon points="40,16 64,28 64,52 40,64 16,52 16,28" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geo)" />
        </svg>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#C4912A]/20 border border-[#C4912A]/40 text-[#C4912A] rounded-full px-4 py-1.5 text-sm mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C4912A] animate-pulse" />
          <span style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
            {ar ? "أمانة حائل — منصة السياحة الذكية" : "Hail Municipality — Smart Tourism Platform"}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-3" style={{ fontFamily: fontHeading(ar) }}>
          {t(ar, "جادة حائل الذكية", "Jadah Hail")}
        </h1>
        {!ar && (
        <p className="text-xl md:text-2xl text-[#C4912A] font-medium mb-4" style={{ fontFamily: fontHeading(ar) }}>
          Smart Tourism
        </p>
        )}
        <p className="text-base md:text-lg text-white/65 max-w-xl mb-10 leading-relaxed" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
          {ar
            ? "اكتشف كنوز حائل التاريخية والطبيعية عبر منصة سياحية ذكية تجمع بين التراث العريق والتقنية الحديثة"
            : "Discover Hail's historical and natural treasures through an intelligent platform blending ancient heritage with modern technology"}
        </p>

        {/* Search bar */}
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl flex items-center gap-3 p-2 mb-8">
          <Search size={18} className="text-[#7A6B55] ms-3 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ar ? "ابحث عن معلم، حدث، أو مسار سياحي..." : "Search attractions, events, or tourist routes..."}
            className="flex-1 text-sm outline-none bg-transparent text-[#0E1C36] placeholder-[#7A6B55] py-2"
            style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}
          />
          <button
            onClick={() => setPage("explore")}
            className="bg-[#C4912A] hover:bg-[#B07F24] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
            style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}
          >
            {ar ? "بحث" : "Search"}
          </button>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap justify-center gap-6 text-white/80">
          {[
            { n: `${placeCount || 0}`, l: ar ? "موقع سياحي" : "Tourist Sites" },
            { n: "192K", l: ar ? "زائر سنوياً" : "Annual Visitors" },
            { n: "4.7★", l: ar ? "متوسط التقييم" : "Avg. Rating" },
            { n: String(routes.length || 0), l: ar ? "مسارات مقترحة" : "Curated Routes" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-2xl font-bold text-white" style={{ fontFamily: fontHeading(ar) }}>{s.n}</p>
              <p className="text-xs text-white/50 mt-0.5" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="relative flex justify-center pb-8 animate-bounce">
        <ChevronDown size={24} className="text-white/40" />
      </div>
    </section>
  );
}

function CategoriesSection({ lang, setPage, setFilter }: { lang: string; setPage: (p: string) => void; setFilter: (f: string) => void }) {
  const ar = lang === "ar";
  const { attractions } = useTourism();
  const cats = Object.values(CATEGORY_META).map((c) => ({
    icon: c.icon,
    en: c.en,
    ar: c.ar,
    apiKey: c.apiKey,
    count: attractions.filter((a) => a.categoryKey === c.apiKey).length,
  }));
  return (
    <section className="py-16 px-6 max-w-7xl mx-auto" dir={ar ? "rtl" : "ltr"}>
      <div className="text-center mb-10">
        <p className="text-xs font-semibold text-[#C4912A] uppercase tracking-widest mb-2" style={{ fontFamily: "'DM Mono'" }}>
          {ar ? "استكشف حسب الفئة" : "Explore by Category"}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#0E1C36]" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
          {ar ? "ماذا تريد أن تكتشف؟" : "What Would You Like to Discover?"}
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cats.map((c) => (
          <button
            key={c.en}
            onClick={() => { setFilter(c.apiKey); setPage("explore"); }}
            className="group bg-white rounded-2xl p-5 shadow-sm border border-[#E8DDD0] hover:border-[#C4912A] hover:shadow-md transition-all text-center flex flex-col items-center gap-3"
          >
            <span className="text-4xl">{c.icon}</span>
            <div>
              <p className="text-sm font-bold text-[#0E1C36] group-hover:text-[#C4912A] transition-colors" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
                {ar ? c.ar : c.en}
              </p>
              <p className="text-[10px] text-[#7A6B55] mt-0.5" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
                {ar ? "معالم مسجّلة" : "Registered sites"}
              </p>
              <p className="text-[10px] font-semibold text-[#C4912A] mt-1" style={{ fontFamily: fontBody(ar) }}>{c.count} {t(ar, "موقع", "sites")}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function FeaturedAttractionsSection({ lang, setPage, setSelectedId }: { lang: string; setPage: (p: string) => void; setSelectedId: (id: number) => void }) {
  const ar = lang === "ar";
  const { attractions, toggleFavorite } = useTourism();
  const featured = attractions.filter((a) => a.featured);

  const handleFavorite = async (id: number) => {
    try {
      await toggleFavorite(id);
    } catch {
      alert(ar ? "سجّل الدخول لإضافة المفضلة" : "Please sign in to save favorites");
    }
  };

  return (
    <section className="py-16 px-6 bg-[#0E1C36]" dir={ar ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-[#C4912A] uppercase tracking-widest mb-2" style={{ fontFamily: "'DM Mono'" }}>
              {ar ? "أبرز المعالم" : "Featured Attractions"}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
              {ar ? "لا تفوّت هذه المواقع" : "Must-Visit Landmarks"}
            </h2>
          </div>
          <button
            onClick={() => setPage("explore")}
            className="flex items-center gap-2 text-[#C4912A] text-sm font-medium hover:gap-3 transition-all"
            style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}
          >
            {ar ? "عرض الكل" : "View all"}
            <ChevronRight size={16} className={ar ? "rotate-180" : ""} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((a, i) => (
            <div
              key={a.id}
              className={`group bg-[#162235] rounded-3xl overflow-hidden border border-white/8 hover:border-[#C4912A]/40 transition-all hover:-translate-y-1 shadow-xl ${i === 0 ? "md:row-span-1" : ""}`}
            >
              <div className="relative overflow-hidden h-56">
                <img
                  src={a.image}
                  alt={pickPlace(a, ar).name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-[#1a2540]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E1C36]/80 to-transparent" />
                <div className="absolute top-4 start-4">
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#C4912A]/90 text-white" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
                    {pickPlace(a, ar).cat}
                  </span>
                </div>
                <button
                  onClick={() => handleFavorite(a.id)}
                  className="absolute top-4 end-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors"
                >
                  <Heart size={15} className={a.isFavorited ? "fill-red-400 text-red-400" : "text-white"} />
                </button>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-1 leading-snug" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
                  {pickPlace(a, ar).name}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <Stars rating={a.rating} size={12} />
                  <span className="text-xs text-white/50" style={{ fontFamily: fontBody(ar) }}>{a.rating} · {formatReviews(a.reviews, ar)}</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed mb-4 line-clamp-2" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
                  {pickPlace(a, ar).desc}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white/40">
                    <Clock size={12} />
                    <span className="text-xs" style={{ fontFamily: fontBody(ar) }}>{pickPlace(a, ar).hours}</span>
                  </div>
                  <button
                    onClick={() => { setSelectedId(a.id); setPage("detail"); }}
                    className="flex items-center gap-1.5 bg-[#C4912A] hover:bg-[#B07F24] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                    style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}
                  >
                    {ar ? "استكشف" : "Explore"}
                    <ChevronRight size={14} className={ar ? "rotate-180" : ""} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventsSection({ lang }: { lang: string }) {
  const ar = lang === "ar";
  const { events } = useTourism();
  if (!events.length) return null;
  return (
    <section className="py-16 px-6 max-w-7xl mx-auto" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs font-semibold text-[#C4912A] uppercase tracking-widest mb-2" style={{ fontFamily: "'DM Mono'" }}>
            {ar ? "الفعاليات القادمة" : "Upcoming Events"}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0E1C36]" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
            {ar ? "لا تفوّت الفعاليات" : "Don't Miss Out"}
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {events.map((e) => (
          <div key={e.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E8DDD0] hover:border-[#C4912A]/40 hover:-translate-y-0.5 transition-all">
            <div className="h-1.5" style={{ backgroundColor: e.color }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: e.color + "18" }}>
                  <Calendar size={20} style={{ color: e.color }} />
                </div>
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700" style={{ fontFamily: fontBody(ar) }}>{t(ar, "قادمة", "Upcoming")}</span>
              </div>
              <h3 className="text-sm font-bold text-[#0E1C36] leading-snug mb-1" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
                {pickEvent(e, ar).title}
              </h3>
              <div className="space-y-1.5 mt-3">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-[#7A6B55] shrink-0" />
                  <span className="text-xs text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{pickEvent(e, ar).date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-[#7A6B55] shrink-0" />
                  <span className="text-xs text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{pickEvent(e, ar).location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-[#7A6B55] shrink-0" />
                  <span className="text-xs text-[#7A6B55]" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
                    {ar ? "فعالية قادمة" : "Upcoming event"}
                  </span>
                </div>
              </div>
              <button className="mt-4 w-full py-2 rounded-xl text-xs font-semibold border-2 transition-colors hover:text-white"
                style={{ borderColor: e.color, color: e.color, fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}
                onMouseEnter={(el) => (el.currentTarget.style.backgroundColor = e.color)}
                onMouseLeave={(el) => (el.currentTarget.style.backgroundColor = "transparent")}
              >
                {ar ? "احجز مكانك" : "Register Now"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoutesSection({ lang }: { lang: string }) {
  const ar = lang === "ar";
  const { routes, attractions } = useTourism();
  if (!routes.length) return null;
  return (
    <section className="py-16 px-6 bg-[#F6EFE3]" dir={ar ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-[#C4912A] uppercase tracking-widest mb-2" style={{ fontFamily: "'DM Mono'" }}>
            {ar ? "مسارات مقترحة" : "Curated Routes"}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0E1C36]" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
            {ar ? "خطط رحلتك المثالية" : "Plan Your Perfect Journey"}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {routes.map((r) => (
            <div key={r.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#E8DDD0] hover:shadow-md transition-all">
              <div className="h-2" style={{ backgroundColor: r.color }} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-[#0E1C36]" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
                    {pickRoute(r, ar).name}
                  </h3>
                  <Badge color={r.color}>{pickRoute(r, ar).diff}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { icon: <Clock size={14} />, label: pickRoute(r, ar).duration },
                    { icon: <MapPin size={14} />, label: pickRoute(r, ar).stops },
                  ].map((info, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 bg-[#F6EFE3] rounded-xl p-3 text-center">
                      <span style={{ color: r.color }}>{info.icon}</span>
                      <span className="text-xs font-medium text-[#0E1C36]" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>{info.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mb-5">
                  {getRoutePlaceImages(r, attractions).map((img, idx) => (
                    <div key={idx} className="flex-1 h-14 rounded-xl overflow-hidden bg-[#E8DDD0]">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <button
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: r.color, fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}
                >
                  {ar ? "ابدأ المسار" : "Start This Route"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExplorePage({ lang, setPage, setSelectedId, activeFilter, setActiveFilter }: { lang: string; setPage: (p: string) => void; setSelectedId: (id: number) => void; activeFilter: string; setActiveFilter: (f: string) => void }) {
  const ar = lang === "ar";
  const { attractions } = useTourism();
  const [search, setSearch] = useState("");
  const filters = [
    { key: "All", en: "All", ar: "الكل" },
    ...Object.values(CATEGORY_META).map((c) => ({ key: c.apiKey, en: c.en, ar: c.ar })),
  ];

  const filtered = attractions.filter((a) => {
    const matchFilter = activeFilter === "All" || a.categoryKey === activeFilter;
    const matchSearch = !search || a.nameEn.toLowerCase().includes(search.toLowerCase()) || a.nameAr.includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F6EFE3]" dir={ar ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-[#0E1C36] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => setPage("home")} className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={16} className={ar ? "rotate-180" : ""} />
            <span style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>{ar ? "العودة للرئيسية" : "Back to Home"}</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
            {ar ? "استكشف حائل" : "Explore Hail"}
          </h1>
          <p className="text-white/50 text-sm" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
            {ar ? `${attractions.length} موقع سياحي مسجّل` : `${attractions.length} registered tourist attractions`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search + filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex items-center gap-3 bg-white rounded-xl border border-[#E8DDD0] px-4 py-3 flex-1 shadow-sm">
            <Search size={16} className="text-[#7A6B55] shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? "ابحث عن معلم..." : "Search attractions..."}
              className="flex-1 outline-none bg-transparent text-sm text-[#0E1C36] placeholder-[#7A6B55]"
              style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button key={f.key} onClick={() => setActiveFilter(f.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeFilter === f.key ? "bg-[#0E1C36] text-white" : "bg-white text-[#7A6B55] border border-[#E8DDD0] hover:border-[#C4912A]"}`}
                style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
                {ar ? f.ar : f.en}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((a) => (
            <button key={a.id} onClick={() => { setSelectedId(a.id); setPage("detail"); }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#E8DDD0] hover:border-[#C4912A]/40 hover:-translate-y-1 hover:shadow-lg transition-all text-start group">
              <div className="relative h-52 bg-[#E8DDD0] overflow-hidden">
                <img src={a.image} alt={pickPlace(a, ar).name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-4 start-4">
                  <Badge color="#C4912A">{pickPlace(a, ar).cat}</Badge>
                </div>
                <div className="absolute top-4 end-4 bg-white/90 rounded-full px-2.5 py-1 flex items-center gap-1">
                  <Star size={11} className="fill-[#C4912A] text-[#C4912A]" />
                  <span className="text-xs font-bold text-[#0E1C36]" style={{ fontFamily: "'DM Mono'" }}>{a.rating}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-[#0E1C36] mb-1" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
                  {pickPlace(a, ar).name}
                </h3>
                <p className="text-xs text-[#7A6B55] line-clamp-2 mb-3 leading-relaxed" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
                  {pickPlace(a, ar).desc}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-[#E8DDD0]">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#C4912A]" />
                    <span className="text-xs text-[#7A6B55]" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>{pickPlace(a, ar).distance}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-[#C4912A]" />
                    <span className="text-xs text-[#7A6B55]" style={{ fontFamily: "'DM Mono'" }}>{a.hours}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailPage({ lang, id, setPage, setSelectedId }: { lang: string; id: number; setPage: (p: string) => void; setSelectedId: (id: number) => void }) {
  const ar = lang === "ar";
  const { attractions, toggleFavorite, submitReview, getPlaceReviews, user } = useTourism();
  const place = attractions.find((a) => a.id === id) || attractions[0];
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const placeReviews = place ? getPlaceReviews(place.id) : [];

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6EFE3]">
        <p className="text-[#7A6B55]" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
          {ar ? "المعلم غير موجود" : "Place not found"}
        </p>
      </div>
    );
  }

  const handleFavorite = async () => {
    try {
      await toggleFavorite(place.id);
    } catch {
      alert(ar ? "سجّل الدخول لإضافة المفضلة" : "Please sign in to save favorites");
    }
  };

  const handleReview = async () => {
    try {
      await submitReview(place.id, reviewRating, reviewText);
      setReviewText("");
    } catch {
      alert(ar ? "سجّل الدخول لإضافة تقييم" : "Please sign in to submit a review");
    }
  };

  const pp = pickPlace(place, ar);

  return (
    <div className="min-h-screen bg-[#F6EFE3]" dir={ar ? "rtl" : "ltr"}>
      {/* Hero */}
      <div className="relative h-[55vh] min-h-[400px] bg-[#E8DDD0]">
        <img src={place.image} alt={pp.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1C36] via-[#0E1C36]/30 to-transparent" />
        <div className="absolute top-6 start-6">
          <button onClick={() => setPage("explore")} className="flex items-center gap-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white px-4 py-2 rounded-full text-sm transition-colors">
            <ArrowLeft size={16} className={ar ? "rotate-180" : ""} />
            <span style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>{ar ? "عودة" : "Back"}</span>
          </button>
        </div>
        <div className="absolute top-6 end-6 flex gap-2">
          <button onClick={handleFavorite} className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${place.isFavorited ? "bg-red-500" : "bg-white/15 hover:bg-white/25"}`}>
            <Heart size={18} className={place.isFavorited ? "fill-white text-white" : "text-white"} />
          </button>
          <button className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 flex items-center justify-center">
            <Share2 size={18} className="text-white" />
          </button>
        </div>
        <div className="absolute bottom-8 start-8 end-8">
          <Badge color="#C4912A">{pp.cat}</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-3" style={{ fontFamily: fontHeading(ar) }}>
            {pp.name}
          </h1>
          <div className="flex items-center gap-3">
            <Stars rating={place.rating} size={16} />
            <span className="text-white/60 text-sm" style={{ fontFamily: fontBody(ar) }}>{place.rating} · {formatReviews(place.reviews, ar)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info chips */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: <Clock size={15} />, text: pp.hours },
              { icon: <MapPin size={15} />, text: pp.distance },
              { icon: <Eye size={15} />, text: t(ar, "مفتوح الآن", "Open Now") },
              { icon: <Users size={15} />, text: formatVisitors(place.reviews, ar) },
            ].map((chip, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-[#E8DDD0]">
                <span className="text-[#C4912A]">{chip.icon}</span>
                <span className="text-sm text-[#0E1C36] font-medium" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>{chip.text}</span>
              </div>
            ))}
          </div>

          {/* About */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E8DDD0]">
            <h2 className="text-xl font-bold text-[#0E1C36] mb-3" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
              {ar ? "نبذة عن الموقع" : "About This Place"}
            </h2>
            <p className="text-[#7A6B55] leading-relaxed" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
              {pp.desc}
            </p>
          </div>

          {/* Map */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#E8DDD0]">
            <div className="relative h-64 overflow-hidden">
              <HailMap
                ar={ar}
                attractions={attractions}
                focusPlaceId={id}
                className="!min-h-0 h-full"
              />
            </div>
            <div className="flex items-center justify-between p-5 border-t border-[#E8DDD0]">
              <div>
                <p className="text-sm font-semibold text-[#0E1C36]" style={{ fontFamily: fontBody(ar) }}>{pp.name}</p>
                <p className="text-xs text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{pp.distance}</p>
              </div>
              <a
                href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#0E1C36] hover:bg-[#1a2f52] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Navigation size={15} />
                <span style={{ fontFamily: fontBody(ar) }}>{t(ar, "الاتجاهات", "Get Directions")}</span>
              </a>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E8DDD0]">
            <h2 className="text-xl font-bold text-[#0E1C36] mb-5" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
              {ar ? "تقييمات الزوار" : "Visitor Reviews"}
            </h2>
            <div className="space-y-4">
              {placeReviews.slice(0, 5).map((f) => (
                <div key={f.id} className="flex gap-4 pb-4 border-b border-[#E8DDD0] last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-[#0E1C36] flex items-center justify-center shrink-0">
                    <span className="text-sm text-white font-bold">{f.user[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#0E1C36]">{f.user}</p>
                        <Stars rating={f.rating} size={12} />
                      </div>
                      <span className="text-xs text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{f.date}</span>
                    </div>
                    <p className="text-sm text-[#7A6B55] mt-1.5 leading-relaxed" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>{f.text}</p>
                  </div>
                </div>
              ))}
              {user && (
                <div className="pt-4 border-t border-[#E8DDD0] space-y-3">
                  <p className="text-sm font-semibold text-[#0E1C36]" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
                    {ar ? "أضف تقييمك" : "Add your review"}
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setReviewRating(n)}>
                        <Star size={18} className={n <= reviewRating ? "fill-[#C4912A] text-[#C4912A]" : "text-[#C4B89A]"} />
                      </button>
                    ))}
                  </div>
                  <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3}
                    className="w-full rounded-xl border border-[#E8DDD0] p-3 text-sm outline-none focus:border-[#C4912A]"
                    placeholder={ar ? "اكتب تعليقك..." : "Write your comment..."}
                    style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }} />
                  <button onClick={handleReview} className="bg-[#C4912A] hover:bg-[#B07F24] text-white px-5 py-2 rounded-xl text-sm font-semibold">
                    {ar ? "إرسال التقييم" : "Submit Review"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-[#0E1C36] rounded-3xl p-6 text-white sticky top-20">
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
              {ar ? "معلومات الزيارة" : "Visit Information"}
            </h3>
            <div className="space-y-3 mb-6">
              {[
                { label: t(ar, "ساعات العمل", "Opening Hours"), value: pp.hours },
                { label: t(ar, "المسافة", "Distance"), value: pp.distance },
                { label: t(ar, "أفضل فصل", "Best Season"), value: t(ar, "أكتوبر – مارس", "Oct – Mar") },
                { label: t(ar, "التقييم", "Rating"), value: `${place.rating} / 5.0 ★` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2 border-b border-white/8">
                  <span className="text-xs text-white/50" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>{item.label}</span>
                  <span className="text-xs font-semibold text-white" style={{ fontFamily: "'DM Mono'" }}>{item.value}</span>
                </div>
              ))}
            </div>
            <button className="w-full py-3.5 rounded-xl bg-[#C4912A] hover:bg-[#B07F24] text-white font-bold text-sm transition-colors mb-3" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
              {ar ? "احجز جولة موجهة" : "Book Guided Tour"}
            </button>
            <button onClick={handleFavorite} className="w-full py-3 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/8 transition-colors" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
              {place.isFavorited ? (ar ? "إزالة من المفضلة" : "Remove from Favourites") : (ar ? "أضف للمفضلة" : "Add to Favourites")}
            </button>
          </div>

          {/* Related */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E8DDD0]">
            <h3 className="text-sm font-bold text-[#0E1C36] mb-4" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
              {ar ? "مواقع قريبة" : "Nearby Attractions"}
            </h3>
            {attractions.filter((a) => a.id !== id).slice(0, 3).map((a) => (
              <button key={a.id} onClick={() => setSelectedId(a.id)}
                className="flex items-center gap-3 w-full py-2.5 border-b border-[#E8DDD0] last:border-0 hover:bg-[#F6EFE3] -mx-1 px-1 rounded-lg transition-colors">
                <img src={a.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-[#E8DDD0] shrink-0" />
                <div className="flex-1 text-start">
                  <p className="text-sm font-semibold text-[#0E1C36]" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>{pickPlace(a, ar).name}</p>
                  <Stars rating={a.rating} size={10} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VisitorNavbar({ lang, setLang, page, setPage }: { lang: string; setLang: (l: string) => void; page: string; setPage: (p: string) => void }) {
  const ar = lang === "ar";
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { id: "home", en: "Home", ar: "الرئيسية", icon: <Home size={15} /> },
    { id: "explore", en: "Explore", ar: "استكشف", icon: <Eye size={15} /> },
    { id: "map", en: "Map", ar: "الخريطة", icon: <Map size={15} /> },
    { id: "routes", en: "Routes", ar: "المسارات", icon: <Route size={15} /> },
    { id: "assistant", en: "AI Guide", ar: "المساعد الذكي", icon: <Zap size={15} /> },
  ];

  return (
    <nav className="bg-[#0E1C36] sticky top-14 z-40 border-b border-white/8" dir={ar ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <button key={l.id} onClick={() => setPage(l.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${page === l.id ? "bg-[#C4912A] text-white" : "text-white/50 hover:text-white hover:bg-white/8"}`}
              style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
              {l.icon} {ar ? l.ar : l.en}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {/* Language toggle */}
        <button onClick={() => setLang(ar ? "en" : "ar")}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
          <Globe size={14} />
          <span style={{ fontFamily: fontBody(ar) }}>{t(ar, "English", "عربي")}</span>
        </button>
        {/* Mobile menu */}
        <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0E1C36] border-t border-white/8 px-4 pb-4">
          {links.map((l) => (
            <button key={l.id} onClick={() => { setPage(l.id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium my-0.5 transition-colors ${page === l.id ? "bg-[#C4912A] text-white" : "text-white/60 hover:text-white hover:bg-white/8"}`}
              style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
              {l.icon} {ar ? l.ar : l.en}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

function VisitorPlatform({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const [page, setPage] = useState("home");
  const [selectedId, setSelectedId] = useState(1);
  const [filter, setFilter] = useState("All");
  const [mapHighlightId, setMapHighlightId] = useState<number | null>(null);
  const { attractions } = useTourism();
  const ar = lang === "ar";

  const renderPage = () => {
    if (page === "detail") return <DetailPage lang={lang} id={selectedId} setPage={setPage} setSelectedId={setSelectedId} />;
    if (page === "explore") return <ExplorePage lang={lang} setPage={setPage} setSelectedId={setSelectedId} activeFilter={filter} setActiveFilter={setFilter} />;
    if (page === "map") return (
      <div className="min-h-screen bg-[#F6EFE3] flex flex-col" dir={ar ? "rtl" : "ltr"}>
        <div className="bg-[#0E1C36] py-10 px-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>{ar ? "خريطة حائل السياحية" : "Hail Tourism Map"}</h1>
            <p className="text-white/50 mt-1 text-sm" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>{ar ? "المواقع الجغرافية الدقيقة للمعالم السياحية في منطقة حائل" : "Accurate geographic locations of tourist attractions in the Hail region"}</p>
          </div>
        </div>
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: "70vh" }}>
          <HailMap
            ar={ar}
            attractions={attractions}
            highlightId={mapHighlightId}
            onPlaceSelect={(id) => { setSelectedId(id); setPage("detail"); }}
          />
          {/* Legend */}
          <div className="absolute bottom-6 start-6 z-[1000] bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-[#E8DDD0] pointer-events-none">
            <p className="text-sm font-bold text-[#0E1C36] mb-3" style={{ fontFamily: fontHeading(ar) }}>{t(ar, "مفتاح الخريطة", "Map Legend")}</p>
            <div className="space-y-2">
              {[
                { color: "#0E1C36", label: t(ar, "مدينة حائل", "Hail City") },
                { color: "#C4912A", label: t(ar, "معلم تراثي / تاريخي", "Heritage / Historic") },
                { color: "#2E7D32", label: t(ar, "معلم طبيعي", "Natural Landmark") },
                { color: "#1565C0", label: t(ar, "معلم ثقافي", "Cultural Landmark") },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0 border border-white shadow-sm" style={{ backgroundColor: l.color }} />
                  <span className="text-xs text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Attraction cards row */}
        <div className="bg-white border-t border-[#E8DDD0] px-6 py-4">
          <div className="max-w-7xl mx-auto flex gap-3 overflow-x-auto no-scrollbar">
            {attractions.map((a) => (
              <button
                key={a.id}
                onClick={() => { setSelectedId(a.id); setPage("detail"); }}
                onMouseEnter={() => setMapHighlightId(a.id)}
                onMouseLeave={() => setMapHighlightId(null)}
                className={`shrink-0 flex items-center gap-3 rounded-xl px-4 py-2.5 border transition-colors ${mapHighlightId === a.id ? "bg-[#C4912A]/10 border-[#C4912A]" : "bg-[#F6EFE3] border-[#E8DDD0] hover:border-[#C4912A]"}`}
              >
                <img src={a.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-[#E8DDD0]" />
                <div className="text-start">
                  <p className="text-xs font-semibold text-[#0E1C36] whitespace-nowrap" style={{ fontFamily: fontBody(ar) }}>{pickPlace(a, ar).name}</p>
                  <p className="text-[10px] text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{pickPlace(a, ar).hours}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
    if (page === "routes") return (
      <div className="min-h-screen bg-[#F6EFE3]" dir={ar ? "rtl" : "ltr"}>
        <div className="bg-[#0E1C36] py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>{ar ? "المسارات السياحية" : "Tourist Routes"}</h1>
            <p className="text-white/50 mt-2" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>{ar ? "مسارات مخططة لتجربة لا تُنسى" : "Curated itineraries for unforgettable journeys"}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <RoutesSection lang={lang} />
        </div>
      </div>
    );
    if (page === "assistant") return (
      <div className="min-h-screen bg-[#0E1C36]" dir={ar ? "rtl" : "ltr"}>
        <div className="max-w-5xl mx-auto px-6 pt-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>{ar ? "المساعد السياحي الذكي" : "AI Tourism Assistant"}</h1>
        </div>
        <AIAssistantSection lang={lang} />
      </div>
    );
    // Home
    return (
      <div>
        <DataStatus ar={ar} />
        <HeroSection lang={lang} setPage={setPage} placeCount={attractions.length} />
        <CategoriesSection lang={lang} setPage={setPage} setFilter={setFilter} />
        <FeaturedAttractionsSection lang={lang} setPage={setPage} setSelectedId={setSelectedId} />
        <EventsSection lang={lang} />
        <RoutesSection lang={lang} />
        <AIAssistantSection lang={lang} />
        <footer className="bg-[#0A1428] text-white/40 py-8 px-6 text-center" dir={ar ? "rtl" : "ltr"}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-[#C4912A] flex items-center justify-center">
              <MapPin size={12} className="text-white" />
            </div>
            <span className="text-white/70 text-sm font-bold" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
              {ar ? "جادة حائل الذكية" : "Jadah Hail Smart Tourism"}
            </span>
          </div>
          <p className="text-xs" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
            {ar ? "© ٢٠٢٥ أمانة حائل — جميع الحقوق محفوظة" : "© 2025 Hail Municipality — All rights reserved"}
          </p>
        </footer>
      </div>
    );
  };

  return (
    <div className="bg-[#F6EFE3]">
      <VisitorNavbar lang={lang} setLang={setLang} page={page} setPage={setPage} />
      {renderPage()}
    </div>
  );
}

// ─── Admin Dashboard ───────────────────────────────────────────────────────

function AdminLogin({ onLogin, ar }: { onLogin: () => void; ar: boolean }) {
  return (
    <div className="min-h-screen bg-[#0E1C36] flex items-center justify-center p-6" dir={ar ? "rtl" : "ltr"}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C4912A] mb-4 shadow-2xl">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: fontHeading(ar) }}>
            {t(ar, "جادة حائل", "Jadah Hail")}
          </h1>
          <p className="text-[#C4B89A] text-sm mt-1" style={{ fontFamily: fontBody(ar) }}>
            {t(ar, "لوحة تحكم الإدارة", "Administration Dashboard")}
          </p>
          <p className="text-[#5A6F8A] text-xs mt-0.5" style={{ fontFamily: fontBody(ar) }}>
            {t(ar, "بوابة إدارة أمانة حائل", "Municipality Administration Portal")}
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: fontHeading(ar) }}>
            {t(ar, "تسجيل الدخول الآمن", "Secure Sign In")}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#C4B89A] mb-2" style={{ fontFamily: fontBody(ar) }}>
                {t(ar, "البريد الإلكتروني", "Email")}
              </label>
              <input defaultValue="admin@hailmun.sa" className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#C4912A] transition-colors" style={{ fontFamily: fontBody(ar) }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C4B89A] mb-2" style={{ fontFamily: fontBody(ar) }}>
                {t(ar, "كلمة المرور", "Password")}
              </label>
              <input type="password" defaultValue="password" className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#C4912A] transition-colors" style={{ fontFamily: fontBody(ar) }} />
            </div>
            <button onClick={onLogin} className="w-full bg-[#C4912A] hover:bg-[#B07F24] text-white py-3.5 rounded-xl text-sm font-bold transition-colors" style={{ fontFamily: fontBody(ar) }}>
              {t(ar, "دخول لوحة التحكم", "Sign In to Dashboard")}
            </button>
          </div>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Shield size={12} className="text-[#5A6F8A]" />
            <p className="text-[10px] text-[#5A6F8A]" style={{ fontFamily: fontBody(ar) }}>
              {t(ar, "محمي · قسم تقنية المعلومات — أمانة حائل", "Secured · Hail Municipality IT Department")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, ar }: { label: string; value: string; sub: string; icon: React.ReactNode; color: string; ar: boolean }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DDD0]">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full" style={{ fontFamily: fontBody(ar) }}>{sub}</span>
      </div>
      <p className="text-3xl font-bold text-[#0E1C36] leading-none mb-1" style={{ fontFamily: fontHeading(ar) }}>{value}</p>
      <p className="text-sm text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{label}</p>
    </div>
  );
}

function AdminDashboard({ lang }: { lang: string }) {
  const ar = lang === "ar";
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} ar={ar} />;

  const nav = [
    { id: "overview", icon: <BarChart2 size={18} />, label: t(ar, "نظرة عامة", "Overview") },
    { id: "locations", icon: <MapPin size={18} />, label: t(ar, "المواقع", "Locations") },
    { id: "events", icon: <Calendar size={18} />, label: t(ar, "الفعاليات", "Events") },
    { id: "analytics", icon: <TrendingUp size={18} />, label: t(ar, "التحليلات", "Analytics") },
    { id: "feedback", icon: <MessageSquare size={18} />, label: t(ar, "التغذية الراجعة", "Feedback") },
  ];

  const renderScreen = () => {
    if (screen === "locations") return <AdminLocations ar={ar} />;
    if (screen === "events") return <AdminEvents ar={ar} />;
    if (screen === "analytics") return <AdminAnalytics ar={ar} />;
    if (screen === "feedback") return <AdminFeedback ar={ar} />;
    return <AdminOverview ar={ar} />;
  };

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#F6EFE3] overflow-hidden" dir={ar ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-[#0E1C36] flex flex-col shrink-0 transition-all duration-300 overflow-hidden`}>
        <div className={`p-5 border-b border-white/8 flex items-center ${sidebarOpen ? "gap-3" : "justify-center"}`}>
          <div className="w-9 h-9 rounded-xl bg-[#C4912A] flex items-center justify-center shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-white text-sm font-bold leading-tight" style={{ fontFamily: fontHeading(ar) }}>
                {t(ar, "لوحة الإدارة", "Admin Portal")}
              </p>
              <p className="text-white/30 text-[10px]" style={{ fontFamily: fontBody(ar) }}>
                {t(ar, "أمانة حائل", "Hail Municipality")}
              </p>
            </div>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <button key={item.id} onClick={() => setScreen(item.id)}
              className={`w-full flex items-center ${sidebarOpen ? "gap-3 px-4" : "justify-center px-0"} py-3 rounded-xl transition-colors text-sm font-medium ${screen === item.id ? "bg-[#C4912A] text-white" : "text-white/40 hover:text-white hover:bg-white/8"}`}>
              {item.icon}
              {sidebarOpen && <span style={{ fontFamily: fontBody(ar) }}>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className={`p-3 border-t border-white/8 ${!sidebarOpen ? "flex justify-center" : ""}`}>
          <button onClick={() => setLoggedIn(false)}
            className={`flex items-center ${sidebarOpen ? "gap-3 px-4 w-full" : "justify-center"} py-3 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors`}>
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm font-medium" style={{ fontFamily: fontBody(ar) }}>{t(ar, "تسجيل الخروج", "Sign Out")}</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-[#E8DDD0] flex items-center px-6 gap-4 shrink-0 shadow-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[#7A6B55] hover:text-[#0E1C36] transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-[#F6EFE3] rounded-xl px-3 py-2.5 border border-[#E8DDD0]">
            <Search size={14} className="text-[#7A6B55]" />
            <input placeholder={t(ar, "بحث سريع...", "Quick search...")} className="text-sm outline-none bg-transparent text-[#0E1C36] placeholder-[#7A6B55] w-44" style={{ fontFamily: fontBody(ar) }} />
          </div>
          <button className="relative text-[#7A6B55] hover:text-[#0E1C36] w-9 h-9 rounded-xl hover:bg-[#F6EFE3] flex items-center justify-center transition-colors">
            <Bell size={18} />
            <div className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-[#C4912A]" />
          </button>
          <div className="flex items-center gap-2.5 ps-3 border-s border-[#E8DDD0]">
            <div className="w-8 h-8 rounded-full bg-[#0E1C36] flex items-center justify-center">
              <span className="text-xs text-white font-bold">{ar ? "م" : "A"}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0E1C36] leading-none" style={{ fontFamily: fontBody(ar) }}>
                {t(ar, "المسؤول", "Admin")}
              </p>
              <p className="text-[10px] text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>
                {t(ar, "أمانة حائل", "Hail Municipality")}
              </p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{renderScreen()}</main>
      </div>
    </div>
  );
}

function AdminOverview({ ar }: { ar: boolean }) {
  const chartData = visitorChartData(ar);
  const natData = nationalityChartData(ar);
  const popData = popularityChartData(ar);
  return (
    <div className="p-8 space-y-7 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-[#0E1C36]" style={{ fontFamily: fontHeading(ar) }}>
          {t(ar, "نظرة عامة على لوحة التحكم", "Dashboard Overview")}
        </h2>
        <p className="text-sm text-[#7A6B55] mt-1" style={{ fontFamily: fontBody(ar) }}>
          {t(ar, "يناير ٢٠٢٥ · أداء السياحة في منطقة حائل", "January 2025 · Hail Region Tourism Performance")}
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard ar={ar} label={t(ar, "إجمالي الزوار", "Total Visitors")} value={ar ? "١٩٢٫٤ ألف" : "192.4K"} sub={t(ar, "+١٨٪ ↑", "+18% ↑")} icon={<Users size={20} />} color="#0E1C36" />
        <StatCard ar={ar} label={t(ar, "المواقع النشطة", "Active Locations")} value={ar ? "٣٤" : "34"} sub={t(ar, "+٣ جديد", "+3 new")} icon={<MapPin size={20} />} color="#C4912A" />
        <StatCard ar={ar} label={t(ar, "فعاليات هذا الشهر", "Events This Month")} value={ar ? "١٢" : "12"} sub={t(ar, "٤ قادمة", "4 upcoming")} icon={<Calendar size={20} />} color="#2E7D32" />
        <StatCard ar={ar} label={t(ar, "متوسط التقييم", "Avg. Rating")} value="4.72" sub={t(ar, "★ ممتاز", "★ Excellent")} icon={<Star size={20} />} color="#C4912A" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-[#E8DDD0]">
          <h3 className="text-base font-bold text-[#0E1C36] mb-5" style={{ fontFamily: fontHeading(ar) }}>
            {t(ar, "اتجاه الزوار الشهري — ٢٠٢٤", "Monthly Visitor Trends 2024")}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C4912A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C4912A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#7A6B55", fontFamily: fontBody(ar) }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#7A6B55", fontFamily: fontBody(ar) }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}${ar ? " ألف" : "K"}`} />
              <Tooltip contentStyle={adminTooltipStyle(ar)} />
              <Area type="monotone" dataKey="visitors" name={t(ar, "الزوار", "Visitors")} stroke="#C4912A" strokeWidth={2.5} fill="url(#vg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DDD0]">
          <h3 className="text-base font-bold text-[#0E1C36] mb-4" style={{ fontFamily: fontHeading(ar) }}>
            {t(ar, "جنسيات الزوار", "Visitor Origins")}
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={natData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                {natData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={adminTooltipStyle(ar)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {natData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-xs text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{d.name}</span>
                </div>
                <span className="text-xs font-bold text-[#0E1C36]" style={{ fontFamily: fontBody(ar) }}>{ar ? `${d.value}٪` : `${d.value}%`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DDD0]">
        <h3 className="text-base font-bold text-[#0E1C36] mb-5" style={{ fontFamily: fontHeading(ar) }}>
          {t(ar, "أكثر المعالم زيارة — يناير ٢٠٢٥", "Most Visited Attractions — January 2025")}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={popData} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#7A6B55", fontFamily: fontBody(ar) }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#7A6B55", fontFamily: fontBody(ar) }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={adminTooltipStyle(ar)} />
            <Bar dataKey="visits" name={t(ar, "الزيارات", "Visits")} radius={[6, 6, 0, 0]}>
              {popData.map((_, i) => <Cell key={i} fill={i === 0 ? "#C4912A" : "#0E1C36"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AdminLocations({ ar }: { ar: boolean }) {
  const [search, setSearch] = useState("");
  const { attractions } = useTourism();
  const list = attractions.filter((a) => {
    const q = search.toLowerCase();
    return a.nameEn.toLowerCase().includes(q) || a.nameAr.includes(search);
  });
  const headers = ar
    ? ["الموقع", "الفئة", "التقييم", "التقييمات", "الساعات", "الحالة", "إجراءات"]
    : ["Location", "Category", "Rating", "Reviews", "Hours", "Status", "Actions"];
  return (
    <div className="p-8 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0E1C36]" style={{ fontFamily: fontHeading(ar) }}>
            {t(ar, "المواقع السياحية", "Tourist Locations")}
          </h2>
          <p className="text-sm text-[#7A6B55] mt-0.5" style={{ fontFamily: fontBody(ar) }}>
            {t(ar, "إدارة جميع المعالم المسجّلة", "Manage all registered attractions")}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#C4912A] hover:bg-[#B07F24] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors" style={{ fontFamily: fontBody(ar) }}>
          <Plus size={16} /> {t(ar, "إضافة موقع", "Add Location")}
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8DDD0] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8DDD0]">
          <Search size={16} className="text-[#7A6B55]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t(ar, "ابحث عن موقع...", "Search locations...")}
            className="flex-1 text-sm outline-none bg-transparent text-[#0E1C36] placeholder-[#7A6B55]" style={{ fontFamily: fontBody(ar) }} />
          <button className="flex items-center gap-1.5 text-xs text-[#7A6B55] bg-[#F6EFE3] border border-[#E8DDD0] px-3 py-2 rounded-lg hover:border-[#C4912A] transition-colors" style={{ fontFamily: fontBody(ar) }}>
            <Filter size={12} /> {t(ar, "تصفية", "Filter")}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-[#F6EFE3]">
                {headers.map((h) => (
                  <th key={h} className="text-start px-5 py-3.5 text-xs font-semibold text-[#7A6B55] uppercase tracking-wide" style={{ fontFamily: fontBody(ar) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-t border-[#E8DDD0] hover:bg-[#F6EFE3]/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={a.image} alt={pickPlace(a, ar).name} className="w-11 h-11 rounded-xl object-cover bg-[#E8DDD0] shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-[#0E1C36]" style={{ fontFamily: fontBody(ar) }}>{pickPlace(a, ar).name}</p>
                        {!ar && <p className="text-xs text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{a.nameAr}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><Badge color="#C4912A">{pickPlace(a, ar).cat}</Badge></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Star size={13} className="fill-[#C4912A] text-[#C4912A]" />
                      <span className="text-sm font-semibold text-[#0E1C36]" style={{ fontFamily: fontBody(ar) }}>{a.rating}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{formatReviews(a.reviews, ar)}</td>
                  <td className="px-5 py-4 text-xs text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{pickPlace(a, ar).hours}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-medium px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700" style={{ fontFamily: fontBody(ar) }}>
                      {t(ar, "نشط", "Active")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button title={t(ar, "تعديل", "Edit")} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#F6EFE3] hover:bg-[#E8DDD0] transition-colors"><Edit size={14} className="text-[#0E1C36]" /></button>
                      <button title={t(ar, "حذف", "Delete")} className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 hover:bg-red-100 transition-colors"><Trash2 size={14} className="text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminEvents({ ar }: { ar: boolean }) {
  const { events } = useTourism();
  return (
    <div className="p-8 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0E1C36]" style={{ fontFamily: fontHeading(ar) }}>
            {t(ar, "الفعاليات والأنشطة", "Events & Activities")}
          </h2>
          <p className="text-sm text-[#7A6B55] mt-0.5" style={{ fontFamily: fontBody(ar) }}>
            {t(ar, "جدولة وإدارة الفعاليات السياحية", "Schedule and manage tourism events")}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#C4912A] hover:bg-[#B07F24] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors" style={{ fontFamily: fontBody(ar) }}>
          <Plus size={16} /> {t(ar, "فعالية جديدة", "New Event")}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {events.map((e) => (
          <div key={e.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E8DDD0]">
            <div className="h-1.5" style={{ backgroundColor: e.color }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: e.color + "18" }}>
                  <Calendar size={20} style={{ color: e.color }} />
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700" style={{ fontFamily: fontBody(ar) }}>
                  {t(ar, "قادمة", "Upcoming")}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#0E1C36] leading-snug mb-1" style={{ fontFamily: fontHeading(ar) }}>
                {pickEvent(e, ar).title}
              </h3>
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}><Clock size={12} />{pickEvent(e, ar).date}</div>
                <div className="flex items-center gap-2 text-xs text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}><MapPin size={12} />{pickEvent(e, ar).location}</div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-xl text-xs font-medium border border-[#E8DDD0] text-[#0E1C36] hover:bg-[#F6EFE3] flex items-center justify-center gap-1 transition-colors" style={{ fontFamily: fontBody(ar) }}>
                  <Edit size={12} /> {t(ar, "تعديل", "Edit")}
                </button>
                <button className="flex-1 py-2 rounded-xl text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center gap-1 transition-colors" style={{ fontFamily: fontBody(ar) }}>
                  <Trash2 size={12} /> {t(ar, "حذف", "Remove")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAnalytics({ ar }: { ar: boolean }) {
  const chartData = visitorChartData(ar);
  const popData = popularityChartData(ar);
  const kpis = ar
    ? [
        { label: "تحميلات التطبيق", value: "٤٨٬٢٣٠", change: "+٢٣٪", color: "#0E1C36" },
        { label: "إكمال المسارات", value: "١٢٬٨٤٠", change: "+١٥٪", color: "#C4912A" },
        { label: "جلسات المساعد الذكي", value: "٣١٬١٠٠", change: "+٤١٪", color: "#2E7D32" },
        { label: "متوسط مدة الزيارة", value: "٢٫٤ س", change: "+٨٪", color: "#6A1B9A" },
      ]
    : [
        { label: "App Downloads", value: "48,230", change: "+23%", color: "#0E1C36" },
        { label: "Route Completions", value: "12,840", change: "+15%", color: "#C4912A" },
        { label: "AI Chat Sessions", value: "31,100", change: "+41%", color: "#2E7D32" },
        { label: "Avg. Visit Duration", value: "2.4 hrs", change: "+8%", color: "#6A1B9A" },
      ];
  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-[#0E1C36]" style={{ fontFamily: fontHeading(ar) }}>
          {t(ar, "التحليلات والرؤى", "Analytics & Insights")}
        </h2>
        <p className="text-sm text-[#7A6B55] mt-1" style={{ fontFamily: fontBody(ar) }}>
          {t(ar, "مؤشرات أداء وسلوك الزوار", "Deep visitor behavior and performance metrics")}
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8DDD0] flex items-center gap-4">
            <div className="w-1.5 h-12 rounded-full shrink-0" style={{ backgroundColor: kpi.color }} />
            <div>
              <p className="text-xs text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{kpi.label}</p>
              <p className="text-xl font-bold text-[#0E1C36]" style={{ fontFamily: fontHeading(ar) }}>{kpi.value}</p>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full" style={{ fontFamily: fontBody(ar) }}>{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DDD0]">
          <h3 className="text-base font-bold text-[#0E1C36] mb-5" style={{ fontFamily: fontHeading(ar) }}>
            {t(ar, "اتجاه الزوار السنوي", "Annual Visitor Trends")}
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ag3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0E1C36" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0E1C36" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#7A6B55", fontFamily: fontBody(ar) }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#7A6B55", fontFamily: fontBody(ar) }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}${ar ? " ألف" : "K"}`} />
              <Tooltip contentStyle={adminTooltipStyle(ar)} />
              <Area type="monotone" dataKey="visitors" name={t(ar, "الزوار", "Visitors")} stroke="#0E1C36" strokeWidth={2.5} fill="url(#ag3)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DDD0]">
          <h3 className="text-base font-bold text-[#0E1C36] mb-5" style={{ fontFamily: fontHeading(ar) }}>
            {t(ar, "ترتيب شعبية المعالم", "Attraction Popularity Rank")}
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={popData} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#7A6B55", fontFamily: fontBody(ar) }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={ar ? 80 : 65} tick={{ fontSize: 11, fill: "#7A6B55", fontFamily: fontBody(ar) }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={adminTooltipStyle(ar)} />
              <Bar dataKey="visits" name={t(ar, "الزيارات", "Visits")} radius={[0, 6, 6, 0]}>
                {popData.map((_, i) => <Cell key={i} fill={i === 0 ? "#C4912A" : "#0E1C36"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AdminFeedback({ ar }: { ar: boolean }) {
  const { reviews } = useTourism();
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
    : "—";
  const fiveStarPct = reviews.length
    ? `${Math.round((reviews.filter((r) => r.rating === 5).length / reviews.length) * 100)}${ar ? "٪" : "%"}`
    : "—";

  const stats = [
    { label: t(ar, "إجمالي التقييمات", "Total Reviews"), value: String(reviews.length), icon: <MessageSquare size={18} /> },
    { label: t(ar, "متوسط التقييم", "Average Rating"), value: `${avgRating} ★`, icon: <Star size={18} /> },
    { label: t(ar, "تقييمات ٥ نجوم", "5-Star Reviews"), value: fiveStarPct, icon: <Award size={18} /> },
  ];

  return (
    <div className="p-8 space-y-5 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-[#0E1C36]" style={{ fontFamily: fontHeading(ar) }}>
          {t(ar, "تقييمات الزوار", "User Feedback")}
        </h2>
        <p className="text-sm text-[#7A6B55] mt-0.5" style={{ fontFamily: fontBody(ar) }}>
          {t(ar, "آراء وتقييمات زوار المنصة", "Reviews and ratings from platform visitors")}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8DDD0] flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#C4912A]/15 flex items-center justify-center text-[#C4912A]">{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-[#0E1C36]" style={{ fontFamily: fontHeading(ar) }}>{s.value}</p>
              <p className="text-sm text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8DDD0] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8DDD0] flex items-center justify-between">
          <span className="text-base font-bold text-[#0E1C36]" style={{ fontFamily: fontHeading(ar) }}>
            {t(ar, "جميع التقييمات", "All Reviews")}
          </span>
          <div className="flex items-center gap-2 bg-[#F6EFE3] border border-[#E8DDD0] rounded-xl px-3 py-2">
            <Search size={14} className="text-[#7A6B55]" />
            <input placeholder={t(ar, "ابحث في التقييمات...", "Search reviews...")} className="text-sm outline-none bg-transparent text-[#0E1C36] placeholder-[#7A6B55] w-36" style={{ fontFamily: fontBody(ar) }} />
          </div>
        </div>
        {reviews.map((f, i) => (
          <div key={f.id} className={`px-6 py-5 flex items-start gap-4 hover:bg-[#F6EFE3]/60 transition-colors ${i < reviews.length - 1 ? "border-b border-[#E8DDD0]" : ""}`}>
            <div className="w-10 h-10 rounded-full bg-[#0E1C36] flex items-center justify-center shrink-0">
              <span className="text-sm text-white font-bold">{f.user[0]}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#0E1C36]" style={{ fontFamily: fontBody(ar) }}>{f.user}</p>
                  <p className="text-xs text-[#C4912A] mt-0.5" style={{ fontFamily: fontBody(ar) }}>{f.place}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Stars rating={f.rating} size={12} />
                  <span className="text-[10px] text-[#7A6B55]" style={{ fontFamily: fontBody(ar) }}>{f.date}</span>
                </div>
              </div>
              <p className="text-sm text-[#7A6B55] mt-2 leading-relaxed" style={{ fontFamily: fontBody(ar) }}>{f.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────

function AuthButton({ lang }: { lang: string }) {
  const ar = lang === "ar";
  const { user, login, logout } = useTourism();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (user) {
    return (
      <button onClick={() => logout()} className="text-[10px] text-white/50 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
        {user.username} · {ar ? "خروج" : "Sign out"}
      </button>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[10px] text-[#C4912A] border border-[#C4912A]/40 px-2 py-1 rounded-lg hover:bg-[#C4912A]/10 transition-colors" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
        {ar ? "تسجيل الدخول" : "Sign in"}
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()} dir={ar ? "rtl" : "ltr"}>
            <h3 className="text-lg font-bold text-[#0E1C36] mb-4" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
              {ar ? "تسجيل الدخول" : "Sign In"}
            </h3>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={ar ? "اسم المستخدم" : "Username"}
              className="w-full mb-3 rounded-xl border border-[#E8DDD0] px-4 py-2.5 text-sm outline-none focus:border-[#C4912A]" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={ar ? "كلمة المرور" : "Password"}
              className="w-full mb-4 rounded-xl border border-[#E8DDD0] px-4 py-2.5 text-sm outline-none focus:border-[#C4912A]" />
            <button onClick={async () => { try { await login(username, password); setOpen(false); } catch { alert(ar ? "بيانات الدخول غير صحيحة" : "Invalid credentials"); } }}
              className="w-full bg-[#C4912A] hover:bg-[#B07F24] text-white py-2.5 rounded-xl text-sm font-semibold">
              {ar ? "دخول" : "Sign In"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [mode, setMode] = useState<"visitor" | "admin">("visitor");
  const [lang, setLang] = useState<string>("ar");
  const ar = lang === "ar";

  useEffect(() => {
    applyDocumentLocale(lang);
  }, [lang]);

  return (
    <TourismProvider lang={lang}>
    <div className="min-h-screen bg-[#F6EFE3]" dir={ar ? "rtl" : "ltr"}>
      {/* Platform top bar */}
      <header className="bg-[#0A1428] h-14 flex items-center px-6 gap-4 sticky top-0 z-50 shadow-2xl" dir={ar ? "rtl" : "ltr"}>
        <div className="flex items-center gap-2.5 me-auto">
          <div className="w-7 h-7 rounded-lg bg-[#C4912A] flex items-center justify-center">
            <MapPin size={13} className="text-white" />
          </div>
          <span className="text-white text-sm font-bold" style={{ fontFamily: fontHeading(ar) }}>
            {t(ar, "جادة حائل", "Jadah Hail")}
          </span>
          {ar && (
            <span className="text-white/50 text-xs hidden sm:inline" style={{ fontFamily: fontBody(ar) }}>
              منصة السياحة الذكية
            </span>
          )}
          {!ar && (
            <span className="text-white/30 text-xs hidden sm:inline" style={{ fontFamily: fontBody(ar) }}>
              Smart Tourism Platform
            </span>
          )}
        </div>
        <div className="flex items-center bg-white/8 rounded-xl p-1 gap-1">
          <button onClick={() => setMode("visitor")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === "visitor" ? "bg-[#C4912A] text-white" : "text-white/50 hover:text-white"}`}
            style={{ fontFamily: fontBody(ar) }}>
            {t(ar, "🗺 بوابة الزوار", "🗺 Visitor Portal")}
          </button>
          <button onClick={() => setMode("admin")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === "admin" ? "bg-[#C4912A] text-white" : "text-white/50 hover:text-white"}`}
            style={{ fontFamily: fontBody(ar) }}>
            {t(ar, "⚙️ لوحة الإدارة", "⚙️ Admin Dashboard")}
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 ps-4 border-s border-white/10">
          <AuthButton lang={lang} />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-white/30" style={{ fontFamily: fontBody(ar) }}>
            {t(ar, "مباشر · أمانة حائل", "Live · Hail Municipality")}
          </span>
        </div>
      </header>

      {mode === "admin" ? (
        <AdminDashboard lang={lang} />
      ) : (
        <VisitorPlatform lang={lang} setLang={setLang} />
      )}
    </div>
    </TourismProvider>
  );
}
