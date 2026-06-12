import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DETERMINISTIC_SEMANTIC_BOUNDARY_MARKER,
  DETERMINISTIC_SEMANTIC_UTIL_FILE,
  SEMANTIC_INTENT_DETERMINISTIC_BOUNDARY_DOC,
} from './ai-semantic-intent.deterministic.boundary.js';

const MODULE_DIR = __dirname;
const REPO_ROOT = join(MODULE_DIR, '../../../..');

describe('ai-semantic-intent deterministic boundary (pipe-1.4.4)', () => {
  it('boundary doc describes token cosine CI fallback', () => {
    const doc = readFileSync(
      join(REPO_ROOT, SEMANTIC_INTENT_DETERMINISTIC_BOUNDARY_DOC),
      'utf8',
    );
    expect(doc).toContain(DETERMINISTIC_SEMANTIC_BOUNDARY_MARKER);
    expect(doc).toMatch(/token cosine/i);
    expect(doc).toMatch(/NODE_ENV=test/i);
  });

  it('util exports deterministic fallback gate and token cosine scorer', () => {
    const source = readFileSync(
      join(MODULE_DIR, DETERMINISTIC_SEMANTIC_UTIL_FILE),
      'utf8',
    );
    expect(source).toContain(DETERMINISTIC_SEMANTIC_BOUNDARY_MARKER);
    expect(source).toContain('shouldUseDeterministicSemanticFallback');
    expect(source).toContain('scoreTokenCosineBetweenPhrases');
    expect(source).toContain('rankAnchorsDeterministic');
  });
});
