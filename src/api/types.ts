export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TouristPlace {
  id: number;
  name_ar: string;
  name_en: string;
  description: string;
  description_ar?: string;
  category: string;
  image: string | null;
  latitude: number;
  longitude: number;
  visiting_hours: string;
  visiting_hours_ar?: string;
  created_at: string;
  average_rating: number | null;
  review_count: number;
  is_favorited: boolean;
}

export interface TouristRoute {
  id: number;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  duration: string;
  difficulty: string;
  places: Array<{
    id: number;
    name_ar: string;
    name_en: string;
    category: string;
    image: string | null;
  }>;
  created_at: string;
}

export interface Event {
  id: number;
  title_ar: string;
  title_en: string;
  description: string;
  description_ar?: string;
  image: string | null;
  location: string;
  location_ar?: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface Review {
  id: number;
  user: number;
  username: string;
  tourist_place: number;
  place_name: string;
  place_name_ar?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface AuthUser {
  authenticated: boolean;
  username?: string;
}
