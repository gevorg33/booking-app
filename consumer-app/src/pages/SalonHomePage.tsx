import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import type { PublicBusinessProfile } from '../lib/types.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { ConsumerLanguagePicker } from '../components/ConsumerLanguagePicker.js';
import { useConsumerLocale } from '../hooks/use-consumer-locale.js';

export default function SalonHomePage({
  slug,
  profile,
}: {
  slug: string;
  profile: PublicBusinessProfile;
}) {
  const history = useHistory();
  const logo = profile.branding.logoUrl;
  const { locale, setConsumerLocale, enabledLocales, localeLabels } = useConsumerLocale(
    slug,
    profile,
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{profile.name}</IonTitle>
          <ConsumerLanguagePicker
            locale={locale}
            enabledLocales={enabledLocales}
            localeLabels={localeLabels}
            onChange={setConsumerLocale}
          />
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
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

        <IonButton expand="block" onClick={() => history.push(buildSalonPath(slug, '/services'))}>
          Book an appointment
        </IonButton>
        <IonButton
          expand="block"
          fill="outline"
          className="ion-margin-top"
          onClick={() => history.push(buildSalonPath(slug, '/account'))}
        >
          My account
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
