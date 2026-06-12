import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  clearIntentAnchorBankCache,
  getIntentAnchorBank,
} from './intent-anchor.bank.js';
import {
  INTENT_ANCHOR_BANK_DATA_FILES,
  INTENT_ANCHOR_BOUNDARY_MARKER,
  INTENT_ANCHOR_FORBIDDEN_ENTITY_TOKENS,
} from './intent-anchor.bank.boundary.js';
import {
  findAnchorsWithNonGenericPhrases,
  findConceptGroupsWithEntityNames,
} from './intent-anchor.bank.util.js';

const AI_MODULE_DIR = join(__dirname);

describe('intent-anchor.bank.boundary (pipe-1.4.1)', () => {
  afterEach(() => {
    clearIntentAnchorBankCache();
  });

  it('data files include pipe-1.4.1 boundary marker', () => {
    for (const file of INTENT_ANCHOR_BANK_DATA_FILES) {
      const source = readFileSync(join(AI_MODULE_DIR, file), 'utf8');
      expect(source).toContain(INTENT_ANCHOR_BOUNDARY_MARKER);
    }
  });

  it('runtime bank has no forbidden entity tokens in phrases', () => {
    const bank = getIntentAnchorBank();
    expect(findAnchorsWithNonGenericPhrases(bank)).toEqual([]);
    expect(findConceptGroupsWithEntityNames(bank)).toEqual([]);
  });

  it('canonical bank source excludes hard-coded person names', () => {
    const phrasingSource = readFileSync(
      join(AI_MODULE_DIR, 'intent-phrasing.bank.ts'),
      'utf8',
    );
    for (const token of INTENT_ANCHOR_FORBIDDEN_ENTITY_TOKENS) {
      expect(
        new RegExp(`\\b${token}\\b`, 'i').test(phrasingSource),
      ).toBe(false);
    }
  });
});
