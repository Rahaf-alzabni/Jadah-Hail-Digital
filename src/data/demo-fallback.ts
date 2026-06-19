import type { Event, TouristPlace, TouristRoute } from '@/api/types';
import { mapEvent, mapPlace, mapRoute, type UIReview } from '@/lib/mappers';

/** Wikimedia URLs — work on static GitHub Pages without a backend */
const IMAGES = {
  jubbah:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/ISS-64_Jubba_with_Nefud_Desert%2C_Saudi_Arabia.jpg/1280px-ISS-64_Jubba_with_Nefud_Desert%2C_Saudi_Arabia.jpg',
  zaabal:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Hail_City%2C_Saudi_Arabia.jpg/1280px-Hail_City%2C_Saudi_Arabia.jpg',
  aja:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Hail_Saudi_Arabia_Mountains.jpg/1280px-Hail_Saudi_Arabia_Mountains.jpg',
  khaybar: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/%D8%AD%D8%B1%D8%A9_%D8%AE%D9%8A%D8%A8%D8%B1.jpg',
  qishlah:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Qishlah_2.jpg/1280px-Qishlah_2.jpg',
  camel:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Camel_racing_%28Saudi_Arabia%29.jpg/1280px-Camel_racing_%28Saudi_Arabia%29.jpg',
} as const;

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const DEMO_PLACES: TouristPlace[] = [
  {
    id: 1,
    name_ar: 'نقوش جبيل الحائر',
    name_en: 'Jubbah Petroglyphs',
    description: 'UNESCO World Heritage site at Jubbah featuring rock art dating back 10,000 years.',
    description_ar: 'موقع تراث عالمي لليونسكو في جبّة يضم نقوشاً صخرية يعود تاريخها إلى عشرة آلاف سنة.',
    category: 'historical',
    image: IMAGES.jubbah,
    latitude: 28.03,
    longitude: 40.92,
    visiting_hours: '7:00 – 19:00',
    visiting_hours_ar: '٧:٠٠ – ١٩:٠٠',
    created_at: '2025-01-01T00:00:00Z',
    average_rating: 4.8,
    review_count: 24,
    is_favorited: false,
  },
  {
    id: 2,
    name_ar: 'قصر زعبل',
    name_en: 'Qasr Zaabal',
    description: 'Ancient fortress perched atop a volcanic rock formation rising above Hail city.',
    description_ar: 'قلعة أثرية على قمة صخرية بركانية تطل على مدينة حائل.',
    category: 'historical',
    image: IMAGES.zaabal,
    latitude: 27.54,
    longitude: 41.71,
    visiting_hours: '8:00 – 18:00',
    visiting_hours_ar: '٨:٠٠ – ١٨:٠٠',
    created_at: '2025-01-01T00:00:00Z',
    average_rating: 4.6,
    review_count: 18,
    is_favorited: false,
  },
  {
    id: 3,
    name_ar: 'جبل أجا',
    name_en: 'Aja Mountain',
    description: 'Iconic granite massif within Hail city with hiking trails and panoramic views.',
    description_ar: 'كتلة جرانيتية شهيرة داخل مدينة حائل مع مسارات مشي وإطلالات بانورامية.',
    category: 'natural',
    image: IMAGES.aja,
    latitude: 27.56,
    longitude: 41.62,
    visiting_hours: 'Open 24h',
    visiting_hours_ar: 'مفتوح على مدار الساعة',
    created_at: '2025-01-01T00:00:00Z',
    average_rating: 4.7,
    review_count: 31,
    is_favorited: false,
  },
  {
    id: 4,
    name_ar: 'حرة خيبر',
    name_en: 'Harrat Khaybar',
    description: 'One of the largest volcanic fields with dramatic basalt lava flows.',
    description_ar: 'من أكبر الحقول البركانية مع تدفقات بازلتية مذهلة.',
    category: 'natural',
    image: IMAGES.khaybar,
    latitude: 25.7,
    longitude: 39.9,
    visiting_hours: 'Daylight only',
    visiting_hours_ar: 'خلال النهار فقط',
    created_at: '2025-01-01T00:00:00Z',
    average_rating: 4.5,
    review_count: 12,
    is_favorited: false,
  },
  {
    id: 5,
    name_ar: 'قصر القشلة',
    name_en: 'Al-Qishlah Palace',
    description: 'Regional heritage museum housing traditional Hail artifacts and manuscripts.',
    description_ar: 'متحف تراثي يضم مقتنيات حائل التقليدية والمخطوطات.',
    category: 'cultural',
    image: IMAGES.qishlah,
    latitude: 27.51,
    longitude: 41.68,
    visiting_hours: '9:00 – 17:00',
    visiting_hours_ar: '٩:٠٠ – ١٧:٠٠',
    created_at: '2025-01-01T00:00:00Z',
    average_rating: 4.4,
    review_count: 15,
    is_favorited: false,
  },
  {
    id: 6,
    name_ar: 'جبل سلمى',
    name_en: 'Salma Mountain',
    description: 'Sister peak to Aja Mountain with granite ridges and desert panoramas.',
    description_ar: 'قمة شقيقة لجبل أجا بسلاسل جرانيتية وإطلالات صحراوية.',
    category: 'natural',
    image: IMAGES.aja,
    latitude: 27.6,
    longitude: 41.5,
    visiting_hours: 'Open 24h',
    visiting_hours_ar: 'مفتوح على مدار الساعة',
    created_at: '2025-01-01T00:00:00Z',
    average_rating: 4.3,
    review_count: 9,
    is_favorited: false,
  },
];

const DEMO_EVENTS: Event[] = [
  {
    id: 1,
    title_ar: 'سباق الهجن الدولي بحائل',
    title_en: 'Hail International Camel Race',
    description: 'Annual camel racing festival attracting visitors from across the region.',
    description_ar: 'مهرجان سنوي لسباقات الهجن يجذب زواراً من مختلف المناطق.',
    image: IMAGES.camel,
    location: 'Camel Racing Track, Hail',
    location_ar: 'ميدان سباق الهجن، حائل',
    start_date: daysFromNow(14),
    end_date: daysFromNow(20),
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    title_ar: 'مهرجان التراث الحائلي',
    title_en: 'Hail Heritage Festival',
    description: 'Celebration of Hail heritage with crafts, music, and traditional food.',
    description_ar: 'احتفاء بتراث حائل مع الحرف والموسيقى والأطعمة التقليدية.',
    image: IMAGES.qishlah,
    location: 'Al-Qishlah Palace',
    location_ar: 'قصر القشلة',
    start_date: daysFromNow(35),
    end_date: daysFromNow(45),
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 3,
    title_ar: 'موسم وردة الصحراء',
    title_en: 'Desert Rose Season',
    description: 'Spring cultural season at Aja Mountain with outdoor activities.',
    description_ar: 'موسم ثقافي ربيعي عند جبل أجا مع أنشطة في الهواء الطلق.',
    image: IMAGES.aja,
    location: 'Aja Mountain',
    location_ar: 'جبل أجا',
    start_date: daysFromNow(60),
    end_date: daysFromNow(70),
    created_at: '2025-01-01T00:00:00Z',
  },
];

const DEMO_ROUTES: TouristRoute[] = [
  {
    id: 1,
    name: 'Heritage Trail',
    name_ar: 'مسار التراث',
    description: "A full-day route covering Hail's most iconic heritage landmarks.",
    description_ar: 'مسار ليوم كامل يشمل أبرز معالم حائل التراثية.',
    duration: 'Full day',
    difficulty: 'easy',
    places: DEMO_PLACES.filter((p) => [1, 2, 5].includes(p.id)).map((p) => ({
      id: p.id,
      name_ar: p.name_ar,
      name_en: p.name_en,
      category: p.category,
      image: p.image,
    })),
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Nature Explorer',
    name_ar: 'مستكشف الطبيعة',
    description: "Two-day itinerary through Hail's natural wonders.",
    description_ar: 'برنامج ليومين عبر عجائب حائل الطبيعية.',
    duration: '2 days',
    difficulty: 'moderate',
    places: DEMO_PLACES.filter((p) => [3, 4, 6].includes(p.id)).map((p) => ({
      id: p.id,
      name_ar: p.name_ar,
      name_en: p.name_en,
      category: p.category,
      image: p.image,
    })),
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Ancient Kingdoms',
    name_ar: 'الممالك القديمة',
    description: 'Extended route linking historical and volcanic sites.',
    description_ar: 'مسار ممتد يربط المواقع التاريخية والبركانية.',
    duration: '3 days',
    difficulty: 'hard',
    places: DEMO_PLACES.filter((p) => [1, 2, 3, 4].includes(p.id)).map((p) => ({
      id: p.id,
      name_ar: p.name_ar,
      name_en: p.name_en,
      category: p.category,
      image: p.image,
    })),
    created_at: '2025-01-01T00:00:00Z',
  },
];

export function getDemoFallback() {
  return {
    attractions: DEMO_PLACES.map((p, i) => mapPlace(p, i)),
    events: DEMO_EVENTS.map((e, i) => mapEvent(e, i)),
    routes: DEMO_ROUTES.map((r, i) => mapRoute(r, i)),
    reviews: [] as UIReview[],
  };
}
