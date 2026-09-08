import {
  FAST_HEURISTIC_ALLOWED_IMPORT_MODULES,
  FAST_HEURISTIC_BOUNDARY_RELATIVE_FILES,
  FAST_HEURISTIC_FORBIDDEN_PARAPHRASE_SYMBOLS,
  FAST_INTENT_HEURISTICS_BOUNDARY_DOC,
} from './fast-intent-heuristics.boundary.js';
import {
  listDelegationImports,
  checkFastIntentHeuristicsBoundary,
} from './fast-intent-heuristics-boundary-gate.util.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const MODULE_DIR = __dirname;
const REPO_ROOT = path.resolve(MODULE_DIR, '../../../..');

describe('fast-intent-heuristics boundary gate (pipe-1.2.3 / acc-3.14)', () => {
  it('boundary doc exists and states routing + structural scope', () => {
    const docPath = path.join(REPO_ROOT, FAST_INTENT_HEURISTICS_BOUNDARY_DOC);
    const doc = readFileSync(docPath, 'utf8');
    expect(doc).toContain('pipe-1.2.3');
    expect(doc).toContain('acc-3.14');
    expect(doc).toMatch(/routing/i);
    expect(doc).toMatch(/structural/i);
    expect(doc).toMatch(/paraphrase/i);
    expect(doc).toContain('AiSemanticIntentService');
    expect(doc).toContain('AiIntentRescueService');
  });

  it('allowlist covers current fast-heuristics delegation imports', () => {
    for (const rel of FAST_HEURISTIC_BOUNDARY_RELATIVE_FILES) {
      const content = readFileSync(path.join(MODULE_DIR, rel), 'utf8');
      // §229 — use the gate's own scanner rather than a second copy of the
      // regex. The duplicate is what kept this test red after the checker
      // learned to ignore `import type`.
      const imports = listDelegationImports(content);
      for (const mod of imports) {
        expect(FAST_HEURISTIC_ALLOWED_IMPORT_MODULES).toContain(mod);
      }
    }
  });

  it.each(FAST_HEURISTIC_BOUNDARY_RELATIVE_FILES)(
    'production file %s passes acc-3.14 guard',
    () => {
      const violations = checkFastIntentHeuristicsBoundary(MODULE_DIR);
      expect(violations).toEqual([]);
    },
  );

  it('documents acc-3.14 paraphrase symbols that must stay out of fast heuristics', () => {
    expect(FAST_HEURISTIC_FORBIDDEN_PARAPHRASE_SYMBOLS).toContain(
      'isFirstAvailableBookingPrompt',
    );
    expect(FAST_HEURISTIC_FORBIDDEN_PARAPHRASE_SYMBOLS).toContain(
      'isTeamWideProviderAvailabilityQuery',
    );
  });
});
