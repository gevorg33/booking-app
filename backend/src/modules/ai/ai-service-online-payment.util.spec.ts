import {
  SERVICE_ONLINE_PAYMENT_PROMPTS,
  computeServiceDepositAmount,
  describePrepaymentMode,
  enrichServiceOnlinePaymentParamsFromPrompt,
  isConfigureServiceOnlinePaymentPrompt,
  parseServiceOnlinePaymentConfig,
  resolveTargetServicesForOnlinePayment,
} from './ai-service-online-payment.util.js';
import { SERVICE_ONLINE_PAYMENT_MULTILINGUAL_SCENARIOS } from './ai-service-online-payment-multilingual.fixtures.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';

const catalog = [
  {
    id: 's1',
    name: 'Massage',
    businessId: 'biz-1',
    price: 80,
    isActive: true,
    category: { name: 'Massage' },
  },
  {
    id: 's2',
    name: 'Haircut',
    businessId: 'biz-1',
    price: 40,
    isActive: true,
    category: { name: 'Hair' },
  },
  {
    id: 's3',
    name: 'Blowdry',
    businessId: 'biz-1',
    price: 35,
    isActive: true,
    category: { name: 'Hair' },
  },
] as const;

describe('ai-service-online-payment.util', () => {
  it.each(SERVICE_ONLINE_PAYMENT_PROMPTS)(
    'detects configure prompt $id',
    ({ prompt }) => {
      expect(isConfigureServiceOnlinePaymentPrompt(prompt)).toBe(true);
    },
  );

  it.each(SERVICE_ONLINE_PAYMENT_PROMPTS)(
    'parses config for fixture $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseServiceOnlinePaymentConfig(prompt, {});
      expect(parsed).not.toBeNull();
      if (paramsPartial?.allServices) {
        expect(parsed?.allServices).toBe(true);
      }
      if (paramsPartial?.prepaymentMode) {
        expect(parsed?.prepaymentMode).toBe(paramsPartial.prepaymentMode);
      }
      if (paramsPartial?.depositPercent != null) {
        expect(parsed?.depositPercent).toBe(paramsPartial.depositPercent);
      }
      if (paramsPartial?.depositAmount != null) {
        expect(parsed?.depositAmount).toBe(paramsPartial.depositAmount);
      }
      if (paramsPartial?.serviceName) {
        expect(parsed?.serviceName).toBe(paramsPartial.serviceName);
      }
      if (paramsPartial?.serviceNames?.length) {
        expect(parsed?.serviceNames).toEqual(paramsPartial.serviceNames);
      }
      if (paramsPartial?.categoryName) {
        expect(parsed?.categoryName).toBe(paramsPartial.categoryName);
      }
    },
  );

  it.each(SERVICE_ONLINE_PAYMENT_MULTILINGUAL_SCENARIOS)(
    'detects multilingual configure prompt $id',
    ({ prompt }) => {
      expect(isConfigureServiceOnlinePaymentPrompt(prompt)).toBe(true);
    },
  );

  it.each(SERVICE_ONLINE_PAYMENT_MULTILINGUAL_SCENARIOS)(
    'parses multilingual config for fixture $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseServiceOnlinePaymentConfig(prompt, {});
      expect(parsed).not.toBeNull();
      if (paramsPartial?.allServices) {
        expect(parsed?.allServices).toBe(true);
      }
      if (paramsPartial?.prepaymentMode) {
        expect(parsed?.prepaymentMode).toBe(paramsPartial.prepaymentMode);
      }
      if (paramsPartial?.depositPercent != null) {
        expect(parsed?.depositPercent).toBe(paramsPartial.depositPercent);
      }
      if (paramsPartial?.depositAmount != null) {
        expect(parsed?.depositAmount).toBe(paramsPartial.depositAmount);
      }
      if (paramsPartial?.serviceName) {
        expect(parsed?.serviceName).toBe(paramsPartial.serviceName);
      }
      if (paramsPartial?.serviceNames?.length) {
        expect(parsed?.serviceNames).toEqual(paramsPartial.serviceNames);
      }
      if (paramsPartial?.categoryName) {
        expect(parsed?.categoryName).toBe(paramsPartial.categoryName);
      }
    },
  );

  it('does not steal cash-only prompts', () => {
    expect(isConfigureServiceOnlinePaymentPrompt('Enable cash payments')).toBe(
      false,
    );
  });

  it('does not steal checkout defaults for new services', () => {
    expect(
      isConfigureServiceOnlinePaymentPrompt(
        'Set checkout defaults: allow cash at venue and 50% prepayment for new services',
      ),
    ).toBe(false);
    expect(
      isConfigureServiceOnlinePaymentPrompt(
        'Default new services to full prepayment',
      ),
    ).toBe(false);
  });

  it('does not steal public booking page toggle', () => {
    expect(
      isConfigureServiceOnlinePaymentPrompt('Enable online booking page'),
    ).toBe(false);
  });

  it('resolves all services scope', () => {
    const parsed = parseServiceOnlinePaymentConfig(
      'Accept online payment on public booking for all services with 50% prepayment',
      {},
    )!;
    expect(
      resolveTargetServicesForOnlinePayment([...catalog], parsed),
    ).toHaveLength(3);
  });

  it('resolves named services and category scope', () => {
    const named = parseServiceOnlinePaymentConfig(
      'Require online payment on public booking for Haircut and Blowdry with half prepayment',
      {},
    )!;
    expect(
      resolveTargetServicesForOnlinePayment([...catalog], named).map(
        (s) => s.name,
      ),
    ).toEqual(['Haircut', 'Blowdry']);

    const category = parseServiceOnlinePaymentConfig(
      'Accept online payment on public booking for massage services with full prepayment',
      {},
    )!;
    expect(
      resolveTargetServicesForOnlinePayment([...catalog], category).map(
        (s) => s.name,
      ),
    ).toEqual(['Massage']);
  });

  it('computes deposit amounts', () => {
    const half = parseServiceOnlinePaymentConfig(
      'Accept online payment on public booking for all services with 50% prepayment',
      {},
    )!;
    expect(computeServiceDepositAmount(80, half)).toBeNull();

    const quarter = parseServiceOnlinePaymentConfig(
      'Set up online payment on public booking for some services — Facial and Peel — with 25% prepayment',
      {},
    )!;
    expect(computeServiceDepositAmount(80, quarter)).toBe(20);

    const fixed = parseServiceOnlinePaymentConfig(
      'Accept online payment on public booking for Color service with $20 deposit',
      {},
    )!;
    expect(computeServiceDepositAmount(80, fixed)).toBe(20);
  });

  it('describes prepayment modes', () => {
    expect(
      describePrepaymentMode({
        prepaymentMode: PrepaymentMode.FULL,
        allServices: true,
      }),
    ).toBe('full prepayment');
    expect(
      describePrepaymentMode({
        prepaymentMode: PrepaymentMode.DEPOSIT,
        allServices: true,
        depositPercent: 50,
      }),
    ).toBe('50% deposit');
  });

  it('enriches params from prompt', () => {
    const params = enrichServiceOnlinePaymentParamsFromPrompt(
      {},
      'Accept online payment on public booking for all services with 50% prepayment',
    );
    expect(params.allServices).toBe(true);
    expect(params.prepaymentMode).toBe('deposit');
    expect(params.depositPercent).toBe(50);
  });

  it('detects decline prompts separately from accept', () => {
    expect(
      isConfigureServiceOnlinePaymentPrompt(
        'Decline online payment on public booking for Massage',
      ),
    ).toBe(true);
    expect(
      parseServiceOnlinePaymentConfig(
        'Decline online payment on public booking for Massage',
        {},
      )?.prepaymentMode,
    ).toBe('none');
    expect(
      parseServiceOnlinePaymentConfig(
        'Do not accept online payment on public booking for all services',
        {},
      ),
    ).toMatchObject({ allServices: true, prepaymentMode: 'none' });
  });
});
