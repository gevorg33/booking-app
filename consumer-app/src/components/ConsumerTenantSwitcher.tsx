import {
  IonButton,
  IonButtons,
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
import { checkmarkCircle, swapHorizontalOutline } from 'ionicons/icons';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { buildRememberedTenants, type RememberedTenant } from '../lib/customer-auth.js';
import { buildSalonPath } from '../lib/deep-link.js';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';

function TenantAvatar({ tenant }: { tenant: RememberedTenant }) {
  if (tenant.logoUrl) {
    return (
      <img
        src={tenant.logoUrl}
        alt=""
        slot="start"
        style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }}
      />
    );
  }
  return null;
}

export function ConsumerTenantSwitcher({
  currentSlug,
  trigger = 'icon',
  copy,
}: {
  currentSlug?: string;
  trigger?: 'icon' | 'button';
  copy: Pick<
    ConsumerCopy,
    'switchSalon' | 'switchSalonCurrentAria' | 'assistantClose'
  >;
}) {
  const history = useHistory();
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const tenants = useMemo(
    () => buildRememberedTenants({ activeSlug: currentSlug }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentSlug, refreshKey],
  );

  const switchTargets = tenants.filter((tenant) => tenant.slug !== currentSlug);
  if (switchTargets.length === 0) return null;

  const openModal = () => {
    setRefreshKey((value) => value + 1);
    setOpen(true);
  };

  const switchTo = (tenant: RememberedTenant) => {
    if (tenant.slug === currentSlug) {
      setOpen(false);
      return;
    }
    history.push(buildSalonPath(tenant.slug));
    setOpen(false);
  };

  return (
    <>
      {trigger === 'button' ? (
        <IonButton expand="block" fill="outline" className="ion-margin-top" onClick={openModal}>
          <IonIcon slot="start" icon={swapHorizontalOutline} />
          {copy.switchSalon}
        </IonButton>
      ) : (
        <IonButton aria-label={copy.switchSalon} onClick={openModal}>
          <IonIcon icon={swapHorizontalOutline} />
        </IonButton>
      )}

      <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{copy.switchSalon}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setOpen(false)}>{copy.assistantClose}</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            {tenants.map((tenant) => (
              <IonItem
                key={tenant.slug}
                button
                detail={tenant.slug !== currentSlug}
                onClick={() => switchTo(tenant)}
              >
                <TenantAvatar tenant={tenant} />
                <IonLabel>
                  <h2>{tenant.displayName}</h2>
                  <p>{tenant.subtitle}</p>
                </IonLabel>
                {tenant.isActive ? (
                  <IonIcon
                    icon={checkmarkCircle}
                    slot="end"
                    color="success"
                    aria-label={copy.switchSalonCurrentAria}
                  />
                ) : null}
              </IonItem>
            ))}
          </IonList>
        </IonContent>
      </IonModal>
    </>
  );
}
