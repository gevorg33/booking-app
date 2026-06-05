import api, { unwrap } from '../services/api';
import {
  saveSuggestionsCache,
  type CachedAiSuggestion,
} from './provider-ai-suggestions-cache.util';

export async function fetchProviderAiSuggestions(
  businessId: string,
): Promise<CachedAiSuggestion[]> {
  const { data: res } = await api.get(`/businesses/${businessId}/provider/ai/suggestions`);
  const fresh = unwrap<CachedAiSuggestion[]>(res);
  saveSuggestionsCache(businessId, fresh);
  return fresh;
}

export function shouldShowStaleSuggestionsBanner(
  online: boolean,
  isError: boolean,
  hasCached: boolean,
  hasDisplay: boolean,
): boolean {
  return hasDisplay && (!online || (isError && hasCached));
}
