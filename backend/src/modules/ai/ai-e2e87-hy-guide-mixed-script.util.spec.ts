import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  E2E87_CLEAN_HY_GUIDE_SAMPLES,
  E2E87_CORRUPTED_HY_GUIDE_SAMPLES,
} from './ai-e2e87-hy-guide-mixed-script.fixtures.js';
import { resolveGuideCorpusI18nKey } from './guide/ai-guide-corpus-i18n.util.js';
import { TOP_CUSTOMER_PUBLIC_GUIDE_FLOWS } from './guide/guide-flow-customer-public-i18n.fixtures.js';
import {
  customerPublicGuideFlowKeys,
  guideFlowHyTextHasMixedScriptCorruption,
  guideFlowHyTextIsClean,
  guideFlowLocaleHasScript,
  listCustomerPublicGuideHyCorruptionFindings,
  listGuideFlowsHyCorruptionFindings,
  loadCustomerPublicGuideI18nJson,
  loadGuideCorpusSnapshot,
  resolveNestedGuideFlowValue,
} from './guide/guide-flow-customer-public-i18n.util.js';

describe('e2e-bug.87 hy guide mixed-script QA gate', () => {
  it.each(E2E87_CORRUPTED_HY_GUIDE_SAMPLES)(
    '$id: detector rejects corruption ($reason)',
    ({ text }) => {
      expect(guideFlowHyTextHasMixedScriptCorruption(text)).toBe(true);
      expect(guideFlowHyTextIsClean(text)).toBe(false);
      // Coarse "has Armenian" alone is insufficient — these still match it.
      expect(guideFlowLocaleHasScript('hy', text)).toBe(true);
    },
  );

  it.each(E2E87_CLEAN_HY_GUIDE_SAMPLES)(
    '$id: detector accepts clean Armenian',
    ({ text }) => {
      expect(guideFlowHyTextHasMixedScriptCorruption(text)).toBe(false);
      expect(guideFlowHyTextIsClean(text)).toBe(true);
    },
  );

  it('canonical hy JSON has zero mixed-script findings across all flow fields', () => {
    expect(listCustomerPublicGuideHyCorruptionFindings()).toEqual([]);
  });

  it('snapshot hy matches canonical for every field including steps', () => {
    const canonical = loadCustomerPublicGuideI18nJson('hy');
    const snapshot = loadGuideCorpusSnapshot().hy;
    for (const flow of TOP_CUSTOMER_PUBLIC_GUIDE_FLOWS) {
      for (const key of customerPublicGuideFlowKeys(flow)) {
        const value = resolveNestedGuideFlowValue(canonical, key);
        expect(value).toBeTruthy();
        expect(guideFlowHyTextIsClean(value!)).toBe(true);
        expect(resolveGuideCorpusI18nKey(snapshot, key)).toBe(value);
      }
    }
  });

  it('consumer-app customer/public hy guide-flows copy is clean (sibling corpus)', () => {
    const path = join(
      __dirname,
      '../../../../consumer-app/src/assets/guide-flows-i18n.json',
    );
    const tree = JSON.parse(readFileSync(path, 'utf8')) as {
      hy: { guide: { flows: Record<string, unknown> } };
    };
    const flows = tree.hy.guide.flows;
    const findings: string[] = [];
    const walk = (prefix: string, node: unknown) => {
      if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
          walk(prefix ? `${prefix}.${k}` : k, v);
        }
        return;
      }
      if (typeof node !== 'string') return;
      const surface = prefix.split('.')[0];
      if (surface !== 'customer' && surface !== 'public') return;
      if (!guideFlowHyTextIsClean(node)) {
        findings.push(`${prefix}: ${node.slice(0, 60)}`);
      }
    };
    walk('', flows);
    expect(findings).toEqual([]);
  });

  it('e2e-bug.46: full snapshot hy guide.flows has zero mixed-script findings', () => {
    const flows = loadGuideCorpusSnapshot().hy.guide?.flows;
    expect(flows).toBeTruthy();
    expect(listGuideFlowsHyCorruptionFindings(flows as never)).toEqual([]);
  });

  it.each([
    ['consumer-app', '../../../../consumer-app/src/assets/guide-flows-i18n.json'],
    ['provider-app', '../../../../provider-app/src/assets/guide-flows-i18n.json'],
  ] as const)(
    'e2e-bug.46: %s guide-flows-i18n.json hy block is clean',
    (_label, relPath) => {
      const path = join(__dirname, relPath);
      const tree = JSON.parse(readFileSync(path, 'utf8')) as {
        hy: { guide: { flows: Record<string, unknown> } };
      };
      expect(
        listGuideFlowsHyCorruptionFindings(tree.hy.guide.flows as never),
      ).toEqual([]);
    },
  );

  it('e2e-bug.46: provider canonical hy JSON is clean', () => {
    const path = join(
      __dirname,
      './guide/guide-flow-provider-i18n.hy.json',
    );
    const tree = JSON.parse(readFileSync(path, 'utf8')) as Record<
      string,
      unknown
    >;
    expect(listGuideFlowsHyCorruptionFindings(tree as never)).toEqual([]);
  });
});
