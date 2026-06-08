import { IonButton, IonIcon } from '@ionic/react';
import { timeOutline } from 'ionicons/icons';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import {
  buildProviderBookingPrompt,
  listProviderBookableTimes,
  type AiAvailableProvider,
} from '../lib/ai-available-providers.util.js';

export interface AiAvailableProviderSlotSelection {
  provider: AiAvailableProvider;
  time?: string;
  prompt: string;
}

export function AiAvailableProvidersPanel({
  providers,
  serviceName,
  date,
  copy,
  primaryColor,
  onBook,
  onSelectSlot,
}: {
  providers: AiAvailableProvider[];
  serviceName?: string;
  date?: string;
  copy: ConsumerCopy;
  primaryColor?: string;
  onBook: (prompt: string) => void;
  onSelectSlot?: (selection: AiAvailableProviderSlotSelection) => void;
}) {
  if (providers.length === 0) return null;

  const handleSlotPress = (
    provider: AiAvailableProvider,
    prompt: string,
    time?: string,
  ) => {
    if (onSelectSlot) {
      onSelectSlot({ provider, time, prompt });
      return;
    }
    onBook(prompt);
  };

  return (
    <div
      style={{
        marginTop: 8,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        background: '#fff',
        padding: 8,
      }}
    >
      <p
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#6b7280',
          margin: '0 0 6px',
        }}
      >
        {copy.availableProvidersTitle}
      </p>
      {providers.map((provider) => {
        const times = listProviderBookableTimes(provider);
        const rowKey = provider.id ?? provider.name;

        return (
          <div
            key={rowKey}
            style={{
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              padding: '8px 10px',
              marginBottom: 6,
            }}
          >
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111827' }}>
              {provider.name}
              {provider.role ? (
                <span style={{ color: '#6b7280', fontWeight: 400 }}> · {provider.role}</span>
              ) : null}
            </p>
            {times.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, alignItems: 'center' }}>
                <IonIcon icon={timeOutline} style={{ fontSize: 14, color: '#9ca3af' }} />
                {times.map((time) => (
                  <IonButton
                    key={`${rowKey}-${time}`}
                    size="small"
                    fill="outline"
                    style={{
                      '--border-color': primaryColor ? `${primaryColor}44` : undefined,
                      '--color': primaryColor ?? undefined,
                      margin: 0,
                      height: 28,
                      fontSize: 12,
                    }}
                    onClick={() =>
                      handleSlotPress(
                        provider,
                        buildProviderBookingPrompt({ provider, serviceName, date, time }),
                        time,
                      )
                    }
                  >
                    {time}
                  </IonButton>
                ))}
              </div>
            ) : (
              <IonButton
                size="small"
                fill="outline"
                style={{
                  marginTop: 6,
                  '--color': primaryColor ?? undefined,
                  height: 28,
                  fontSize: 12,
                }}
                onClick={() =>
                  handleSlotPress(
                    provider,
                    buildProviderBookingPrompt({ provider, serviceName, date }),
                  )
                }
              >
                {copy.bookProvider}
              </IonButton>
            )}
          </div>
        );
      })}
    </div>
  );
}
