import { fetchAllPages } from './client';
import type { Event } from './types';

export function getEvents(params?: { upcoming?: boolean; search?: string }) {
  const query = new URLSearchParams();
  if (params?.upcoming) query.set('upcoming', 'true');
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  return fetchAllPages<Event>(`/api/v1/events/${qs ? `?${qs}` : ''}`);
}
