import { api } from './client';
import type { TouristPlace } from './types';

export function getFavorites() {
  return api.get<Array<Pick<TouristPlace, 'id' | 'name_ar' | 'name_en' | 'category' | 'image'>>>('/api/v1/favorites/');
}

export function addFavorite(placeId: number) {
  return api.post<Pick<TouristPlace, 'id' | 'name_ar' | 'name_en' | 'category' | 'image'>>('/api/v1/favorites/', { place_id: placeId });
}

export function removeFavorite(placeId: number) {
  return api.delete(`/api/v1/favorites/${placeId}/`);
}

export function toggleFavorite(placeId: number) {
  return api.post<{ is_favorited: boolean }>(`/api/v1/favorites/${placeId}/toggle/`, {});
}
