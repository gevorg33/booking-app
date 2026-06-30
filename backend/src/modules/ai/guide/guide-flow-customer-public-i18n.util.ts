import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GuideCorpusLocale } from './ai-guide-corpus-i18n.util.js';
import {
  TOP_CUSTOMER_PUBLIC_GUIDE_FLOWS,
  type CustomerPublicGuideFlowDef,
} from './guide-flow-customer-public-i18n.fixtures.js';

type MessageTree = { [key: string]: string | MessageTree };

const GUIDE_DIR = join(__dirname);

const ARMENIAN_SCRIPT = /[\u0530-\u058F]/;
const CYRILLIC_SCRIPT = /[\u0400-\u04FF]/;

export function customerPublicGuideI18nJsonPath(
  locale: 'hy' | 'ru',
): string {
  return join(GUIDE_DIR, `guide-flow-customer-public-i18n.${locale}.json`);
}

export function loadCustomerPublicGuideI18nJson(
  locale: 'hy' | 'ru',
): MessageTree {
  return JSON.parse(
    readFileSync(customerPublicGuideI18nJsonPath(locale), 'utf8'),
  ) as MessageTree;
}

export function customerPublicGuideFlowKeys(
  flow: CustomerPublicGuideFlowDef,
): string[] {
  return flow.fields.map((field) => `${flow.keyPrefix}.${field}`);
}

export function resolveNestedGuideFlowValue(
  tree: MessageTree,
  dotPath: string,
): string | null {
  const parts = dotPath.replace(/^guide\.flows\./, '').split('.');
  let cur: unknown = tree;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return null;
    cur = (cur as MessageTree)[part];
  }
  return typeof cur === 'string' ? cur : null;
}

export function listTopCustomerPublicGuideFlowKeys(): string[] {
  return TOP_CUSTOMER_PUBLIC_GUIDE_FLOWS.flatMap((flow) =>
    customerPublicGuideFlowKeys(flow),
  );
}

export function guideFlowLocaleHasScript(
  locale: GuideCorpusLocale,
  text: string,
): boolean {
  if (locale === 'hy') return ARMENIAN_SCRIPT.test(text);
  if (locale === 'ru') return CYRILLIC_SCRIPT.test(text);
  return true;
}

export function loadGuideCorpusSnapshot(): Record<
  GuideCorpusLocale,
  MessageTree
> {
  const path = join(GUIDE_DIR, 'dashboard-guide-corpus-i18n.snapshot.json');
  return JSON.parse(readFileSync(path, 'utf8')) as Record<
    GuideCorpusLocale,
    MessageTree
  >;
}
