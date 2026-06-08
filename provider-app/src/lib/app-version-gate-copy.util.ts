import type { AppLocale } from '@shared-i18n/types';

export type AppVersionGateCopy = {
  title: string;
  killSwitchMessage: string;
  updateRequiredMessage: string;
  updateNudgeMessage: string;
  updateAction: string;
  dismissAction: string;
};

const EN: AppVersionGateCopy = {
  title: 'Update required',
  killSwitchMessage: 'This app version is temporarily unavailable. Please try again later.',
  updateRequiredMessage: 'Please update the provider app to continue.',
  updateNudgeMessage: 'A newer provider app version is available with improvements.',
  updateAction: 'Update in the app store',
  dismissAction: 'Not now',
};

const HY: Partial<AppVersionGateCopy> = {
  title: 'Պահանջվում է թարմացում',
  killSwitchMessage: 'Այս տարբերակը ժամանակավորապես անհասանելի է։ Փորձեք ավելի ուշ։',
  updateRequiredMessage: 'Թարմացրեք provider հավելվածը՝ շարունակելու համար։',
  updateNudgeMessage: 'Provider հավելվածի նոր տարբերակը հասանելի է բարելավումներով։',
  updateAction: 'Թարմացնել store-ում',
  dismissAction: 'Ոչ հիմա',
};

const RU: Partial<AppVersionGateCopy> = {
  title: 'Нужно обновление',
  killSwitchMessage: 'Эта версия приложения временно недоступна. Попробуйте позже.',
  updateRequiredMessage: 'Обновите приложение провайдера, чтобы продолжить.',
  updateNudgeMessage: 'Доступна новая версия приложения провайдера с улучшениями.',
  updateAction: 'Обновить в магазине',
  dismissAction: 'Не сейчас',
};

export function getAppVersionGateCopy(locale: AppLocale | string | null | undefined): AppVersionGateCopy {
  if (locale === 'hy') return { ...EN, ...HY };
  if (locale === 'ru') return { ...EN, ...RU };
  return EN;
}
