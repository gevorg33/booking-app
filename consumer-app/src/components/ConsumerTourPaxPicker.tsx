import { IonButton, IonInput, IonItem, IonLabel } from '@ionic/react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { clampTourPaxCount } from '../lib/tour-booking.util.js';

export function ConsumerTourPaxPicker({
  copy,
  paxCount,
  maxPax,
  onChange,
}: {
  copy: ConsumerCopy;
  paxCount: number;
  maxPax: number;
  onChange: (next: number) => void;
}) {
  const setClamped = (raw: number) => {
    onChange(clampTourPaxCount(raw, maxPax));
  };

  return (
    <div className="ion-margin-top">
      <IonItem lines="none">
        <IonLabel position="stacked">{copy.tourGroupSize}</IonLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <IonButton
            fill="outline"
            size="small"
            disabled={paxCount <= 1}
            onClick={() => setClamped(paxCount - 1)}
          >
            −
          </IonButton>
          <IonInput
            type="number"
            inputmode="numeric"
            min={1}
            max={maxPax}
            value={paxCount}
            onIonInput={(e) => {
              const raw = parseInt(String(e.detail.value ?? '1'), 10);
              setClamped(Number.isFinite(raw) ? raw : 1);
            }}
            style={{ maxWidth: 72, textAlign: 'center' }}
          />
          <IonButton
            fill="outline"
            size="small"
            disabled={paxCount >= maxPax}
            onClick={() => setClamped(paxCount + 1)}
          >
            +
          </IonButton>
        </div>
      </IonItem>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 16px 0' }}>
        {copy.tourTravelersHint.replace('{max}', String(maxPax))}
      </p>
    </div>
  );
}
