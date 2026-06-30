import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_PROMPTS,
  UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_RESCUE_SCENARIOS,
} from './ai-update-service-prices-online-payment-filter.fixtures.js';
import { prepareUpdateServicePricesPlanLogic } from './ai-operations.logic.js';
import { rescueUpdateServicePricesOnlinePaymentFilterIntent } from './ai-update-service-prices-online-payment-filter.util.js';

const deps = {
  planBuilder: {
    wrapOperationsPlan: (
      businessId: string,
      intent: string,
      steps: unknown[],
      meta: unknown,
    ) => ({ businessId, intent, steps, meta }),
  },
} as any;

const services = [
  {
    id: 'cash',
    name: 'Walk-in Trim',
    price: 20,
    prepaymentMode: PrepaymentMode.NONE,
    category: { name: 'Hair' },
  },
  {
    id: 'online-full',
    name: 'Deluxe Facial',
    price: 100,
    prepaymentMode: PrepaymentMode.FULL,
    onlinePaymentEnabled: true,
    category: { name: 'Skin' },
  },
  {
    id: 'online-deposit',
    name: 'Swedish Massage',
    price: 80,
    prepaymentMode: PrepaymentMode.DEPOSIT,
    onlinePaymentEnabled: true,
    category: { name: 'Massage' },
  },
] as any[];

describe('ai-update-service-prices-online-payment-filter integration', () => {
  it.each(UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_RESCUE_SCENARIOS)(
    'rescues $id from $misclassifiedAction',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueUpdateServicePricesOnlinePaymentFilterIntent(
          prompt,
          misclassifiedAction!,
        )?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_PROMPTS.filter(
    (row) => row.paramsPartial?.onlyWithOnlinePayment,
  ).slice(0, 4))(
    'builds scoped price plan for $id',
    ({ prompt, paramsPartial }) => {
      const plan = prepareUpdateServicePricesPlanLogic(
        deps,
        'biz-1',
        prompt,
        {},
        services,
        'u1',
      );
      expect(plan?.intent).toBe('update_service_prices');
      const stepIds = (plan?.steps as Array<{ params: { serviceId: string } }>).map(
        (step) => step.params.serviceId,
      );
      expect(stepIds).not.toContain('cash');
      expect(stepIds.length).toBeGreaterThan(0);
      if (paramsPartial?.percentChange != null) {
        const firstStep = (plan?.steps as Array<{ params: { price: number } }>)[0];
        const service = services.find((s) => stepIds[0] === s.id)!;
        const expected =
          Math.round(service.price * (1 + paramsPartial.percentChange / 100) * 100) /
          100;
        expect(firstStep.params.price).toBe(expected);
      }
    },
  );

  it('applies category and online-payment filters together', () => {
    const plan = prepareUpdateServicePricesPlanLogic(
      deps,
      'biz-1',
      'Raise all massage service prices 10% for services with online payment only',
      {},
      services,
    );
    const stepIds = (plan?.steps as Array<{ params: { serviceId: string } }>).map(
      (step) => step.params.serviceId,
    );
    expect(stepIds).toEqual(['online-deposit']);
  });

  it('returns null when online-payment filter excludes all matches', () => {
    const cashOnly = services.filter((s) => s.id === 'cash');
    const plan = prepareUpdateServicePricesPlanLogic(
      deps,
      'biz-1',
      'Raise prices 10% for services with online payment only',
      { categoryName: 'Hair' },
      cashOnly,
    );
    expect(plan).toBeNull();
  });
});
