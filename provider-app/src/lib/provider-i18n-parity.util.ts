import type { AppLocale, MessageTree } from '@shared-i18n/types';
import { translate } from '@shared-i18n/translate';
import en from '@shared-i18n/messages/en';
import { PROV_EXP_PROVIDER_I18N_PARITY_KEYS } from './provider-i18n-parity.fixtures';

/** True when HY/RU has a dedicated translation instead of deep-merge EN fallback. */
export function isLocalizedProviderKey(
  messages: MessageTree,
  key: string,
): boolean {
  return translate(messages, key) !== translate(en, key);
}

export function listProviderKeysMissingLocaleParity(
  messages: MessageTree,
  keys: readonly string[] = PROV_EXP_PROVIDER_I18N_PARITY_KEYS,
): string[] {
  return keys.filter((key) => !isLocalizedProviderKey(messages, key));
}

export function assertProviderLocaleParity(
  locale: AppLocale,
  messages: MessageTree,
  keys: readonly string[] = PROV_EXP_PROVIDER_I18N_PARITY_KEYS,
): void {
  const missing = listProviderKeysMissingLocaleParity(messages, keys);
  if (missing.length) {
    throw new Error(
      `${locale} provider parity missing for ${missing.length} keys: ${missing.slice(0, 5).join(', ')}`,
    );
  }
}
