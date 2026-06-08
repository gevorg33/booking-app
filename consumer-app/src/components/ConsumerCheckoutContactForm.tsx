import { IonInput, IonItem, IonLabel } from '@ionic/react';
import type { GuestCheckoutContact } from '../lib/guest-booking.util.js';
import { guestContactFieldAttrs } from '../lib/checkout-autofill.util.js';
import { validateGuestCheckoutContact } from '../lib/guest-booking.util.js';

export function ConsumerCheckoutContactForm({
  value,
  onChange,
  compactWhenComplete = true,
}: {
  value: GuestCheckoutContact;
  onChange: (next: GuestCheckoutContact) => void;
  compactWhenComplete?: boolean;
}) {
  const nameAttrs = guestContactFieldAttrs('name');
  const emailAttrs = guestContactFieldAttrs('email');
  const phoneAttrs = guestContactFieldAttrs('phone');
  const isComplete = validateGuestCheckoutContact(value) === null;

  if (compactWhenComplete && isComplete) {
    return (
      <IonItem lines="none">
        <IonLabel>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>{value.name}</p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {[value.email, value.phone].filter(Boolean).join(' · ')}
          </p>
        </IonLabel>
      </IonItem>
    );
  }

  return (
    <>
      <IonItem>
        <IonLabel position="stacked">Your name</IonLabel>
        <IonInput
          value={value.name}
          name={nameAttrs.name}
          id={nameAttrs.id}
          autocomplete={nameAttrs.autocomplete}
          inputMode={nameAttrs.inputMode}
          enterkeyhint={nameAttrs.enterKeyHint}
          onIonInput={(event) =>
            onChange({ ...value, name: String(event.detail.value ?? '') })
          }
        />
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Email</IonLabel>
        <IonInput
          type="email"
          value={value.email}
          name={emailAttrs.name}
          id={emailAttrs.id}
          autocomplete={emailAttrs.autocomplete}
          inputMode={emailAttrs.inputMode}
          enterkeyhint={emailAttrs.enterKeyHint}
          onIonInput={(event) =>
            onChange({ ...value, email: String(event.detail.value ?? '') })
          }
        />
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Phone</IonLabel>
        <IonInput
          type="tel"
          value={value.phone}
          name={phoneAttrs.name}
          id={phoneAttrs.id}
          autocomplete={phoneAttrs.autocomplete}
          inputMode={phoneAttrs.inputMode}
          enterkeyhint={phoneAttrs.enterKeyHint}
          onIonInput={(event) =>
            onChange({ ...value, phone: String(event.detail.value ?? '') })
          }
        />
      </IonItem>
    </>
  );
}
