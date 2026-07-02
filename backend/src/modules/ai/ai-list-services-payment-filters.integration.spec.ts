import { PrepaymentMode } from '../service/entities/service.entity.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  LIST_SERVICES_PAYMENT_FILTER_PROMPTS,
  LIST_SERVICES_PAYMENT_FILTER_RESCUE_SCENARIOS,
} from './ai-list-services-payment-filters.fixtures.js';
import {
  filterServicesByListServicesPaymentPolicy,
  parseListServicesPaymentFilterFromPrompt,
  rescueListServicesPaymentFilterIntent,
} from './ai-list-services-payment-filters.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';
import { BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES } from './ai-budget-service-discovery.fixtures.js';

const CATALOG = [
  { id: 'a', name: 'Walk-in Trim', prepaymentMode: PrepaymentMode.NONE },
  {
    id: 'b',
    name: 'Premium Color',
    prepaymentMode: PrepaymentMode.FULL,
    onlinePaymentEnabled: true,
  },
  {
    id: 'c',
    name: 'Spa Package',
    prepaymentMode: PrepaymentMode.DEPOSIT,
    onlinePaymentEnabled: true,
  },
];

describe('ai-list-services-payment-filters integration (ai-cmd-ext-5.1)', () => {
  const rescueService = new AiIntentRescueService();

  it('classifier rules include payment filter guidance', () => {
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain(
      'prepaymentMode',
    );
    expect(BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES).toContain(
      'list_services payment filters',
    );
  });

  it.each(LIST_SERVICES_PAYMENT_FILTER_RESCUE_SCENARIOS.slice(0, 4))(
    'payments rescue routes $id to list_services',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(rescuePaymentsIntent(prompt, misclassifiedAction)?.action).toBe(
        expectedAction,
      );
    },
  );

  it.each(
    LIST_SERVICES_PAYMENT_FILTER_PROMPTS.filter(
      (row) => row.surface === 'dashboard',
    ).slice(0, 4),
  )(
    'intent rescue enriches dashboard prompt $id',
    ({ prompt, paramsPartial }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('list_services');
      expect(rescued?.rescued).toBe(true);
      for (const [key, value] of Object.entries(paramsPartial ?? {})) {
        if (key === 'serviceCategory') continue;
        expect(rescued?.params?.[key]).toEqual(value);
      }
    },
  );

  it('handler filter path keeps only matching payment policy rows', () => {
    const filter = parseListServicesPaymentFilterFromPrompt(
      'Show services with deposit prepayment on public booking',
      {},
    );
    expect(
      filterServicesByListServicesPaymentPolicy(CATALOG, filter).map(
        (row) => row.id,
      ),
    ).toEqual(['c']);
  });

  it('utility rescue matches intent rescue for audit misroute', () => {
    const prompt = 'List services that require online payment';
    expect(
      rescueListServicesPaymentFilterIntent(prompt, 'unknown')?.action,
    ).toBe('list_services');
    expect(
      rescueService.rescue({ prompt, action: 'unknown', params: {} })?.action,
    ).toBe('list_services');
  });
});
