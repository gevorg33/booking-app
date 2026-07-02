import { PrepaymentMode } from '../service/entities/service.entity.js';
import { handleConfigureCheckoutDefaultsLogic } from './ai-checkout-defaults.logic.js';
import { CONFIGURE_CHECKOUT_DEFAULTS_PROMPTS } from './ai-checkout-defaults.fixtures.js';

function buildDeps(
  business: Record<string, unknown> = { id: 'biz-1', settings: {} },
) {
  const saved: Record<string, unknown>[] = [];
  return {
    deps: {
      businessRepo: {
        findOne: jest.fn(async () => business),
        save: jest.fn(async (value: Record<string, unknown>) => {
          saved.push(value);
          Object.assign(business, value);
          return value;
        }),
      },
    },
    business,
    saved,
  };
}

describe('ai-checkout-defaults.logic', () => {
  it.each(CONFIGURE_CHECKOUT_DEFAULTS_PROMPTS.slice(0, 4))(
    'persists checkout defaults for fixture $id',
    async ({ prompt }) => {
      const { deps, business } = buildDeps();
      const result = await handleConfigureCheckoutDefaultsLogic(
        deps,
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('configure_checkout_defaults');
      expect(deps.businessRepo.save).toHaveBeenCalled();
      expect(business.settings).toBeDefined();
    },
  );

  it('sets cash and default prepayment together', async () => {
    const { deps, business } = buildDeps();
    const result = await handleConfigureCheckoutDefaultsLogic(
      deps,
      'biz-1',
      {},
      'Set checkout defaults: allow cash at venue and 50% prepayment for new services',
    );
    expect(result.success).toBe(true);
    const publicBooking = (business.settings as any).publicBooking;
    expect(publicBooking.acceptCashPayments).toBe(true);
    expect(publicBooking.defaultServicePrepaymentMode).toBe('deposit');
    expect(publicBooking.defaultServiceDepositPercent).toBe(50);
    expect(result.details?.navigate).toEqual({
      path: '/dashboard/billing',
      label: 'Open Billing & checkout defaults',
    });
  });

  it('sets default prepayment only for new services', async () => {
    const { deps, business } = buildDeps({
      id: 'biz-1',
      settings: { publicBooking: { acceptCashPayments: true } },
    });
    const result = await handleConfigureCheckoutDefaultsLogic(
      deps,
      'biz-1',
      {},
      'Default new services to full prepayment',
    );
    expect(result.success).toBe(true);
    const publicBooking = (business.settings as any).publicBooking;
    expect(publicBooking.acceptCashPayments).toBe(true);
    expect(publicBooking.defaultServicePrepaymentMode).toBe(
      PrepaymentMode.FULL,
    );
    expect(result.details?.navigate).toEqual({
      path: '/dashboard/services',
      label: 'Open Services',
    });
  });

  it('clarifies when prompt is ambiguous', async () => {
    const result = await handleConfigureCheckoutDefaultsLogic(
      buildDeps().deps,
      'biz-1',
      {},
      'hello world',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails when business is missing', async () => {
    const deps = {
      businessRepo: {
        findOne: jest.fn(async () => null),
        save: jest.fn(),
      },
    };
    const result = await handleConfigureCheckoutDefaultsLogic(
      deps as any,
      'missing',
      {},
      'Default new services to full prepayment',
    );
    expect(result.success).toBe(false);
  });
});
