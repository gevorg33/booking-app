import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { bookmark, bookmarkOutline, personCircleOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useIonViewWillEnter } from '@ionic/react';
import { buildSalonPath, isValidSlug } from '../lib/deep-link.js';
import { buildRememberedTenants, type RememberedTenant } from '../lib/customer-auth.js';
import {
  buildBookInThreeTapsCopy,
  markFirstRunComplete,
  shouldShowBookInThreeTapsHero,
} from '../lib/activation-onboarding.util.js';
import { getOrCreateAnonId, track } from '../lib/app-analytics.js';
import { resolveOnboardingVariant } from '../lib/onboarding-variant.util.js';
import { BookingProgressIndicator } from '../components/BookingProgressIndicator.js';
import {
  buildWelcomeSalonSections,
  toggleSalonPin,
  type WelcomeSalonEntry,
} from '../lib/recent-salons.js';

function SalonAvatar({ salon }: { salon: WelcomeSalonEntry }) {
  if (salon.logoUrl) {
    return (
      <img
        src={salon.logoUrl}
        alt=""
        slot="start"
        style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }}
      />
    );
  }
  return null;
}

function RememberedTenantAvatar({ tenant }: { tenant: RememberedTenant }) {
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
  return <IonIcon icon={personCircleOutline} slot="start" color="primary" />;
}

export default function WelcomePage() {
  const history = useHistory();
  const [code, setCode] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useIonViewWillEnter(() => {
    setRefreshKey((value) => value + 1);
  });

  const onboardingVariant = useMemo(() => resolveOnboardingVariant(getOrCreateAnonId()), [refreshKey]);
  const bookInThreeTaps = useMemo(() => buildBookInThreeTapsCopy(), []);

  useEffect(() => {
    track('onboarding_started', { onboardingVariant });
    track('onboarding_step_viewed', { onboardingStep: 'welcome', onboardingVariant });
  }, []);

  const sections = useMemo(
    () => buildWelcomeSalonSections(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey],
  );
  const quickReturnSlugs = useMemo(
    () => new Set(sections.quickReturn.map((salon) => salon.slug)),
    [sections.quickReturn],
  );

  const rememberedTenants = useMemo(
    () => buildRememberedTenants().filter((tenant) => !quickReturnSlugs.has(tenant.slug)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey, quickReturnSlugs],
  );

  const openSalon = (slug: string) => {
    if (!isValidSlug(slug)) return;
    markFirstRunComplete();
    track('onboarding_step_viewed', { onboardingStep: 'salon', onboardingVariant });
    history.push(buildSalonPath(slug));
  };

  const togglePin = (slug: string) => {
    toggleSalonPin(slug);
    setRefreshKey((value) => value + 1);
  };

  const renderSalonItem = (salon: WelcomeSalonEntry) => (
    <IonItem key={salon.slug} button detail onClick={() => openSalon(salon.slug)}>
      <SalonAvatar salon={salon} />
      <IonLabel>
        <h2>{salon.name}</h2>
        <p>{salon.subtitle}</p>
      </IonLabel>
      <IonButton
        slot="end"
        fill="clear"
        aria-label={salon.pinned ? 'Unsave salon' : 'Save salon'}
        onClick={(event) => {
          event.stopPropagation();
          togglePin(salon.slug);
        }}
      >
        <IonIcon icon={salon.pinned ? bookmark : bookmarkOutline} color={salon.pinned ? 'warning' : 'medium'} />
      </IonButton>
    </IonItem>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>OptiSchedule</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <BookingProgressIndicator pathname="/" />

        {shouldShowBookInThreeTapsHero({ onboardingVariant }) ? (
          <div
            className="salon-card ion-margin-bottom"
            style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{bookInThreeTaps.headline}</h2>
            <ol style={{ margin: '12px 0 0', paddingLeft: 18, color: '#4b5563' }}>
              {bookInThreeTaps.steps.map((step) => (
                <li key={step} style={{ marginBottom: 6 }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Book your salon</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          Return to a salon you booked before, or enter a salon code below.
        </p>

        {sections.quickReturn.length > 0 && (
          <>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Book again</h2>
            <IonList>{sections.quickReturn.map(renderSalonItem)}</IonList>
          </>
        )}

        <IonItem lines="full" className="ion-margin-top">
          <IonLabel position="stacked">Salon code</IonLabel>
          <IonInput
            value={code}
            placeholder="e.g. glow-nails"
            onIonInput={(e) => setCode((e.detail.value ?? '').toLowerCase().trim())}
          />
        </IonItem>
        <IonButton
          expand="block"
          className="ion-margin-top"
          disabled={!isValidSlug(code)}
          onClick={() => openSalon(code)}
        >
          Continue
        </IonButton>

        {rememberedTenants.length > 0 && (
          <>
            <h2 style={{ fontSize: '1.1rem', marginTop: 32, marginBottom: 12 }}>Your salons</h2>
            <IonList>
              {rememberedTenants.map((tenant) => (
                <IonItem key={tenant.slug} button detail onClick={() => openSalon(tenant.slug)}>
                  <RememberedTenantAvatar tenant={tenant} />
                  <IonLabel>
                    <h2>{tenant.displayName}</h2>
                    <p>{tenant.subtitle}</p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </>
        )}

      </IonContent>
    </IonPage>
  );
}
