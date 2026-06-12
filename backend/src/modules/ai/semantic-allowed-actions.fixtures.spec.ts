import { SEMANTIC_ALLOWED_ACTIONS_SCENARIOS } from './semantic-allowed-actions.fixtures.js';

describe('semantic-allowed-actions.fixtures (pipe-1.4.6)', () => {
  it('has unique scenario ids', () => {
    const ids = SEMANTIC_ALLOWED_ACTIONS_SCENARIOS.map((scenario) => scenario.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers all four surfaces', () => {
    const surfaces = new Set(
      SEMANTIC_ALLOWED_ACTIONS_SCENARIOS.map((scenario) => scenario.surface),
    );
    expect(surfaces).toEqual(
      new Set(['dashboard', 'customer', 'public', 'provider']),
    );
  });
});
