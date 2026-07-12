import {
  dispatchClinicTestOrderLogicIntent,
  getClinicTestOrderLogicDispatchHandler,
} from './ai-clinic-test-order-dispatch.util.js';
import type { ClinicTestOrderLogicDeps } from './ai-clinic-test-order.logic.js';

/**
 * Regression test for a latent bug found while surveying ai-cmd-ext-0.5's
 * remaining cases: the dashboard classifier rules document
 * 'create_catalog_test_order' as "alias of create_test_order" (same params,
 * same handler), and handleCreateTestOrderLogic always hardcodes
 * action: 'create_test_order' on its result regardless of which key
 * dispatched it — confirming 'create_test_order' is the canonical name.
 * But only 'create_catalog_test_order' was ever wired to a handler; the
 * dashboard's own rescue layer (AiIntentRescueService.tryRescueClinicTestOrder)
 * produces 'create_test_order' directly, which used to fall into the
 * clinic-test-result-ext switch group and throw
 * (coerceClinicTestResultExtIntent rejects any name outside its 4-item
 * union). Fixed by registering 'create_test_order' in the dispatch map
 * alongside its alias.
 */
describe('ai-clinic-test-order dispatch (ai-cmd-ext-0.5)', () => {
  function buildDeps(): ClinicTestOrderLogicDeps {
    return {
      businessRepo: { findOne: jest.fn().mockResolvedValue(null) },
      bookingRepo: { find: jest.fn(), findOne: jest.fn() },
      testTypeRepo: { find: jest.fn() },
      testPanelRepo: { find: jest.fn() },
      clinicTestOrderService: {
        createCatalogOrderForBooking: jest.fn(),
        listLabQueue: jest.fn(),
        listOrdersForBooking: jest.fn(),
      },
      clinicLabAccessService: {
        assertCanCreateManualLabOrder: jest.fn(),
        scopeLabQueueFilters: jest.fn(),
      },
    };
  }

  it('registers a handler for both create_test_order and its alias create_catalog_test_order', () => {
    expect(getClinicTestOrderLogicDispatchHandler('create_test_order')).toBeDefined();
    expect(
      getClinicTestOrderLogicDispatchHandler('create_catalog_test_order'),
    ).toBeDefined();
  });

  it('dispatches create_test_order without throwing and returns action: create_test_order', async () => {
    const deps = buildDeps();
    const result = await dispatchClinicTestOrderLogicIntent(deps, {
      businessId: 'biz-1',
      action: 'create_test_order',
      params: {},
      prompt: 'order a CBC test for Maria',
      userId: 'u1',
      confirmed: false,
    });

    expect(result).not.toBeNull();
    expect(result!.action).toBe('create_test_order');
    expect(result!.success).toBe(false);
    expect(result!.summary).toBe('Business not found.');
  });

  it('dispatches the alias create_catalog_test_order to the identical result shape', async () => {
    const deps = buildDeps();
    const result = await dispatchClinicTestOrderLogicIntent(deps, {
      businessId: 'biz-1',
      action: 'create_catalog_test_order',
      params: {},
      prompt: 'order a CBC test for Maria',
      userId: 'u1',
      confirmed: false,
    });

    expect(result).not.toBeNull();
    expect(result!.action).toBe('create_test_order');
    expect(result!.summary).toBe('Business not found.');
  });

  it('returns null for unrelated actions', async () => {
    const deps = buildDeps();
    const result = await dispatchClinicTestOrderLogicIntent(deps, {
      businessId: 'biz-1',
      action: 'unrelated_action',
      params: {},
      userId: 'u1',
      confirmed: false,
    });

    expect(result).toBeNull();
  });
});
