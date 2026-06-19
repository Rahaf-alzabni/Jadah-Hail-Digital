import { api } from './client';

export interface AssistantOption {
  id: number;
  prompt_ar: string;
  prompt_en: string;
  category: string;
}

export interface AssistantConfig {
  welcome_ar: string;
  welcome_en: string;
  fallback_ar: string;
  fallback_en: string;
  options: AssistantOption[];
}

export interface AssistantAnswer {
  prompt_ar?: string;
  prompt_en?: string;
  response_ar: string;
  response_en: string;
  matched: boolean;
}

export function getAssistantConfig() {
  return api.get<AssistantConfig>('/api/v1/assistant/');
}

export function askAssistant(payload: { option_id?: number; message?: string }) {
  return api.post<AssistantAnswer>('/api/v1/assistant/ask/', payload);
}
