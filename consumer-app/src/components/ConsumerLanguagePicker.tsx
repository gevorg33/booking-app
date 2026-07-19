import { IonSelect, IonSelectOption } from '@ionic/react';
import type { ConsumerLocale } from '../lib/tenant-locale.js';

export function ConsumerLanguagePicker({
  locale,
  enabledLocales,
  localeLabels,
  onChange,
  ariaLabel,
}: {
  locale: ConsumerLocale;
  enabledLocales: readonly ConsumerLocale[];
  localeLabels: Record<ConsumerLocale, string>;
  onChange: (locale: ConsumerLocale) => void;
  /** e2e-bug.54 — localized aria-label (was hardcoded "Language") */
  ariaLabel: string;
}) {
  if (enabledLocales.length <= 1) return null;

  return (
    <IonSelect
      value={locale}
      interface="popover"
      aria-label={ariaLabel}
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
