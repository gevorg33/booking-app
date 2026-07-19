import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { callOutline, locationOutline, mailOutline, timeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ConsumerGrowthLinks } from '../components/ConsumerGrowthLinks.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { buildSalonPath } from '../lib/deep-link.js';
import {
  buildSocialLinkEntries,
  openExternalUrl,
  socialHref,
} from '../lib/consumer-growth-links.util.js';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { openingHoursSummaryLines } from '../lib/public-opening-hours.util.js';
import type { PublicSocialLinks } from '../lib/types.js';
import { getPublicGiftCardCatalog } from '../services/public-api.js';

function socialLabel(copy: ConsumerCopy, id: keyof PublicSocialLinks): string {
  switch (id) {
    case 'website':
      return copy.profileSocialWebsite;
    case 'instagram':
      return copy.profileSocialInstagram;
    case 'facebook':
      return copy.profileSocialFacebook;
    case 'x':
      return copy.profileSocialX;
    case 'tiktok':
      return copy.profileSocialTiktok;
    case 'linkedin':
      return copy.profileSocialLinkedin;
    case 'youtube':
      return copy.profileSocialYoutube;
    default:
      return id;
  }
}

export default function SalonProfilePage() {
  const history = useHistory();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const { copy } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });

  const giftCardsQuery = useQuery({
    queryKey: ['gift-card-catalog', slug],
    queryFn: () => getPublicGiftCardCatalog(slug!),
    enabled: Boolean(slug),
  });

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/"  text={copy.guidePageBack} />
            </IonButtons>
            <IonTitle>{copy.profileViewDetails}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>{error || copy.networkLoadFailed}</p>
        </IonContent>
      </IonPage>
    );
  }

  const primary = profile.branding.primaryColor || '#7c3aed';
  const logo = profile.branding.logoUrl;
  const socialEntries = buildSocialLinkEntries(profile.social);
  const giftCardsEnabled = giftCardsQuery.data?.purchaseEnabled === true;
  const hourLines = openingHoursSummaryLines(profile.openingHours);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildSalonPath(slug, '/')}  text={copy.guidePageBack} />
          </IonButtons>
          <IonTitle>{copy.profileViewDetails}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="salon-card ion-text-center">
          {logo ? (
            <img
              src={logo}
              alt=""
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                objectFit: 'cover',
                margin: '0 auto',
              }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.25rem',
                background: primary,
              }}
            >
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 16 }}>{profile.name}</h1>
          {profile.branding.tagline ? (
            <p style={{ color: '#6b7280', marginTop: 4 }}>{profile.branding.tagline}</p>
          ) : null}
          {profile.description ? (
            <p style={{ marginTop: 16, textAlign: 'left', color: '#374151' }}>{profile.description}</p>
          ) : null}

          <div style={{ marginTop: 20, textAlign: 'left' }}>
            {profile.address ? (
              <p style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#4b5563' }}>
                <IonIcon icon={locationOutline} style={{ marginTop: 2 }} />
                <span>{profile.address}</span>
              </p>
            ) : null}
            {profile.phone ? (
              <p style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#4b5563', marginTop: 10 }}>
                <IonIcon icon={callOutline} />
                <a href={`tel:${profile.phone}`} style={{ color: 'inherit' }}>
                  {profile.phone}
                </a>
              </p>
            ) : null}
            {profile.email ? (
              <p style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#4b5563', marginTop: 10 }}>
                <IonIcon icon={mailOutline} />
                <a href={`mailto:${profile.email}`} style={{ color: 'inherit' }}>
                  {profile.email}
                </a>
              </p>
            ) : null}
            {hourLines.length ? (
              <div style={{ marginTop: 14, textAlign: 'left' }}>
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <IonIcon icon={timeOutline} />
                  {copy.profileHours}
                </p>
                {hourLines.map((line) => (
                  <p key={line} style={{ color: '#4b5563', margin: '0 0 4px', paddingLeft: 28 }}>
                    {line}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          {socialEntries.length > 0 ? (
            <div style={{ marginTop: 20, textAlign: 'left' }}>
              <p
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 8,
                }}
              >
                {copy.profileFollowUs}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {socialEntries.map((entry) => (
                  <IonButton
                    key={entry.id}
                    size="small"
                    fill="outline"
                    onClick={() => openExternalUrl(socialHref(entry.url))}
                  >
                    {socialLabel(copy, entry.id)}
                  </IonButton>
                ))}
              </div>
            </div>
          ) : null}

          <IonButton
            expand="block"
            className="ion-margin-top"
            style={{ '--background': primary }}
            onClick={() => history.push(buildSalonPath(slug, '/professionals'))}
          >
            {copy.bookAppointment}
          </IonButton>
          {giftCardsEnabled ? (
            <IonButton
              expand="block"
              fill="outline"
              className="ion-margin-top"
              style={{ '--border-color': primary, '--color': primary }}
              onClick={() => history.push(buildSalonPath(slug, '/gift-cards'))}
            >
              {copy.giftCardBuyGiftCard}
            </IonButton>
          ) : null}
        </div>

        {profile.location?.mapEmbedHtml ? (
          <div className="salon-card ion-margin-top">
            <p style={{ fontWeight: 600, marginBottom: 12 }}>{copy.profileLocation}</p>
            <div
              dangerouslySetInnerHTML={{ __html: profile.location.mapEmbedHtml }}
              style={{ overflow: 'hidden', borderRadius: 12 }}
            />
          </div>
        ) : null}

        <ConsumerGrowthLinks profile={profile} copy={copy} />
      </IonContent>
    </IonPage>
  );
}
