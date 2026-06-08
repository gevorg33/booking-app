import { IonButton, IonText } from '@ionic/react';

/** Dismissible soft update prompt when a newer supported build exists (adopt-5.5). */
export function AppUpdateNudgeBanner({
  message,
  storeUrl,
  updateLabel,
  dismissLabel,
  onDismiss,
}: {
  message: string;
  storeUrl: string | null;
  updateLabel: string;
  dismissLabel: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 9990,
        padding: '10px 12px',
        background: '#eff6ff',
        borderBottom: '1px solid #bfdbfe',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <IonText color="primary">
        <p style={{ margin: 0, fontSize: '0.875rem' }}>{message}</p>
      </IonText>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {storeUrl ? (
          <IonButton size="small" href={storeUrl} target="_blank" rel="noreferrer">
            {updateLabel}
          </IonButton>
        ) : null}
        <IonButton size="small" fill="clear" onClick={onDismiss}>
          {dismissLabel}
        </IonButton>
      </div>
    </div>
  );
}
