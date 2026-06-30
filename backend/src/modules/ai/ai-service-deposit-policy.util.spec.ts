import {
  CONFIGURE_SERVICE_DEPOSIT_POLICY_PROMPTS,
  computeDepositPolicyAmount,
  describeServiceDepositPolicy,
  enrichServiceDepositPolicyParamsFromPrompt,
  isConfigureServiceDepositPolicyPrompt,
  parseServiceDepositPolicyConfig,
  rescueConfigureServiceDepositPolicyIntent,
  resolveServiceDepositPolicyAccessTier,
  resolveTargetServicesForDepositPolicy,
} from './ai-service-deposit-policy.util.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';

describe('ai-service-deposit-policy.util', () => {
  it.each(CONFIGURE_SERVICE_DEPOSIT_POLICY_PROMPTS)(
    'detects configure service deposit policy prompt $id',
    ({ prompt }) => {
      expect(isConfigureServiceDepositPolicyPrompt(prompt)).toBe(true);
    },
  );

  it.each(CONFIGURE_SERVICE_DEPOSIT_POLICY_PROMPTS)(
    'parses configure service deposit policy fixture $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseServiceDepositPolicyConfig(prompt, {});
      expect(parsed).not.toBeNull();
      expect(parsed?.prepaymentMode).toBe(PrepaymentMode.DEPOSIT);
      if (paramsPartial?.serviceTier) {
        expect(parsed?.serviceTier).toBe(paramsPartial.serviceTier);
      }
      if (paramsPartial?.featuredOnly) {
        expect(parsed?.featuredOnly).toBe(true);
      }
      if (paramsPartial?.categoryName) {
        expect(parsed?.categoryName?.toLowerCase()).toContain(
          String(paramsPartial.categoryName).toLowerCase(),
        );
      }
      if (paramsPartial?.depositPercent !== undefined) {
        expect(parsed?.depositPercent).toBe(paramsPartial.depositPercent);
      }
      if (paramsPartial?.depositAmount !== undefined) {
        expect(parsed?.depositAmount).toBe(paramsPartial.depositAmount);
      }
      if (paramsPartial?.allServices) {
        expect(parsed?.allServices).toBe(true);
      }
      if (paramsPartial?.serviceNames) {
        expect(parsed?.serviceNames).toEqual(paramsPartial.serviceNames);
      }
    },
  );

  it.each(CONFIGURE_SERVICE_DEPOSIT_POLICY_PROMPTS)(
    'rescues unknown action to configure_service_deposit_policy for $id',
    ({ prompt, expectedAction }) => {
      expect(rescueConfigureServiceDepositPolicyIntent(prompt, 'unknown')).toEqual({
        action: expectedAction,
        rescueReason: expectedAction,
      });
    },
  );

  it('does not treat generic online payment as deposit policy', () => {
    expect(
      isConfigureServiceDepositPolicyPrompt(
        'Accept online payment on public booking for all services with 50% prepayment',
      ),
    ).toBe(false);
  });

  it('does not treat checkout defaults as deposit policy', () => {
    expect(
      isConfigureServiceDepositPolicyPrompt(
        'Default new services to 50% deposit',
      ),
    ).toBe(false);
  });

  it('resolves premium tier and featured scopes', () => {
    const catalog = [
      {
        id: '1',
        name: 'Deluxe Massage',
        isActive: true,
        metadata: { serviceTier: 'premium' },
        category: { name: 'Massage' },
      },
      {
        id: '2',
        name: 'Basic Massage',
        isActive: true,
        metadata: { serviceTier: 'standard' },
        category: { name: 'Massage' },
      },
      {
        id: '3',
        name: 'Featured Facial',
        isActive: true,
        metadata: { isFeatured: true },
        category: { name: 'Facial' },
      },
    ] as any[];

    const premium = resolveTargetServicesForDepositPolicy(catalog, {
      prepaymentMode: PrepaymentMode.DEPOSIT,
      serviceTier: 'premium',
    });
    expect(premium.map((s) => s.id)).toEqual(['1']);

    const featured = resolveTargetServicesForDepositPolicy(catalog, {
      prepaymentMode: PrepaymentMode.DEPOSIT,
      featuredOnly: true,
    });
    expect(featured.map((s) => s.id)).toEqual(['3']);

    const premiumMassage = resolveTargetServicesForDepositPolicy(catalog, {
      prepaymentMode: PrepaymentMode.DEPOSIT,
      serviceTier: 'premium',
      categoryName: 'massage',
    });
    expect(premiumMassage.map((s) => s.id)).toEqual(['1']);
  });

  it('enriches params from prompt', () => {
    const enriched = enrichServiceDepositPolicyParamsFromPrompt(
      {},
      'Set 30% deposit on premium tier services',
    );
    expect(enriched.serviceTier).toBe('premium');
    expect(enriched.depositPercent).toBe(30);
  });

  it('computes fixed deposit amount per service price', () => {
    const config = parseServiceDepositPolicyConfig(
      'Require $25 deposit on featured services',
      {},
    )!;
    expect(computeDepositPolicyAmount(80, config)).toBe(25);
    expect(computeDepositPolicyAmount(20, config)).toBe(20);
  });

  it('resolves access tier for dashboard mutate intent', () => {
    expect(
      resolveServiceDepositPolicyAccessTier('configure_service_deposit_policy'),
    ).toBe('M');
    expect(resolveServiceDepositPolicyAccessTier('list_services')).toBeNull();
  });

  it('describes deposit policy labels', () => {
    expect(
      describeServiceDepositPolicy({
        prepaymentMode: PrepaymentMode.DEPOSIT,
        depositAmount: 15,
        featuredOnly: true,
      }),
    ).toBe('$15 deposit');
    expect(
      describeServiceDepositPolicy({
        prepaymentMode: PrepaymentMode.DEPOSIT,
        depositPercent: 25,
        serviceTier: 'premium',
      }),
    ).toBe('25% deposit');
    expect(
      describeServiceDepositPolicy({
        prepaymentMode: PrepaymentMode.DEPOSIT,
        serviceTier: 'premium',
      }),
    ).toBe('50% deposit');
  });

  it('parses explicit params when forced', () => {
    const parsed = parseServiceDepositPolicyConfig('', {
      _forceDepositPolicy: true,
      featuredOnly: true,
      depositAmount: 10,
    });
    expect(parsed).toEqual(
      expect.objectContaining({
        featuredOnly: true,
        depositAmount: 10,
        prepaymentMode: PrepaymentMode.DEPOSIT,
      }),
    );
  });

  it('resolves all-services scope within tier filter', () => {
    const catalog = [
      {
        id: '1',
        name: 'Premium A',
        isActive: true,
        metadata: { serviceTier: 'premium' },
      },
      {
        id: '2',
        name: 'Premium B',
        isActive: true,
        metadata: { serviceTier: 'premium' },
      },
    ] as any[];
    const targets = resolveTargetServicesForDepositPolicy(catalog, {
      prepaymentMode: PrepaymentMode.DEPOSIT,
      serviceTier: 'premium',
      allServices: true,
    });
    expect(targets).toHaveLength(2);
  });

  it('resolves named services within featured scope', () => {
    const catalog = [
      {
        id: '1',
        name: 'Haircut',
        isActive: true,
        metadata: { isFeatured: true },
      },
      {
        id: '2',
        name: 'Blowdry',
        isActive: true,
        metadata: { isFeatured: true },
      },
      {
        id: '3',
        name: 'Trim',
        isActive: true,
        metadata: { isFeatured: false },
      },
    ] as any[];

    const parsed = parseServiceDepositPolicyConfig(
      'Require $10 deposit on featured Haircut and Blowdry services',
      {},
    )!;
    const targets = resolveTargetServicesForDepositPolicy(catalog, parsed);
    expect(targets.map((s) => s.id)).toEqual(['1', '2']);
  });
});
