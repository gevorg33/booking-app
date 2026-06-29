import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

type MessageTree = { [key: string]: string | MessageTree };

export type GuideCorpusLocale = 'en' | 'hy' | 'ru';

const GUIDE_CORPUS_LOCALES: GuideCorpusLocale[] = ['en', 'hy', 'ru'];

function repoRoot(): string {
  return join(process.cwd(), '..');
}

export function frontendGuideMessagesPath(locale: GuideCorpusLocale): string {
  return join(repoRoot(), 'frontend/src/i18n/messages', `${locale}.ts`);
}

/** Resolve dot-path key against a nested message tree (mirrors frontend `translate`). */
export function resolveGuideCorpusI18nKey(
  messages: MessageTree,
  key: string,
): string | null {
  const parts = key.split('.');
  let cur: unknown = messages;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return null;
    cur = (cur as MessageTree)[part];
  }
  return typeof cur === 'string' ? cur : null;
}

export function listGuideCorpusLocales(): readonly GuideCorpusLocale[] {
  return GUIDE_CORPUS_LOCALES;
}

/** Assert frontend message files exist (CI drift guard). */
export function assertFrontendGuideI18nPresent(): void {
  for (const locale of GUIDE_CORPUS_LOCALES) {
    const path = frontendGuideMessagesPath(locale);
    if (!existsSync(path)) {
      throw new Error(`missing frontend guide i18n: ${path}`);
    }
    readFileSync(path, 'utf8');
  }
}

/** Weak structural check — every path segment appears as an object key in the locale file. */
export function i18nKeyDeclaredInLocaleFile(
  locale: GuideCorpusLocale,
  key: string,
): boolean {
  const content = readFileSync(frontendGuideMessagesPath(locale), 'utf8');
  return key.split('.').every((segment) => {
    return (
      content.includes(`${segment}:`) ||
      content.includes(`'${segment}':`) ||
      content.includes(`"${segment}":`)
    );
  });
}
