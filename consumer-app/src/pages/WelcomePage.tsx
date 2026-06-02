import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { buildSalonPath, isValidSlug } from '../lib/deep-link.js';
import { loadRecentSalons } from '../lib/recent-salons.js';

export default function WelcomePage() {
  const history = useHistory();
  const [code, setCode] = useState('');
  const recent = loadRecentSalons();

  const openSalon = (slug: string) => {
    if (!isValidSlug(slug)) return;
    history.push(buildSalonPath(slug));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>OptiSchedule</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Book your salon</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          Open a link from your salon or enter your salon code below.
        </p>

        <IonItem lines="full">
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

        {recent.length > 0 && (
          <>
            <h2 style={{ fontSize: '1.1rem', marginTop: 32, marginBottom: 12 }}>Recent salons</h2>
            <IonList>
              {recent.map((salon) => (
                <IonItem key={salon.slug} button detail onClick={() => openSalon(salon.slug)}>
                  <IonLabel>
                    <h2>{salon.name}</h2>
                    <p>{salon.slug}</p>
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
