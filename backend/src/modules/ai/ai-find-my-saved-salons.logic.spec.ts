import { handleFindMySavedSalonsLogic } from './ai-find-my-saved-salons.logic.js';
import { FIND_MY_SAVED_SALONS_PROMPTS } from './ai-find-my-saved-salons.fixtures.js';

describe('ai-find-my-saved-salons.logic (ai-cmd-customer-4.17.4)', () => {
  it('lists saved salons from client context', async () => {
    const result = await handleFindMySavedSalonsLogic(
      {
        recentSalons: [{ slug: 'demo-salon', name: 'Demo Salon' }],
      },
      'Show my saved salons',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('find_my_saved_salons');
    expect(result.details?.recentSalons).toHaveLength(1);
    expect(result.details?.navigate).toMatchObject({ path: 'tenant_switch' });
  });

  it('explains empty saved salons', async () => {
    const result = await handleFindMySavedSalonsLogic(
      {},
      'Where are my saved salons?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/salon switcher/i);
  });

  it('rejects unrelated prompts', async () => {
    const result = await handleFindMySavedSalonsLogic(
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
  });

  it('builds where aspect summary', async () => {
    const result = await handleFindMySavedSalonsLogic(
      { recentSalons: [{ slug: 'demo-salon', name: 'Demo Salon' }] },
      'Where are my saved salons?',
    );
    expect(result.summary).toMatch(/salon switcher/i);
  });
});
