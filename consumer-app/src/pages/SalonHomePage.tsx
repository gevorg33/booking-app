import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  IonBadge,
} from '@ionic/react';
import { bookmark, bookmarkOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useIonRouter } from '@ionic/react';
import { BookingProgressIndicator } from '../components/BookingProgressIndicator.js';
import { track } from '../lib/app-analytics.js';
import { useQuery } from '@tanstack/react-query';
import type { PublicBusinessProfile } from '../lib/types.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { pushConsumerRoute } from '../lib/consumer-ion-navigation.util.js';
import { formatCopy } from '../lib/copy.js';
import { ConsumerLanguagePicker } from '../components/ConsumerLanguagePicker.js';
import { ConsumerPatientAlertsBanner } from '../components/ConsumerPatientAlertsBanner.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { getCustomerToken } from '../lib/customer-auth.js';
import { shouldShowPatientResultsTab } from '../lib/clinic-service.js';
import { fetchMyClinicLabBookingRequests } from '../services/public-api.js';
import type { ConsumerPatientAlertRoute } from '../lib/clinic-patient-alerts.js';
import { isSalonPinned, toggleSalonPin } from '../lib/recent-salons.js';
import { ConsumerTabPageShell } from '../components/ConsumerTabPageShell.js';
import { ConsumerTenantSwitcher } from '../components/ConsumerTenantSwitcher.js';
import { ConsumerRewardsCard } from '../components/ConsumerRewardsCard.js';
import { ConsumerGrowthLinks } from '../components/ConsumerGrowthLinks.js';

export default function SalonHomePage({
  slug,
  profile,
  embedded = false,
}: {
  slug: string;
  profile: PublicBusinessProfile;
  embedded?: boolean;
}) {
  const history = useHistory();
  const ionRouter = useIonRouter();
  const location = useLocation();
  const logo = profile.branding.logoUrl;
  const [pinned, setPinned] = useState(() => isSalonPinned(slug));
  // e2e-bug.22 / e2e-bug.14 — single locale state via useConsumerCopy (never pair with
  // a second useConsumerLocale; that leaves RewardsCard copy stuck on the old language).
  const { copy, locale, setConsumerLocale, enabledLocales, localeLabels } = useConsumerCopy(
    slug,
    profile,
  );
  const authed = !!getCustomerToken(slug);
  const showClinicAlerts = shouldShowPatientResultsTab(profile.businessType);

  const pendingLabRequestsQuery = useQuery({
    queryKey: ['clinic-lab-booking-requests', slug],
    queryFn: () => fetchMyClinicLabBookingRequests(slug),
    enabled: showClinicAlerts && authed,
  });
  const pendingLabCount = pendingLabRequestsQuery.data?.length ?? 0;

  useEffect(() => {
    track('onboarding_step_viewed', { onboardingStep: 'salon' });
  }, [slug]);

  const navigateToAlertSection = (route: ConsumerPatientAlertRoute, anchorId: string) => {
    history.push(buildSalonPath(slug, route));
    window.setTimeout(() => {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const bookProfessionalsPath = buildSalonPath(slug, '/professionals');
  const goBook = () => pushConsumerRoute(history, ionRouter, bookProfessionalsPath);

  return (
    <ConsumerTabPageShell embedded={embedded}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{profile.name}</IonTitle>
          <IonButtons slot="start">
            <ConsumerTenantSwitcher currentSlug={slug} copy={copy} />
          </IonButtons>
          <IonButtons slot="end">
            <IonButton
              aria-label={
                pinned ? copy.welcomeUnsaveSalonAria : copy.welcomeSaveSalonAria
              }
              onClick={() => setPinned(toggleSalonPin(slug))}
            >
              <IonIcon icon={pinned ? bookmark : bookmarkOutline} color={pinned ? 'warning' : 'medium'} />
            </IonButton>
            <ConsumerLanguagePicker
              locale={locale}
              enabledLocales={enabledLocales}
              localeLabels={localeLabels}
              onChange={setConsumerLocale}
              ariaLabel={copy.languagePickerAria}
            />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <BookingProgressIndicator pathname={location.pathname} copy={copy} />

        <div className="salon-card ion-text-center">
          {logo ? (
            <img
              src={logo}
              alt=""
              style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover' }}
            />
          ) : null}
          <h1 style={{ fontSize: '1.35rem', fontWeight: 600, marginTop: 12 }}>{profile.name}</h1>
          {profile.branding.tagline ? (
            <p style={{ color: '#6b7280' }}>{profile.branding.tagline}</p>
          ) : null}
          {profile.description ? (
            <p style={{ marginTop: 12, textAlign: 'left' }}>{profile.description}</p>
          ) : null}
        </div>

        {authed && showClinicAlerts ? (
          <ConsumerPatientAlertsBanner
            slug={slug}
            copy={copy}
            businessType={profile.businessType}
            onNavigate={navigateToAlertSection}
          />
        ) : null}

        <ConsumerRewardsCard
          slug={slug}
          profile={profile}
          copy={copy}
          authed={authed}
          onBook={goBook}
        />

        <IonButton
          expand="block"
          color="primary"
          className="consumer-brand-solid-button"
          onClick={goBook}
        >
          {copy.bookAppointment}
        </IonButton>
        {profile.giftCardsPurchaseEnabled ? (
          <IonButton
            expand="block"
            fill="outline"
            color="primary"
            className="ion-margin-top consumer-brand-outline-button"
            onClick={() => history.push(buildSalonPath(slug, '/gift-cards'))}
          >
            {copy.giftCardBuyGiftCard}
          </IonButton>
        ) : null}
        {showClinicAlerts ? (
          <IonButton
            expand="block"
            fill="outline"
            color="primary"
            className="ion-margin-top consumer-brand-outline-button"
            onClick={() => history.push(buildSalonPath(slug, '/lab-to-book'))}
          >
            {pendingLabCount > 0
              ? formatCopy(copy.homeLabToBookShortcutPending, {
                  count: String(pendingLabCount),
                })
              : copy.homeLabToBookShortcut}
            {pendingLabCount > 0 ? (
              <IonBadge color="danger" slot="end" style={{ marginInlineStart: 8 }}>
                {pendingLabCount}
              </IonBadge>
            ) : null}
          </IonButton>
        ) : null}
        <IonButton
          expand="block"
          fill="outline"
          color="primary"
          className="ion-margin-top consumer-brand-outline-button"
          onClick={() => history.push(buildSalonPath(slug, '/profile'))}
        >
          {copy.profileViewDetails}
        </IonButton>
        <IonButton
          expand="block"
          fill="outline"
          color="primary"
          className="ion-margin-top consumer-brand-outline-button"
          onClick={() => history.push(buildSalonPath(slug, '/account'))}
        >
          {copy.myAccountAction}
        </IonButton>

        <ConsumerGrowthLinks profile={profile} copy={copy} />
      </IonContent>
    </ConsumerTabPageShell>
  );
}
