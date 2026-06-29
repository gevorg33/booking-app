import en from '../../../../../frontend/src/i18n/messages/en.js';
import hy from '../../../../../frontend/src/i18n/messages/hy.js';
import ru from '../../../../../frontend/src/i18n/messages/ru.js';
import type { GuideCorpusLocale } from './ai-guide-corpus-i18n.util.js';

type MessageTree = { [key: string]: string | MessageTree };

function deepMergeMessages(base: MessageTree, override: MessageTree): MessageTree {
  const result: MessageTree = { ...base };
  for (const key of Object.keys(override)) {
    const ov = override[key];
    const b = base[key];
    if (
      ov != null &&
      typeof ov === 'object' &&
      !Array.isArray(ov) &&
      b != null &&
      typeof b === 'object' &&
      !Array.isArray(b)
    ) {
      result[key] = deepMergeMessages(b as MessageTree, ov as MessageTree);
    } else if (ov !== undefined) {
      result[key] = ov;
    }
  }
  return result;
}

const FRONTEND_GUIDE_MESSAGES: Record<GuideCorpusLocale, MessageTree> = {
  en: en as MessageTree,
  hy: deepMergeMessages(en as MessageTree, hy as MessageTree),
  ru: deepMergeMessages(en as MessageTree, ru as MessageTree),
};

export function getFrontendGuideCorpusMessages(
  locale: GuideCorpusLocale,
): MessageTree {
  return FRONTEND_GUIDE_MESSAGES[locale];
}
