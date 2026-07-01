import { resolveGuideCorpusI18nKey } from './ai-guide-corpus-i18n.util.js';
import { TOP_CUSTOMER_PUBLIC_GUIDE_FLOWS } from './guide-flow-customer-public-i18n.fixtures.js';
import {
  customerPublicGuideFlowKeys,
  guideFlowLocaleHasScript,
  loadCustomerPublicGuideI18nJson,
  loadGuideCorpusSnapshot,
  resolveNestedGuideFlowValue,
} from './guide-flow-customer-public-i18n.util.js';

describe('guide-flow customer/public locale parity (ai-guide-1.5.5)', () => {
  const snapshot = loadGuideCorpusSnapshot();
  const hyCanonical = loadCustomerPublicGuideI18nJson('hy');
  const ruCanonical = loadCustomerPublicGuideI18nJson('ru');
  const enMessages = snapshot.en;

  it.each(TOP_CUSTOMER_PUBLIC_GUIDE_FLOWS.map((f) => [f.id, f] as const))(
    'canonical RU JSON matches snapshot for flow %s',
    (_id, flow) => {
      for (const key of customerPublicGuideFlowKeys(flow)) {
        const canonical = resolveNestedGuideFlowValue(ruCanonical, key);
        const snap = resolveGuideCorpusI18nKey(snapshot.ru, key);
        expect(canonical).toBeTruthy();
        expect(snap).toBe(canonical);
      }
    },
  );

  it.each(TOP_CUSTOMER_PUBLIC_GUIDE_FLOWS.map((f) => [f.id, f] as const))(
    'canonical HY JSON matches snapshot for flow %s',
    (_id, flow) => {
      for (const key of customerPublicGuideFlowKeys(flow)) {
        const canonical = resolveNestedGuideFlowValue(hyCanonical, key);
        const snap = resolveGuideCorpusI18nKey(snapshot.hy, key);
        expect(canonical).toBeTruthy();
        expect(snap).toBe(canonical);
      }
    },
  );

  it.each(TOP_CUSTOMER_PUBLIC_GUIDE_FLOWS.map((f) => [f.id, f] as const))(
    'HY title and summary use Armenian script and differ from EN for flow %s',
    (_id, flow) => {
      for (const field of ['title', 'summary'] as const) {
        if (!flow.fields.includes(field)) continue;
        const key = `${flow.keyPrefix}.${field}`;
        const hy = resolveGuideCorpusI18nKey(snapshot.hy, key);
        const en = resolveGuideCorpusI18nKey(enMessages, key);
        expect(hy).toBeTruthy();
        expect(en).toBeTruthy();
        expect(guideFlowLocaleHasScript('hy', hy!)).toBe(true);
        expect(hy).not.toBe(en);
      }
    },
  );

  it.each(TOP_CUSTOMER_PUBLIC_GUIDE_FLOWS.map((f) => [f.id, f] as const))(
    'RU title and summary use Cyrillic and differ from EN for flow %s',
    (_id, flow) => {
      for (const field of ['title', 'summary'] as const) {
        if (!flow.fields.includes(field)) continue;
        const key = `${flow.keyPrefix}.${field}`;
        const ru = resolveGuideCorpusI18nKey(snapshot.ru, key);
        const en = resolveGuideCorpusI18nKey(enMessages, key);
        expect(ru).toBeTruthy();
        expect(en).toBeTruthy();
        expect(guideFlowLocaleHasScript('ru', ru!)).toBe(true);
        expect(ru).not.toBe(en);
      }
    },
  );

  it('covers exactly 20 top customer/public guide flows', () => {
    expect(TOP_CUSTOMER_PUBLIC_GUIDE_FLOWS).toHaveLength(20);
  });
});
