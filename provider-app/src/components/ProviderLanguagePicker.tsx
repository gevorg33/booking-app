import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import type { AppLocale } from '../i18n';
import { useI18n } from '../i18n';

/** Profile language picker — persists via provider-app-locale in localStorage. */
export function ProviderLanguagePicker() {
  const { locale, setLocale, locales, localeLabels, t } = useI18n();

  if (locales.length <= 1) return null;

  return (
    <IonItem lines="none" className="provider-language-picker">
      <IonLabel position="stacked">{t('languages.title')}</IonLabel>
      <IonSelect
        value={locale}
        interface="action-sheet"
        cancelText={t('common.cancel')}
        aria-label={t('languages.title')}
        onIonChange={(event) => {
          const next = event.detail.value as AppLocale;
          if (next && next !== locale) setLocale(next);
        }}
      >
        {locales.map((code) => (
          <IonSelectOption key={code} value={code}>
            {localeLabels[code]}
          </IonSelectOption>
        ))}
      </IonSelect>
    </IonItem>
  );
}
