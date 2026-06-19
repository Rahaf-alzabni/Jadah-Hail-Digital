import { api, fetchAllPages } from './client';
import type { Review, TouristPlace, TouristRoute } from './types';

export function getPlaces(params?: { category?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  return fetchAllPages<TouristPlace>(`/api/v1/places/${qs ? `?${qs}` : ''}`);
}

export function getPlace(id: number) {
  return api.get<TouristPlace>(`/api/v1/places/${id}/`);
}

export function getRoutes(params?: { difficulty?: string }) {
  const query = params?.difficulty ? `?difficulty=${params.difficulty}` : '';
  return fetchAllPages<TouristRoute>(`/api/v1/routes/${query}`);
}

export function getReviews(placeId?: number) {
  const query = placeId ? `?place=${placeId}` : '';
  return fetchAllPages<Review>(`/api/v1/reviews/${query}`);
}

export function createReview(data: { tourist_place: number; rating: number; comment: string }) {
  return api.post<Review>('/api/v1/reviews/', data);
}

export function deleteReview(id: number) {
  return api.delete(`/api/v1/reviews/${id}/`);
}
