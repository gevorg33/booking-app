import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonSpinner, IonText } from '@ionic/react';
import { sparklesOutline } from 'ionicons/icons';
import { useOperationalEvents } from '../lib/use-operational-events';
import { useOnlineStatus } from '../lib/use-online-status';
import {
  loadSuggestionsCache,
  type CachedAiSuggestion,
} from '../lib/provider-ai-suggestions-cache.util';
import {
  fetchProviderAiSuggestions,
  shouldShowStaleSuggestionsBanner,
} from '../lib/provider-ai-suggestions-query.util';
import { useI18n } from '../i18n';

interface ProviderAiSuggestionsProps {
  businessId: string;
  onSelectPrompt: (prompt: string) => void;
}

const REFRESH_TYPES = new Set([
  'booking.created',
  'booking.updated',
  'booking.cancelled',
  'booking.completed',
  'booking.rescheduled',
  'availability.updated',
]);

export default function ProviderAiSuggestions({ businessId, onSelectPrompt }: ProviderAiSuggestionsProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const cachedSuggestions = useMemo(
    () => loadSuggestionsCache(businessId),
    [businessId, online],
  );

  const { data: suggestions = [], isLoading, isError } = useQuery({
    queryKey: ['provider-ai-suggestions', businessId],
    queryFn: () => fetchProviderAiSuggestions(businessId),
    enabled: !!businessId && online,
    placeholderData: cachedSuggestions.length ? cachedSuggestions : undefined,
    staleTime: 60_000,
  });

  const displaySuggestions = suggestions.length ? suggestions : cachedSuggestions;
  const showStaleBanner = shouldShowStaleSuggestionsBanner(
    online,
    isError,
    cachedSuggestions.length > 0,
    displaySuggestions.length > 0,
  );
  const waitingForFresh = online && isLoading && !displaySuggestions.length;

  const onOperationalEvent = useCallback(
    (type: string) => {
      if (REFRESH_TYPES.has(type) && online) {
        void queryClient.invalidateQueries({ queryKey: ['provider-ai-suggestions', businessId] });
      }
    },
    [businessId, online, queryClient],
  );

  useOperationalEvents(businessId, onOperationalEvent);

  if (waitingForFresh) {
    return (
      <IonCard className="ai-suggestions-card ion-margin-bottom">
        <IonCardContent className="empty-state">
          <IonSpinner />
        </IonCardContent>
      </IonCard>
    );
  }

  if (!displaySuggestions.length) return null;

  return (
    <IonCard className="ai-suggestions-card ion-margin-bottom">
      <IonCardHeader>
        <IonCardTitle className="ai-suggestions-card__title">
          <IonIcon icon={sparklesOutline} />
          {t('provider.suggestionsTitle')}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {showStaleBanner && (
          <IonText color="medium">
            <p className="booking-meta ai-suggestions-stale-hint">
              {t('provider.offlineSuggestionsStale')}{' '}
              {!online ? t('provider.offlineRefreshWhenOnline') : ''}
            </p>
          </IonText>
        )}
        <div className="ai-suggestions-list">
          {displaySuggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`ai-suggestion-chip ai-suggestion-chip--${s.priority}`}
              onClick={() => onSelectPrompt(s.prompt)}
            >
              <span className="ai-suggestion-chip__title">{s.title}</span>
              <span className="ai-suggestion-chip__hint">{t('provider.suggestionsTapToRun')}</span>
            </button>
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  );
}
