import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_PROMPTS,
  UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_RESCUE_SCENARIOS,
} from './ai-update-service-prices-online-payment-filter.fixtures.js';
import {
  enrichUpdateServicePricesParamsFromPrompt,
  filterServicesForUpdateServicePricesOnlinePayment,
  isUpdateServicePricesOnlinePaymentFilterPrompt,
  isUpdateServicePricesOnlinePaymentScopePrompt,
  parseOnlyWithOnlinePaymentFromPrompt,
  rescueUpdateServicePricesOnlinePaymentFilterIntent,
  serviceHasOnlinePayment,
  UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_CLASSIFIER_RULES,
} from './ai-update-service-prices-online-payment-filter.util.js';
import { rescueOperationsIntent } from './ai-operations.util.js';
import { parsePriceAdjustment } from './ai-operations.util.js';

const catalog = [
  { id: '1', name: 'Cash Cut', prepaymentMode: PrepaymentMode.NONE },
  {
    id: '2',
    name: 'Online Facial',
    prepaymentMode: PrepaymentMode.FULL,
    onlinePaymentEnabled: true,
  },
  {
    id: '3',
    name: 'Deposit Massage',
    prepaymentMode: PrepaymentMode.DEPOSIT,
    onlinePaymentEnabled: true,
  },
] as const;

describe('ai-update-service-prices-online-payment-filter.util', () => {
  it('exports classifier rules', () => {
    expect(
      UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_CLASSIFIER_RULES,
    ).toContain('onlyWithOnlinePayment');
  });

  it.each(
    UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_PROMPTS.filter(
      (row) => row.paramsPartial?.onlyWithOnlinePayment,
    ),
  )('detects online payment scope for $id', ({ prompt }) => {
    expect(isUpdateServicePricesOnlinePaymentScopePrompt(prompt, {})).toBe(
      true,
    );
    expect(isUpdateServicePricesOnlinePaymentFilterPrompt(prompt)).toBe(true);
  });

  it.each(UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_PROMPTS)(
    'parses onlyWithOnlinePayment for $id',
    ({ prompt, paramsPartial }) => {
      const only = parseOnlyWithOnlinePaymentFromPrompt(prompt, {});
      if (paramsPartial?.onlyWithOnlinePayment) {
        expect(only).toBe(true);
      } else {
        expect(only).toBeUndefined();
      }
    },
  );

  it.each(UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_RESCUE_SCENARIOS)(
    'rescues misclassified $id → update_service_prices',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueUpdateServicePricesOnlinePaymentFilterIntent(
          prompt,
          misclassifiedAction!,
        )?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(
    UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_PROMPTS.filter(
      (row) => row.paramsPartial?.onlyWithOnlinePayment,
    ),
  )('enriches params for $id', ({ prompt, paramsPartial }) => {
    const enriched = enrichUpdateServicePricesParamsFromPrompt({}, prompt);
    expect(enriched.onlyWithOnlinePayment).toBe(true);
    const adjustment = parsePriceAdjustment(prompt, enriched);
    if (paramsPartial?.percentChange != null) {
      expect(adjustment?.percentChange).toBe(paramsPartial.percentChange);
    }
  });

  it('filters catalog to online-payment services only', () => {
    const filtered = filterServicesForUpdateServicePricesOnlinePayment(catalog);
    expect(filtered.map((s) => s.id)).toEqual(['2', '3']);
    expect(serviceHasOnlinePayment(catalog[1])).toBe(true);
    expect(serviceHasOnlinePayment(catalog[0])).toBe(false);
  });

  it('rescues via operations intent with enriched params', () => {
    const prompt = 'Raise prices 10% for services with online payment only';
    const rescued = rescueOperationsIntent(
      prompt,
      'configure_service_online_payment',
      {},
    );
    expect(rescued?.action).toBe('update_service_prices');
    expect(rescued?.params.onlyWithOnlinePayment).toBe(true);
  });

  it('enriches existing update_service_prices action params', () => {
    const prompt = 'Raise prices 10% for services with online payment only';
    const rescued = rescueOperationsIntent(prompt, 'update_service_prices', {
      percentChange: 10,
    });
    expect(rescued?.params.onlyWithOnlinePayment).toBe(true);
  });
});
