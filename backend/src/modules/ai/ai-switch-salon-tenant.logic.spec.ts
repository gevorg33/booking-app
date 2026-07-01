import { handleSwitchSalonTenantLogic } from './ai-switch-salon-tenant.logic.js';
import { SWITCH_SALON_TENANT_PROMPTS } from './ai-switch-salon-tenant.fixtures.js';

const recentSalons = [
  { slug: 'glow-nails', name: 'Glow Nails' },
  { slug: 'demo-salon', name: 'Demo Salon' },
  { slug: 'bliss-spa', name: 'Bliss Spa' },
];

describe('ai-switch-salon-tenant.logic (ai-cmd-customer-4.17.4)', () => {
  it('navigates to named salon tenant', async () => {
    const result = await handleSwitchSalonTenantLogic(
      { recentSalons, slug: 'demo-salon' },
      'Go back to Glow Nails',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('switch_salon_tenant');
    expect(result.details?.navigate).toEqual({
      path: 'salon',
      query: { slug: 'glow-nails' },
    });
  });

  it('reports already active salon', async () => {
    const result = await handleSwitchSalonTenantLogic(
      { recentSalons, slug: 'glow-nails' },
      'Switch to Glow Nails',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/already/i);
  });

  it('opens tenant switcher when salon is unknown', async () => {
    const result = await handleSwitchSalonTenantLogic(
      { recentSalons, slug: 'demo-salon' },
      'Go back to Missing Salon',
    );
    expect(result.success).toBe(false);
    expect(result.details?.navigate).toMatchObject({ path: 'tenant_switch' });
  });

  it('opens picker when no hint and multiple salons', async () => {
    const result = await handleSwitchSalonTenantLogic(
      { recentSalons, slug: 'demo-salon' },
      'Go back to the other salon I visited',
    );
    expect(result.details?.navigate).toMatchObject({ path: 'tenant_switch' });
  });

  it('clarifies ambiguous salon matches', async () => {
    const result = await handleSwitchSalonTenantLogic(
      {
        recentSalons: [
          { slug: 'glow-nails', name: 'Glow Nails Downtown' },
          { slug: 'glow-spa', name: 'Glow Nails Uptown' },
        ],
        slug: 'demo-salon',
      },
      'Switch to Glow Nails',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/Multiple saved salons/);
  });

  it('rejects unrelated prompts', async () => {
    const result = await handleSwitchSalonTenantLogic({}, 'Book a haircut');
    expect(result.success).toBe(false);
  });
});
