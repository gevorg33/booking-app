import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonSpinner } from '@ionic/react';
import { sparklesOutline } from 'ionicons/icons';
import api, { unwrap } from '../services/api';
import { useOperationalEvents } from '../lib/use-operational-events';

interface AiSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  prompt: string;
  category: string;
}

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
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['provider-ai-suggestions', businessId],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${businessId}/provider/ai/suggestions`);
      return unwrap<AiSuggestion[]>(res);
    },
    enabled: !!businessId,
    staleTime: 60_000,
  });

  const onOperationalEvent = useCallback(
    (type: string) => {
      if (REFRESH_TYPES.has(type)) {
        void queryClient.invalidateQueries({ queryKey: ['provider-ai-suggestions', businessId] });
      }
    },
    [businessId, queryClient],
  );

  useOperationalEvents(businessId, onOperationalEvent);

  if (isLoading) {
    return (
      <IonCard className="ai-suggestions-card ion-margin-bottom">
        <IonCardContent className="empty-state">
          <IonSpinner />
        </IonCardContent>
      </IonCard>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <IonCard className="ai-suggestions-card ion-margin-bottom">
      <IonCardHeader>
        <IonCardTitle className="ai-suggestions-card__title">
          <IonIcon icon={sparklesOutline} />
          AI suggestions
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="ai-suggestions-list">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`ai-suggestion-chip ai-suggestion-chip--${s.priority}`}
              onClick={() => onSelectPrompt(s.prompt)}
            >
              <span className="ai-suggestion-chip__title">{s.title}</span>
              <span className="ai-suggestion-chip__hint">Tap to run</span>
            </button>
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  );
}
