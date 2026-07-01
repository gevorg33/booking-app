import {
  SWITCH_SALON_TENANT_PROMPTS,
  SWITCH_SALON_TENANT_RESCUE_SCENARIOS,
} from './ai-switch-salon-tenant.fixtures.js';
import { SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS } from './ai-switch-salon-tenant-multilingual.fixtures.js';
import { isFindMySavedSalonsPrompt } from './ai-find-my-saved-salons.util.js';
import {
  hasSwitchSalonTenantCue,
  buildSwitchSalonTenantNavigate,
  isSwitchSalonTenantIntent,
  isSwitchSalonTenantPrompt,
  parseSwitchSalonTenantFromPrompt,
  rescueSwitchSalonTenantIntent,
} from './ai-switch-salon-tenant.util.js';

describe('ai-switch-salon-tenant.util (ai-cmd-customer-4.17.4)', () => {
  it.each(SWITCH_SALON_TENANT_PROMPTS)('detects prompt $id', ({ prompt }) => {
    expect(isSwitchSalonTenantPrompt(prompt)).toBe(true);
    expect(parseSwitchSalonTenantFromPrompt(prompt)).not.toBeNull();
  });

  it.each(SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt }) => {
      expect(isSwitchSalonTenantPrompt(prompt)).toBe(true);
    },
  );

  it.each(SWITCH_SALON_TENANT_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueSwitchSalonTenantIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'switch_salon_tenant',
      });
    },
  );

  it('does not steal find_my_saved_salons list prompts', () => {
    expect(isSwitchSalonTenantPrompt('Show my saved salons')).toBe(false);
    expect(isFindMySavedSalonsPrompt('Show my saved salons')).toBe(true);
  });

  it('builds cross-tenant navigate', () => {
    expect(buildSwitchSalonTenantNavigate('demo-salon')).toEqual({
      path: 'salon',
      query: { slug: 'demo-salon' },
    });
  });

  it('parses salon slug params', () => {
    expect(
      parseSwitchSalonTenantFromPrompt('Switch to demo-salon', {
        salonSlug: 'demo-salon',
      }),
    ).toMatchObject({ salonSlug: 'demo-salon' });
  });

  it('covers hasSwitchSalonTenantCue', () => {
    expect(hasSwitchSalonTenantCue('Go back to Glow Nails')).toBe(true);
  });
});
