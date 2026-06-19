import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { resolveMediaUrl } from '@/api/client';
import { translateDuration, translateHours, formatCount } from '@/lib/locale';
import type { Event, Review, TouristPlace, TouristRoute } from '@/api/types';

const PLACEHOLDER_IMAGES: Record<string, string> = {
  historical: 'https://images.unsplash.com/photo-1643892150764-75ee9a645f6e?w=800&h=500&fit=crop&auto=format',
  natural: 'https://images.unsplash.com/photo-1551031749-9257c3aee0df?w=800&h=500&fit=crop&auto=format',
  cultural: 'https://images.unsplash.com/photo-1635200487290-f91d14f64bd3?w=800&h=500&fit=crop&auto=format',
  entertainment: 'https://images.unsplash.com/photo-1766135657062-c297dee9a9fd?w=800&h=500&fit=crop&auto=format',
  religious: 'https://images.unsplash.com/photo-1682687221175-fd40bbafe6ca?w=800&h=500&fit=crop&auto=format',
  default: 'https://images.unsplash.com/photo-1778533643586-055aef2ffbc2?w=800&h=500&fit=crop&auto=format',
};

/** Hail landmark images — Wikimedia works on static hosting; /media used when API is live */
export const HAIL_PLACE_IMAGES: Record<string, string> = {
  'Jubbah Petroglyphs':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/ISS-64_Jubba_with_Nefud_Desert%2C_Saudi_Arabia.jpg/1280px-ISS-64_Jubba_with_Nefud_Desert%2C_Saudi_Arabia.jpg',
  'Qasr Zaabal':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Hail_City%2C_Saudi_Arabia.jpg/1280px-Hail_City%2C_Saudi_Arabia.jpg',
  'Aja Mountain':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Hail_Saudi_Arabia_Mountains.jpg/1280px-Hail_Saudi_Arabia_Mountains.jpg',
  'Harrat Khaybar':
    'https://upload.wikimedia.org/wikipedia/commons/4/4c/%D8%AD%D8%B1%D8%A9_%D8%AE%D9%8A%D8%A8%D8%B1.jpg',
  'Al-Qishlah Palace':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Qishlah_2.jpg/1280px-Qishlah_2.jpg',
  'Salma Mountain':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Hail_Saudi_Arabia_Mountains.jpg/1280px-Hail_Saudi_Arabia_Mountains.jpg',
};

export const HAIL_EVENT_IMAGES: Record<string, string> = {
  'Hail International Camel Race':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Camel_racing_%28Saudi_Arabia%29.jpg/1280px-Camel_racing_%28Saudi_Arabia%29.jpg',
  'Hail Heritage Festival':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Qishlah_2.jpg/1280px-Qishlah_2.jpg',
  'Desert Rose Season':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Hail_Saudi_Arabia_Mountains.jpg/1280px-Hail_Saudi_Arabia_Mountains.jpg',
};

export const CATEGORY_META: Record<string, { en: string; ar: string; icon: string; apiKey: string }> = {
  historical: { en: 'Historical', ar: 'تراثي', icon: '🏛️', apiKey: 'historical' },
  natural: { en: 'Natural', ar: 'طبيعي', icon: '⛰️', apiKey: 'natural' },
  cultural: { en: 'Culture', ar: 'ثقافي', icon: '🏺', apiKey: 'cultural' },
  entertainment: { en: 'Entertainment', ar: 'ترفيهي', icon: '🎪', apiKey: 'entertainment' },
  religious: { en: 'Religious', ar: 'ديني', icon: '🕌', apiKey: 'religious' },
};

const EVENT_COLORS = ['#C4912A', '#2E7D32', '#1565C0', '#6A1B9A', '#5D1A1A'];
const ROUTE_COLORS = ['#C4912A', '#2E7D32', '#6A1B9A'];

export interface UIAttraction {
  id: number;
  nameEn: string;
  nameAr: string;
  catEn: string;
  catAr: string;
  categoryKey: string;
  rating: number;
  reviews: number;
  distanceEn: string;
  distanceAr: string;
  hours: string;
  hoursAr: string;
  image: string;
  descEn: string;
  descAr: string;
  featured: boolean;
  latitude: number;
  longitude: number;
  isFavorited: boolean;
}

export interface UIEvent {
  id: number;
  titleEn: string;
  titleAr: string;
  dateEn: string;
  dateAr: string;
  locationEn: string;
  locationAr: string;
  color: string;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
}

export interface UIRoute {
  id: number;
  nameEn: string;
  nameAr: string;
  durationEn: string;
  durationAr: string;
  stopsEn: string;
  stopsAr: string;
  diffEn: string;
  diffAr: string;
  color: string;
  descriptionEn: string;
  descriptionAr: string;
  placeIds: number[];
}

export interface UIReview {
  id: number;
  user: string;
  place: string;
  placeId: number;
  rating: number;
  text: string;
  date: string;
}

function placeImage(place: TouristPlace): string {
  const resolved = resolveMediaUrl(place.image);
  if (resolved) return resolved;
  return HAIL_PLACE_IMAGES[place.name_en]
    || PLACEHOLDER_IMAGES[place.category]
    || PLACEHOLDER_IMAGES.default;
}

function formatCoords(lat: number, lng: number, ar: boolean): string {
  if (ar) {
    return `${lat.toFixed(2)}° شمالاً، ${lng.toFixed(2)}° شرقاً`;
  }
  return `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`;
}

export function mapPlace(place: TouristPlace, index: number): UIAttraction {
  const meta = CATEGORY_META[place.category] ?? { en: place.category, ar: place.category, icon: '📍', apiKey: place.category };
  const defaultHours = place.category === 'natural' ? 'Open 24h' : '9:00 – 17:00';
  const hoursEn = place.visiting_hours || defaultHours;
  const hoursAr = place.visiting_hours_ar || translateHours(hoursEn, true);

  return {
    id: place.id,
    nameEn: place.name_en,
    nameAr: place.name_ar,
    catEn: meta.en,
    catAr: meta.ar,
    categoryKey: place.category,
    rating: place.average_rating ?? 0,
    reviews: place.review_count,
    distanceEn: formatCoords(place.latitude, place.longitude, false),
    distanceAr: formatCoords(place.latitude, place.longitude, true),
    hours: hoursEn,
    hoursAr,
    image: placeImage(place),
    descEn: place.description,
    descAr: place.description_ar || place.description,
    featured: index < 3 || (place.average_rating ?? 0) >= 4.7,
    latitude: place.latitude,
    longitude: place.longitude,
    isFavorited: place.is_favorited,
  };
}

export function pickPlace(place: UIAttraction, ar: boolean) {
  return {
    name: ar ? place.nameAr : place.nameEn,
    desc: ar ? place.descAr : place.descEn,
    cat: ar ? place.catAr : place.catEn,
    hours: ar ? place.hoursAr : place.hours,
    distance: ar ? place.distanceAr : place.distanceEn,
  };
}

export function mapEvent(event: Event, index: number): UIEvent {
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  const sameDay = start.toDateString() === end.toDateString();
  const dateEn = sameDay
    ? format(start, 'MMM d, yyyy', { locale: enUS })
    : `${format(start, 'MMM d', { locale: enUS })} – ${format(end, 'MMM d, yyyy', { locale: enUS })}`;
  const dateAr = sameDay
    ? format(start, 'd MMMM yyyy', { locale: arSA })
    : `${format(start, 'd MMMM', { locale: arSA })} – ${format(end, 'd MMMM yyyy', { locale: arSA })}`;

  return {
    id: event.id,
    titleEn: event.title_en,
    titleAr: event.title_ar,
    dateEn,
    dateAr,
    locationEn: event.location,
    locationAr: event.location_ar || event.location,
    color: EVENT_COLORS[index % EVENT_COLORS.length],
    descriptionEn: event.description,
    descriptionAr: event.description_ar || event.description,
    image: resolveMediaUrl(event.image) || HAIL_EVENT_IMAGES[event.title_en] || PLACEHOLDER_IMAGES.cultural,
  };
}

const DIFFICULTY_LABELS: Record<string, { en: string; ar: string }> = {
  easy: { en: 'Easy', ar: 'سهل' },
  moderate: { en: 'Moderate', ar: 'متوسط' },
  hard: { en: 'Challenging', ar: 'متحدٍّ' },
};

export function mapRoute(route: TouristRoute, index: number): UIRoute {
  const diff = DIFFICULTY_LABELS[route.difficulty] ?? { en: route.difficulty, ar: route.difficulty };
  const stopCount = route.places.length;
  const durationAr = translateDuration(route.duration, true);

  return {
    id: route.id,
    nameEn: route.name,
    nameAr: route.name_ar || route.name,
    durationEn: route.duration,
    durationAr,
    stopsEn: `${stopCount} stops`,
    stopsAr: `${formatCount(stopCount, true)} محطات`,
    diffEn: diff.en,
    diffAr: diff.ar,
    color: ROUTE_COLORS[index % ROUTE_COLORS.length],
    descriptionEn: route.description,
    descriptionAr: route.description_ar || route.description,
    placeIds: route.places.map((p) => p.id),
  };
}

export function mapReview(review: Review, ar: boolean): UIReview {
  return {
    id: review.id,
    user: review.username,
    place: ar ? (review.place_name_ar || review.place_name) : review.place_name,
    placeId: review.tourist_place,
    rating: review.rating,
    text: review.comment,
    date: ar
      ? format(new Date(review.created_at), 'd MMM yyyy', { locale: arSA })
      : format(new Date(review.created_at), 'MMM d, yyyy', { locale: enUS }),
  };
}

export function getRoutePlaceImages(route: UIRoute, attractions: UIAttraction[]): string[] {
  return route.placeIds
    .map((id) => attractions.find((a) => a.id === id)?.image)
    .filter(Boolean)
    .slice(0, 4) as string[];
}

export function pickEvent(event: UIEvent, ar: boolean) {
  return {
    title: ar ? event.titleAr : event.titleEn,
    date: ar ? event.dateAr : event.dateEn,
    location: ar ? event.locationAr : event.locationEn,
    description: ar ? event.descriptionAr : event.descriptionEn,
  };
}

export function pickRoute(route: UIRoute, ar: boolean) {
  return {
    name: ar ? route.nameAr : route.nameEn,
    duration: ar ? route.durationAr : route.durationEn,
    stops: ar ? route.stopsAr : route.stopsEn,
    diff: ar ? route.diffAr : route.diffEn,
    description: ar ? route.descriptionAr : route.descriptionEn,
  };
}
