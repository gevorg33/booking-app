import { NARROW_SHORTLIST_SCENARIOS } from './narrow-intent-shortlist.fixtures.js';

describe('narrow-intent-shortlist.fixtures (pipe-1.4.7)', () => {
  it('has unique scenario ids', () => {
    const ids = NARROW_SHORTLIST_SCENARIOS.map((scenario) => scenario.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
