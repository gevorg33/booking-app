import { IonIcon, IonList } from '@ionic/react';
import { peopleOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';
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

/** e2e-bug.4 — profile row + any-specialist use light-DOM link/button (not IonItem shadow). */
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
        <button
          type="button"
          className="consumer-provider-list__row-button"
          onClick={onAnySpecialist}
        >
          <IonIcon icon={peopleOutline} color="medium" aria-hidden="true" />
          <span className="consumer-provider-list__text">
            <span className="consumer-provider-list__title">{copy.anySpecialist}</span>
            <span className="consumer-provider-list__subtitle">{copy.anySpecialistHint}</span>
          </span>
        </button>
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
            <Link
              to={buildProviderProfilePath(slug, provider.id)}
              className="consumer-provider-list__profile-link"
            >
              {provider.avatarUrl ? (
                <img
                  src={provider.avatarUrl}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  aria-hidden="true"
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
                    flexShrink: 0,
                  }}
                >
                  {provider.name.charAt(0)}
                </div>
              )}
              <span className="consumer-provider-list__text">
                <span className="consumer-provider-list__title">{provider.name}</span>
                {provider.role ? (
                  <span className="consumer-provider-list__subtitle">{provider.role}</span>
                ) : null}
                {hasReviews ? (
                  <ConsumerProviderReviewSummary
                    averageRating={averageRating!}
                    reviewCount={reviewCount}
                    summaryTemplate={copy.providerReviewSummary}
                  />
                ) : null}
              </span>
            </Link>

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
