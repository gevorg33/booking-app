import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  LIST_SERVICES_PAYMENT_FILTER_PROMPTS,
  LIST_SERVICES_PAYMENT_FILTER_RESCUE_SCENARIOS,
} from './ai-list-services-payment-filters.fixtures.js';
import {
  buildListServicesPaymentFilterHeader,
  enrichListServicesPaymentFilterParamsFromPrompt,
  filterServicesByListServicesPaymentPolicy,
  isListServicesPaymentFilterPrompt,
  matchesListServicesPaymentFilter,
  parseListServicesPaymentFilterFromPrompt,
  rescueListServicesPaymentFilterIntent,
} from './ai-list-services-payment-filters.util.js';
import { isAuditServicesMissingOnlinePaymentPrompt } from './ai-audit-services-missing-online-payment.util.js';
import { isExplainServiceOnlinePaymentSetupPrompt } from './ai-service-online-payment-setup.util.js';
import { enrichListServicesParamsFromPrompt } from './ai-orchestration.helpers.js';

const MOCK_CATALOG = [
  { id: '1', name: 'Cash Cut', prepaymentMode: PrepaymentMode.NONE },
  {
    id: '2',
    name: 'Full Facial',
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

describe('ai-list-services-payment-filters.util (ai-cmd-ext-5.1)', () => {
  it.each(LIST_SERVICES_PAYMENT_FILTER_PROMPTS)(
    'detects list payment filter prompt $id',
    ({ prompt }) => {
      expect(isListServicesPaymentFilterPrompt(prompt)).toBe(true);
    },
  );

  it.each(LIST_SERVICES_PAYMENT_FILTER_PROMPTS)(
    'parses payment filter params for $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseListServicesPaymentFilterFromPrompt(prompt, {});
      for (const [key, value] of Object.entries(paramsPartial ?? {})) {
        if (key === 'serviceCategory') continue;
        expect(parsed?.[key as keyof typeof parsed]).toEqual(value);
      }
    },
  );

  it.each(LIST_SERVICES_PAYMENT_FILTER_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction to list_services for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueListServicesPaymentFilterIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'list_services_payment_filter',
      });
    },
  );

  it('does not steal audit gap prompts', () => {
    expect(
      isListServicesPaymentFilterPrompt(
        "Which services still don't accept online payment?",
      ),
    ).toBe(false);
    expect(
      isAuditServicesMissingOnlinePaymentPrompt(
        "Which services still don't accept online payment?",
      ),
    ).toBe(true);
  });

  it('does not steal explain prepayment setup prompts', () => {
    expect(
      isListServicesPaymentFilterPrompt(
        'Which services require prepayment on public booking?',
      ),
    ).toBe(false);
    expect(
      isExplainServiceOnlinePaymentSetupPrompt(
        'Which services require prepayment on public booking?',
      ),
    ).toBe(true);
  });

  it('does not steal no-prepayment customer/public browse prompts', () => {
    expect(
      isListServicesPaymentFilterPrompt(
        'What can I book without paying online?',
      ),
    ).toBe(false);
    expect(
      isListServicesPaymentFilterPrompt(
        'Show services I can book without paying online',
      ),
    ).toBe(false);
  });

  it('filters catalog by prepaymentMode none', () => {
    const filter = parseListServicesPaymentFilterFromPrompt(
      'What can I book without paying online?',
      {},
    );
    expect(
      filterServicesByListServicesPaymentPolicy(MOCK_CATALOG, filter).map(
        (row) => row.id,
      ),
    ).toEqual(['1']);
  });

  it('filters catalog by onlinePaymentEnabled true', () => {
    const filter = parseListServicesPaymentFilterFromPrompt(
      'List services that require online payment',
      {},
    );
    expect(
      filterServicesByListServicesPaymentPolicy(MOCK_CATALOG, filter).map(
        (row) => row.id,
      ),
    ).toEqual(['2', '3']);
  });

  it('filters catalog by prepaymentMode deposit', () => {
    const filter = { prepaymentMode: 'deposit' as const };
    expect(matchesListServicesPaymentFilter(MOCK_CATALOG[2], filter)).toBe(
      true,
    );
    expect(
      filterServicesByListServicesPaymentPolicy(MOCK_CATALOG, filter).map(
        (row) => row.id,
      ),
    ).toEqual(['3']);
  });

  it('builds payment filter headers', () => {
    expect(
      buildListServicesPaymentFilterHeader({ prepaymentMode: 'none' }),
    ).toBe('Services without online payment');
    expect(
      buildListServicesPaymentFilterHeader({ onlinePaymentEnabled: true }),
    ).toBe('Services with online payment');
  });

  it('enriches list_services params from prompt', () => {
    expect(
      enrichListServicesPaymentFilterParamsFromPrompt(
        {},
        'List services with full prepayment',
      ),
    ).toEqual({ prepaymentMode: 'full' });
    expect(
      enrichListServicesParamsFromPrompt(
        'List services with full prepayment',
        {},
      ),
    ).toEqual({ prepaymentMode: 'full' });
  });
});
