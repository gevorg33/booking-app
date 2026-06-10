import { IonChip, IonIcon, IonLabel } from '@ionic/react';
import { locationOutline, peopleOutline } from 'ionicons/icons';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { PublicService } from '../lib/types.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import {
  formatTourDifficulty,
  isPublicTourService,
  tourPriceLabel,
} from '../lib/tour-service.util.js';

export function ConsumerTourServiceCard({
  service,
  tenantCurrency,
  selected,
  primary,
  copy,
  onSelect,
}: {
  service: PublicService;
  tenantCurrency?: string;
  selected: boolean;
  primary: string;
  copy: ConsumerCopy;
  onSelect: () => void;
}) {
  if (!isPublicTourService(service)) return null;

  const difficulty = formatTourDifficulty(service.difficulty, (key) =>
    (copy as unknown as Record<string, string>)[key] ?? key,
  );
  const price = formatPublicMoney(service.price, service.currency, tenantCurrency);
  const priceLabel = tourPriceLabel(price, service, (key, params) => {
    if (key === 'tourPricePerPerson' && params?.price) {
      return copy.tourPricePerPerson.replace('{price}', params.price);
    }
    return key;
  });

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: selected ? `2px solid ${primary}` : '1px solid #e5e7eb',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#fff',
        textAlign: 'left',
        marginBottom: 12,
        padding: 0,
      }}
    >
      <div
        style={{
          height: 112,
          background: 'linear-gradient(135deg, #ede9fe, #e0f2fe)',
          position: 'relative',
        }}
      >
        {service.coverImage ? (
          <img
            src={service.coverImage}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c3aed',
              fontWeight: 600,
            }}
          >
            {copy.tourImagePlaceholder}
          </div>
        )}
        {service.tourDurationBadge ? (
          <span
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(255,255,255,0.92)',
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            {service.tourDurationBadge}
          </span>
        ) : null}
      </div>
      <div style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{service.name}</p>
          {service.description ? (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.875rem',
                color: '#6b7280',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {service.description}
            </p>
          ) : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {difficulty ? (
              <IonChip style={{ margin: 0, height: 24, fontSize: '0.75rem' }}>
                <IonLabel>{difficulty}</IonLabel>
              </IonChip>
            ) : null}
            {service.maxGroupSize != null && service.maxGroupSize > 0 ? (
              <IonChip style={{ margin: 0, height: 24, fontSize: '0.75rem' }}>
                <IonIcon icon={peopleOutline} />
                <IonLabel>
                  {copy.tourMaxGroup.replace('{count}', String(service.maxGroupSize))}
                </IonLabel>
              </IonChip>
            ) : null}
            {service.meetingPoint ? (
              <IonChip style={{ margin: 0, height: 24, fontSize: '0.75rem', maxWidth: '100%' }}>
                <IonIcon icon={locationOutline} />
                <IonLabel>{service.meetingPoint}</IonLabel>
              </IonChip>
            ) : null}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{priceLabel}</p>
        </div>
      </div>
    </button>
  );
}
