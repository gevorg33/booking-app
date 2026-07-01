import {
  FIND_MY_SAVED_SALONS_PROMPTS,
  FIND_MY_SAVED_SALONS_RESCUE_SCENARIOS,
} from './ai-find-my-saved-salons.fixtures.js';
import { FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS } from './ai-find-my-saved-salons-multilingual.fixtures.js';
import { isSwitchSalonTenantPrompt } from './ai-switch-salon-tenant.util.js';
import {
  buildFindMySavedSalonsNavigate,
  buildFindMySavedSalonsSummary,
  isFindMySavedSalonsIntent,
  isFindMySavedSalonsPrompt,
  parseFindMySavedSalonsFromPrompt,
  rescueFindMySavedSalonsIntent,
} from './ai-find-my-saved-salons.util.js';

describe('ai-find-my-saved-salons.util (ai-cmd-customer-4.17.4)', () => {
  it.each(FIND_MY_SAVED_SALONS_PROMPTS)('detects prompt $id', ({ prompt }) => {
    expect(isFindMySavedSalonsPrompt(prompt)).toBe(true);
    expect(parseFindMySavedSalonsFromPrompt(prompt)).not.toBeNull();
  });

  it.each(FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt }) => {
      expect(isFindMySavedSalonsPrompt(prompt)).toBe(true);
    },
  );

  it.each(FIND_MY_SAVED_SALONS_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueFindMySavedSalonsIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'find_my_saved_salons',
      });
    },
  );

  it('does not steal switch_salon_tenant prompts', () => {
    expect(isFindMySavedSalonsPrompt('Go back to Glow Nails')).toBe(false);
    expect(isSwitchSalonTenantPrompt('Go back to Glow Nails')).toBe(true);
  });

  it('builds summary and navigate', () => {
    expect(
      buildFindMySavedSalonsSummary({
        aspect: 'list',
        recentSalons: [{ name: 'Demo Salon' }],
      }),
    ).toMatch(/Demo Salon/);
    expect(buildFindMySavedSalonsNavigate()).toEqual({
      path: 'tenant_switch',
      query: {},
    });
  });

  it('infers aspect heuristics', () => {
    expect(
      parseFindMySavedSalonsFromPrompt('Where are my saved salons'),
    ).toMatchObject({
      aspect: 'where',
    });
  });

  it('returns null for invalid prompt', () => {
    expect(
      parseFindMySavedSalonsFromPrompt('Go back to Glow Nails'),
    ).toBeNull();
  });
});
