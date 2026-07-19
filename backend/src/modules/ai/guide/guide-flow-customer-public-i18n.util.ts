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
/** Any Latin letter — hy customer/public guide copy must be fully Armenian. */
const LATIN_LETTER = /[A-Za-z]/;
/**
 * Intentional product loanwords kept in Latin in otherwise-Armenian guide copy
 * (email/SMS login, AI assistant). Corruption checks strip these first.
 */
const HY_GUIDE_ALLOWED_LATIN_TOKENS = /\b(?:email|SMS|AI)\b/g;
/** Template placeholders like `{customerName}` are not mixed-script corruption. */
const HY_GUIDE_PLACEHOLDERS = /\{[A-Za-z][A-Za-z0-9_]*\}/g;

export function customerPublicGuideI18nJsonPath(locale: 'hy' | 'ru'): string {
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

/**
 * e2e-bug.87 / e2e-bug.46 — hy guide strings that still contain Latin letters
 * and/or Cyrillic (mixed-script garbage / transliteration leftovers).
 * Title/summary-only "has some Armenian" checks are insufficient: corrupted
 * steps still match that. Allowed whole-word loanwords (email, SMS, AI) and
 * `{placeholder}` tokens are ignored.
 */
export function guideFlowHyTextHasMixedScriptCorruption(text: string): boolean {
  if (!text.trim()) return false;
  const withoutLoanwords = text
    .replace(HY_GUIDE_PLACEHOLDERS, '')
    .replace(HY_GUIDE_ALLOWED_LATIN_TOKENS, '');
  return (
    LATIN_LETTER.test(withoutLoanwords) || CYRILLIC_SCRIPT.test(withoutLoanwords)
  );
}

/** Clean hy guide copy: Armenian present, no Latin/Cyrillic (loanwords/placeholders ok). */
export function guideFlowHyTextIsClean(text: string): boolean {
  if (!text.trim()) return false;
  return (
    ARMENIAN_SCRIPT.test(text) && !guideFlowHyTextHasMixedScriptCorruption(text)
  );
}

export function listCustomerPublicGuideHyCorruptionFindings(
  tree: MessageTree = loadCustomerPublicGuideI18nJson('hy'),
): Array<{ key: string; sample: string }> {
  const findings: Array<{ key: string; sample: string }> = [];
  for (const key of listTopCustomerPublicGuideFlowKeys()) {
    const value = resolveNestedGuideFlowValue(tree, key);
    if (value == null) {
      findings.push({ key, sample: '<missing>' });
      continue;
    }
    if (!guideFlowHyTextIsClean(value)) {
      findings.push({
        key,
        sample: value.length > 80 ? `${value.slice(0, 80)}…` : value,
      });
    }
  }
  return findings;
}

/** Walk every string under a guide.flows tree (e2e-bug.46 full-corpus gate). */
export function listGuideFlowsHyCorruptionFindings(
  flows: MessageTree,
  prefix = '',
): Array<{ key: string; sample: string }> {
  const findings: Array<{ key: string; sample: string }> = [];
  const walk = (node: unknown, path: string) => {
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node as MessageTree)) {
        walk(v, path ? `${path}.${k}` : k);
      }
      return;
    }
    if (typeof node !== 'string') return;
    if (!guideFlowHyTextIsClean(node)) {
      findings.push({
        key: path,
        sample: node.length > 80 ? `${node.slice(0, 80)}…` : node,
      });
    }
  };
  walk(flows, prefix);
  return findings;
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
