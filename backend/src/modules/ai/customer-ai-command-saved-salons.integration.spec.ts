import { FIND_MY_SAVED_SALONS_PROMPTS } from './ai-find-my-saved-salons.fixtures.js';
import { rescueFindMySavedSalonsIntent } from './ai-find-my-saved-salons.util.js';
import { SWITCH_SALON_TENANT_PROMPTS } from './ai-switch-salon-tenant.fixtures.js';
import { rescueSwitchSalonTenantIntent } from './ai-switch-salon-tenant.util.js';

describe('customer-ai-command saved salons integration (ai-cmd-customer-4.17.4)', () => {
  it.each(FIND_MY_SAVED_SALONS_PROMPTS)(
    'rescues find_my_saved_salons for $id',
    ({ prompt }) => {
      expect(rescueFindMySavedSalonsIntent(prompt, 'unknown')?.action).toBe(
        'find_my_saved_salons',
      );
    },
  );

  it.each(SWITCH_SALON_TENANT_PROMPTS)(
    'rescues switch_salon_tenant for $id',
    ({ prompt }) => {
      expect(rescueSwitchSalonTenantIntent(prompt, 'unknown')?.action).toBe(
        'switch_salon_tenant',
      );
    },
  );
});
