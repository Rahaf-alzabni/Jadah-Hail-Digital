import { api } from './client';
import type { AuthUser } from './types';

export function initCsrf() {
  return api.get<{ detail: string }>('/api/v1/auth/csrf/');
}

export function getMe() {
  return api.get<AuthUser>('/api/v1/auth/me/');
}

export function login(username: string, password: string) {
  return api.post<AuthUser>('/api/v1/auth/login/', { username, password });
}

export function logout() {
  return api.post<{ detail: string }>('/api/v1/auth/logout/', {});
}
