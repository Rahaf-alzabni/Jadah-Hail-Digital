export function isArabic(lang: string): boolean {
  return lang === 'ar';
}

export function fontBody(ar: boolean): string {
  return ar ? "'Noto Naskh Arabic', sans-serif" : "'Inter', sans-serif";
}

export function fontHeading(ar: boolean): string {
  return ar ? "'Noto Naskh Arabic', sans-serif" : "'Playfair Display', serif";
}

export function t(ar: boolean, arText: string, enText: string): string {
  return ar ? arText : enText;
}

export function formatCount(n: number, ar: boolean): string {
  return ar ? n.toLocaleString('ar-SA') : n.toLocaleString('en-US');
}

export function formatReviews(count: number, ar: boolean): string {
  const n = formatCount(count, ar);
  return ar ? `${n} تقييم` : `${n} reviews`;
}

export function formatVisitors(count: number, ar: boolean): string {
  const n = formatCount(count, ar);
  return ar ? `${n} زائر` : `${n} visitors`;
}

const HOURS_MAP: Record<string, string> = {
  'Open 24h': 'مفتوح على مدار الساعة',
  'Daylight only': 'خلال ساعات النهار',
  '7:00 – 19:00': '٧:٠٠ – ١٩:٠٠',
  '8:00 – 18:00': '٨:٠٠ – ١٨:٠٠',
  '9:00 – 17:00': '٩:٠٠ – ١٧:٠٠',
  'Full day': 'يوم كامل',
  '2 days': 'يومان',
  '3 days': '٣ أيام',
};

export function translateHours(hours: string, ar: boolean): string {
  if (!ar || !hours) return hours;
  return HOURS_MAP[hours.trim()] ?? hours;
}

export function translateDuration(duration: string, ar: boolean): string {
  return translateHours(duration, ar);
}

export function applyDocumentLocale(lang: string): void {
  const ar = isArabic(lang);
  document.documentElement.lang = ar ? 'ar' : 'en';
  document.documentElement.dir = ar ? 'rtl' : 'ltr';
  document.title = ar ? 'جادة حائل — منصة السياحة الذكية' : 'Jadah Hail — Smart Tourism Platform';
}
