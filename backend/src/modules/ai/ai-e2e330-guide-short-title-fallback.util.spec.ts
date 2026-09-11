import { E2E330_HUMANIZE_CASES } from './ai-e2e330-guide-short-title-fallback.fixtures.js';
import { humanizeGuideStepTitle } from './guide/guide-flow.corpus.util.js';
import { listAllGuideFlowPlaybookDefs } from './guide/guide-flow.loader.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';

type MessageTree = { [key: string]: string | MessageTree };
function resolveKey(messages: MessageTree, key: string): string | null {
  const parts = key.split('.');
  let cur: unknown = messages;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return null;
    cur = (cur as MessageTree)[part];
  }
  return typeof cur === 'string' ? cur : null;
}

const TRAILING_STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'to',
  'with',
  'and',
  'or',
  'but',
  'when',
  'then',
  'like',
  'before',
  'after',
  'once',
  'so',
  'that',
  'on',
  'at',
  'in',
  'of',
  'for',
  'against',
  'is',
  'are',
  'was',
  'were',
  'my',
  'your',
  'our',
  'their',
  'its',
  'if',
  'կամ',
  'և',
  'եթե',
  'и',
  'или',
  'если',
  'чтобы',
  'для',
  'к',
  'в',
  'с',
  'по',
  'при',
  'на',
  'до',
  'после',
]);

function stripPunct(word: string): string {
  return word.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
}

describe('e2e-bug.330: guide short-title fallback stops on a real word', () => {
  it.each(E2E330_HUMANIZE_CASES)('$id', ({ title, body, expected }) => {
    expect(humanizeGuideStepTitle(title, body)).toBe(expected);
  });

  it('regresses no playbook step across en/hy/ru into a dangling trailing stopword or bare dash', () => {
    const playbooks = listAllGuideFlowPlaybookDefs();
    const violations: string[] = [];
    for (const locale of ['en', 'hy', 'ru'] as const) {
      const messages = getFrontendGuideCorpusMessages(locale);
      for (const pb of playbooks) {
        for (const step of pb.steps) {
          if (step.shortTitleKey) continue; // curated titles are out of scope
          const title = resolveKey(messages, step.titleKey) ?? step.titleKey;
          const body = resolveKey(messages, step.bodyKey) ?? step.bodyKey;
          const humanized = humanizeGuideStepTitle(title, body);
          const words = humanized.split(/\s+/).filter(Boolean);
          const last = words[words.length - 1] ?? '';
          const bad =
            TRAILING_STOPWORDS.has(stripPunct(last)) || /^[—–→]+$/u.test(last);
          if (bad) {
            violations.push(
              `${locale}:${pb.topicId}:${step.titleKey} -> "${humanized}"`,
            );
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('never returns an empty or lowercase-only-fallback string for the 41 e2e-bug.330 playbooks', () => {
    const playbooks = listAllGuideFlowPlaybookDefs();
    const missing = playbooks.filter((pb) =>
      pb.steps.some((s) => !s.shortTitleKey),
    );
    expect(missing.length).toBeGreaterThanOrEqual(41);
    const messages = getFrontendGuideCorpusMessages('en');
    for (const pb of missing) {
      for (const step of pb.steps) {
        const title = resolveKey(messages, step.titleKey) ?? step.titleKey;
        const body = resolveKey(messages, step.bodyKey) ?? step.bodyKey;
        const humanized = humanizeGuideStepTitle(title, body);
        expect(humanized.trim().length).toBeGreaterThan(0);
        expect(humanized[0]).toBe(humanized[0]?.toLocaleUpperCase());
      }
    }
  });
});
