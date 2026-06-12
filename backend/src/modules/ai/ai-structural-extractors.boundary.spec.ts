import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  STRUCTURAL_EXTRACTORS_FORBIDDEN_PARAPHRASE_SYMBOLS,
  STRUCTURAL_EXTRACTORS_PIPE_MARKER,
  STRUCTURAL_EXTRACTORS_RELATIVE_FILE,
} from './ai-structural-extractors.boundary.js';

const MODULE_DIR = __dirname;

describe('ai-structural-extractors boundary (pipe-1.13.3 / acc-3.14)', () => {
  it('exports pipe marker', () => {
    expect(STRUCTURAL_EXTRACTORS_PIPE_MARKER).toBe('pipe-1.13.3');
  });

  it('structural extractors file omits deprecated paraphrase detectors', () => {
    const content = readFileSync(
      path.join(MODULE_DIR, STRUCTURAL_EXTRACTORS_RELATIVE_FILE),
      'utf8',
    );
    expect(content).toContain(STRUCTURAL_EXTRACTORS_PIPE_MARKER);
    for (const symbol of STRUCTURAL_EXTRACTORS_FORBIDDEN_PARAPHRASE_SYMBOLS) {
      expect(content).not.toMatch(
        new RegExp(`export function ${symbol}\\b`),
      );
    }
  });

  it('deprecated shim re-exports split modules', () => {
    const shim = readFileSync(
      path.join(MODULE_DIR, 'ai-intent-heuristics.ts'),
      'utf8',
    );
    expect(shim).toContain("export * from './ai-structural-extractors.js'");
    expect(shim).toContain("export * from './ai-booking-param-hints.util.js'");
    expect(shim).toContain("export * from './ai-metric-resolvers.util.js'");
    expect(shim).toContain('@deprecated pipe-1.13.3');
  });
});
