import { IonSelect, IonSelectOption } from '@ionic/react';
import type { ConsumerLocale } from '../lib/tenant-locale.js';

export function ConsumerLanguagePicker({
  locale,
  enabledLocales,
  localeLabels,
  onChange,
}: {
  locale: ConsumerLocale;
  enabledLocales: readonly ConsumerLocale[];
  localeLabels: Record<ConsumerLocale, string>;
  onChange: (locale: ConsumerLocale) => void;
}) {
  if (enabledLocales.length <= 1) return null;

  return (
    <IonSelect
      value={locale}
      interface="popover"
      aria-label="Language"
      onIonChange={(e) => onChange(e.detail.value as ConsumerLocale)}
    >
      {enabledLocales.map((code) => (
        <IonSelectOption key={code} value={code}>
          {localeLabels[code]}
        </IonSelectOption>
      ))}
    </IonSelect>
  );
}
