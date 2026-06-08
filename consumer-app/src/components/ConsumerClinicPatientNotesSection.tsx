import { IonItem, IonLabel, IonTextarea } from '@ionic/react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { PublicService } from '../lib/types.js';

export function ConsumerClinicPatientNotesSection({
  copy,
  service,
  symptoms,
  referralNotes,
  onSymptomsChange,
  onReferralNotesChange,
}: {
  copy: ConsumerCopy;
  service: PublicService;
  symptoms: string;
  referralNotes: string;
  onSymptomsChange: (value: string) => void;
  onReferralNotesChange: (value: string) => void;
}) {
  return (
    <div className="ion-margin-top">
      {service.preparationNotes ? (
        <p
          style={{
            margin: '0 0 12px',
            padding: '10px 12px',
            borderRadius: 12,
            fontSize: '0.875rem',
            color: '#92400e',
            background: '#fffbeb',
            border: '1px solid #fde68a',
          }}
        >
          {service.preparationNotes}
        </p>
      ) : null}

      <IonItem lines="none">
        <IonLabel position="stacked">{copy.clinicSymptoms}</IonLabel>
        <IonTextarea
          value={symptoms}
          rows={2}
          placeholder={copy.clinicSymptomsPlaceholder}
          onIonInput={(e) => onSymptomsChange(String(e.detail.value ?? ''))}
        />
      </IonItem>

      <IonItem lines="none" className="ion-margin-top">
        <IonLabel position="stacked">{copy.clinicReferralNotes}</IonLabel>
        <IonTextarea
          value={referralNotes}
          rows={2}
          placeholder={copy.clinicReferralNotesPlaceholder}
          onIonInput={(e) => onReferralNotesChange(String(e.detail.value ?? ''))}
        />
      </IonItem>
    </div>
  );
}
