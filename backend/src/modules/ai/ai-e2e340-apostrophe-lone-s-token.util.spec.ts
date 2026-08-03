import {
  E2E340_CASES,
  E2E340_CATALOG,
} from './ai-e2e340-apostrophe-lone-s-token.fixtures.js';
import { extractServiceFromPrompt } from './ai-structural-extractors.js';

describe('e2e-bug.340: apostrophe-possessive catalog names do not fragment into a spurious lone "s" token', () => {
  it.each(E2E340_CASES.map((row) => [row.id, row] as const))(
    '%s',
    (_id, row) => {
      const result = extractServiceFromPrompt(row.prompt, [
        ...E2E340_CATALOG,
      ]);
      expect(result?.id).toBe(row.expectedServiceId);
    },
  );
});
