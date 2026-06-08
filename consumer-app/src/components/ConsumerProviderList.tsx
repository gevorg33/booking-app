import { IonIcon, IonItem, IonLabel, IonList } from '@ionic/react';
import { peopleOutline } from 'ionicons/icons';
import type { PublicProvider } from '../lib/types.js';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { formatScheduleTime, resolveNearestSlotDateLabel } from '../lib/date-format.js';
import { buildProviderProfilePath } from '../lib/provider-booking.util.js';
import { ConsumerProviderReviewSummary } from './ConsumerProviderReviewSummary.js';

interface ConsumerProviderListProps {
  slug: string;
  providers: PublicProvider[];
  primaryColor: string;
  copy: ConsumerCopy;
  locale: string;
  selectedEmployeeId: string | null;
  selectedStartTime: string | null;
  onSelect: (employeeId: string, startTime: string) => void;
  onAnySpecialist?: () => void;
  showAnySpecialistOption?: boolean;
}

export function ConsumerProviderList({
  slug,
  providers,
  primaryColor,
  copy,
  locale,
  selectedEmployeeId,
  selectedStartTime,
  onSelect,
  onAnySpecialist,
  showAnySpecialistOption = true,
}: ConsumerProviderListProps) {
  return (
    <IonList>
      {showAnySpecialistOption && onAnySpecialist ? (
        <IonItem button detail onClick={onAnySpecialist}>
          <IonIcon icon={peopleOutline} slot="start" color="medium" />
          <IonLabel>
            <h2>{copy.anySpecialist}</h2>
            <p>{copy.anySpecialistHint}</p>
          </IonLabel>
        </IonItem>
      ) : null}

      {providers.map((provider) => {
        const isSelected = selectedEmployeeId === provider.id;
        const reviewCount = provider.reviewCount ?? 0;
        const averageRating = provider.averageRating;
        const hasReviews =
          reviewCount > 0 && averageRating != null && !Number.isNaN(averageRating);
        const nearestDateText = resolveNearestSlotDateLabel(provider, copy.todayInline);

        return (
          <div
            key={provider.id}
            style={{
              marginBottom: 12,
              borderRadius: 16,
              border: isSelected ? `2px solid ${primaryColor}` : '1px solid #e5e7eb',
              background: '#fff',
              overflow: 'hidden',
            }}
          >
            <IonItem
              button
              detail={false}
              lines="none"
              routerLink={buildProviderProfilePath(slug, provider.id)}
            >
              {provider.avatarUrl ? (
                <img
                  src={provider.avatarUrl}
                  alt=""
                  slot="start"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  slot="start"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: primaryColor,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                  }}
                >
                  {provider.name.charAt(0)}
                </div>
              )}
              <IonLabel>
                <h2 style={{ fontWeight: 600 }}>{provider.name}</h2>
                {provider.role ? <p>{provider.role}</p> : null}
                {hasReviews ? (
                  <ConsumerProviderReviewSummary
                    averageRating={averageRating!}
                    reviewCount={reviewCount}
                    summaryTemplate={copy.providerReviewSummary}
                  />
                ) : null}
              </IonLabel>
            </IonItem>

            <div style={{ padding: '0 16px 16px' }}>
              {provider.slots.length > 0 ? (
                <>
                  {nearestDateText ? (
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>
                      {copy.nearestSlots.replace('{date}', nearestDateText)}
                    </p>
                  ) : null}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {provider.slots.map((slot) => {
                      const active = isSelected && selectedStartTime === slot.startTime;
                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          onClick={() => onSelect(provider.id, slot.startTime)}
                          style={{
                            borderRadius: 999,
                            border: active ? 'none' : '1px solid #e5e7eb',
                            background: active ? primaryColor : '#f9fafb',
                            color: active ? '#fff' : '#374151',
                            padding: '8px 14px',
                            fontSize: 14,
                            fontWeight: 500,
                          }}
                        >
                          {formatScheduleTime(slot.startTime, locale)}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>{copy.noSlots}</p>
              )}
            </div>
          </div>
        );
      })}
    </IonList>
  );
}
