import { IonButton, IonIcon } from '@ionic/react';
import { createOutline } from 'ionicons/icons';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';

type Props = {
  providerName: string;
  providerRole?: string | null;
  serviceName: string;
  timeLabel: string;
  primaryColor: string;
  copy: ConsumerCopy;
  showEdits?: boolean;
  onEditProvider: () => void;
  onEditService: () => void;
  onEditTime: () => void;
};

export function ConsumerProfessionalsFirstCheckoutSummary({
  providerName,
  providerRole,
  serviceName,
  timeLabel,
  primaryColor,
  copy,
  showEdits = true,
  onEditProvider,
  onEditService,
  onEditTime,
}: Props) {
  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  } as const;

  const labelStyle = {
    fontSize: 12,
    color: '#6b7280',
    margin: '0 0 2px',
  } as const;

  const valueStyle = {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  } as const;

  return (
    <div
      className="ion-margin-bottom"
      style={{
        borderRadius: 12,
        background: '#fff',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      <div style={{ ...rowStyle, padding: '12px 8px 12px 14px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 40,
              height: 40,
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
            {providerName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={labelStyle}>{copy.selectSpecialist}</p>
            <p style={{ ...valueStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {providerName}
            </p>
            {providerRole ? (
              <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{providerRole}</p>
            ) : null}
          </div>
        </div>
        {showEdits ? (
          <IonButton fill="clear" size="small" onClick={onEditProvider} aria-label={copy.checkoutEdit}>
            <IonIcon icon={createOutline} slot="icon-only" />
          </IonButton>
        ) : null}
      </div>

      <div style={{ padding: '12px 8px 12px 14px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={rowStyle}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={labelStyle}>{copy.checkoutBookingService}</p>
            <p style={valueStyle}>{serviceName}</p>
          </div>
          {showEdits ? (
            <IonButton fill="clear" size="small" onClick={onEditService} aria-label={copy.checkoutEdit}>
              <IonIcon icon={createOutline} slot="icon-only" />
            </IonButton>
          ) : null}
        </div>
      </div>

      <div style={{ padding: '12px 8px 12px 14px' }}>
        <div style={rowStyle}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={labelStyle}>{copy.checkoutSelectedTime}</p>
            <p style={{ ...valueStyle, fontWeight: 500, fontSize: 14 }}>{timeLabel}</p>
          </div>
          {showEdits ? (
            <IonButton fill="clear" size="small" onClick={onEditTime} aria-label={copy.checkoutEdit}>
              <IonIcon icon={createOutline} slot="icon-only" />
            </IonButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
