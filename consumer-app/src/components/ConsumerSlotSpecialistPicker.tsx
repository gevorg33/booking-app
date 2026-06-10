import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { checkmarkOutline, chevronExpandOutline, peopleOutline } from 'ionicons/icons';
import { useMemo, useState } from 'react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { PublicServiceSlotProvider } from '../lib/types.js';
import { ConsumerProviderAvatar } from './ConsumerProviderAvatar.js';

type Props = {
  copy: ConsumerCopy;
  primaryColor: string;
  providers: PublicServiceSlotProvider[];
  value: string;
  onChange: (employeeId: string) => void;
};

export function ConsumerSlotSpecialistPicker({
  copy,
  primaryColor,
  providers,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === value),
    [providers, value],
  );

  const selectedLabel = selectedProvider?.name ?? copy.anySpecialist;

  const selectValue = (employeeId: string) => {
    onChange(employeeId);
    setOpen(false);
  };

  return (
    <>
      <IonItem button detail={false} onClick={() => setOpen(true)}>
        <div slot="start" style={{ display: 'flex', alignItems: 'center' }}>
          {selectedProvider ? (
            <ConsumerProviderAvatar
              name={selectedProvider.name}
              avatarUrl={selectedProvider.avatarUrl}
              primaryColor={primaryColor}
              size={36}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IonIcon icon={peopleOutline} color="medium" />
            </div>
          )}
        </div>
        <IonLabel>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 2px' }}>{copy.selectSpecialist}</p>
          <h3 style={{ fontWeight: 600, margin: 0 }}>{selectedLabel}</h3>
          {selectedProvider?.role ? (
            <p style={{ margin: '2px 0 0', color: '#6b7280' }}>{selectedProvider.role}</p>
          ) : null}
        </IonLabel>
        <IonIcon icon={chevronExpandOutline} slot="end" color="medium" />
      </IonItem>

      <IonModal isOpen={open} onDidDismiss={() => setOpen(false)} initialBreakpoint={0.5} breakpoints={[0, 0.5, 0.75]}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{copy.selectSpecialist}</IonTitle>
            <IonButton slot="end" fill="clear" onClick={() => setOpen(false)}>
              {copy.assistantClose}
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList lines="full">
            <IonItem
              button
              onClick={() => selectValue('')}
              style={{ '--background': value === '' ? '#eff6ff' : undefined }}
            >
              <div slot="start">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IonIcon icon={peopleOutline} color="medium" style={{ fontSize: 22 }} />
                </div>
              </div>
              <IonLabel>
                <h2 style={{ fontWeight: 600 }}>{copy.anySpecialist}</h2>
              </IonLabel>
              {value === '' ? <IonIcon icon={checkmarkOutline} slot="end" color="primary" /> : null}
            </IonItem>

            {providers.map((provider) => {
              const selected = value === provider.id;
              return (
                <IonItem
                  key={provider.id}
                  button
                  onClick={() => selectValue(provider.id)}
                  style={{ '--background': selected ? '#eff6ff' : undefined }}
                >
                  <div slot="start">
                    <ConsumerProviderAvatar
                      name={provider.name}
                      avatarUrl={provider.avatarUrl}
                      primaryColor={primaryColor}
                      size={44}
                    />
                  </div>
                  <IonLabel>
                    <h2 style={{ fontWeight: 600 }}>{provider.name}</h2>
                    {provider.role ? <p>{provider.role}</p> : null}
                  </IonLabel>
                  {selected ? <IonIcon icon={checkmarkOutline} slot="end" color="primary" /> : null}
                </IonItem>
              );
            })}
          </IonList>
        </IonContent>
      </IonModal>
    </>
  );
}
