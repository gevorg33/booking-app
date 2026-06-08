import { IonButton, IonText } from '@ionic/react';

/** Inline recoverable error with retry (adopt-5.4). */
export function ConsumerNetworkErrorCard({
  message,
  retryLabel,
  onRetry,
  compact = false,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={compact ? 'ion-margin-top' : 'salon-card ion-margin-top'}
      style={compact ? undefined : { textAlign: 'center' }}
    >
      <IonText color="medium">
        <p style={{ fontSize: compact ? '0.875rem' : '1rem', margin: compact ? '0 0 8px' : '0 0 12px' }}>
          {message}
        </p>
      </IonText>
      <IonButton size="small" fill="outline" onClick={onRetry}>
        {retryLabel}
      </IonButton>
    </div>
  );
}
