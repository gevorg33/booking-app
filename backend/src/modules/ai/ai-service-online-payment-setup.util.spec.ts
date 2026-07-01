import {
  EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_PROMPTS,
  filterServicesForOnlinePaymentSetupExplain,
  formatServicePrepaymentLabel,
  isExplainServiceOnlinePaymentSetupPrompt,
  parseExplainServiceOnlinePaymentSetupFromPrompt,
  rescueExplainServiceOnlinePaymentSetupIntent,
} from './ai-service-online-payment-setup.util.js';
import { isConfigureServiceOnlinePaymentPrompt } from './ai-service-online-payment.util.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';

const catalog = [
  {
    id: 's1',
    name: 'Massage',
    businessId: 'biz-1',
    price: 80,
    isActive: true,
    prepaymentMode: PrepaymentMode.FULL,
    depositAmount: null,
    category: { name: 'Massage' },
  },
  {
    id: 's2',
    name: 'Haircut',
    businessId: 'biz-1',
    price: 40,
    isActive: true,
    prepaymentMode: PrepaymentMode.DEPOSIT,
    depositAmount: null,
    category: { name: 'Hair' },
  },
  {
    id: 's3',
    name: 'Color',
    businessId: 'biz-1',
    price: 90,
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    depositAmount: null,
    category: { name: 'Hair' },
  },
] as const;

describe('ai-service-online-payment-setup.util', () => {
  it.each(EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_PROMPTS)(
    'detects explain setup prompt $id',
    ({ prompt }) => {
      expect(isExplainServiceOnlinePaymentSetupPrompt(prompt)).toBe(true);
    },
  );

  it.each(EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_PROMPTS)(
    'does not classify explain setup prompt $id as configure mutate',
    ({ prompt }) => {
      expect(isConfigureServiceOnlinePaymentPrompt(prompt)).toBe(false);
    },
  );

  it.each(EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_PROMPTS)(
    'parses explain setup fixture $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseExplainServiceOnlinePaymentSetupFromPrompt(
        prompt,
        {},
      );
      expect(parsed).not.toBeNull();
      if (paramsPartial?.serviceName) {
        expect(parsed?.serviceName).toBe(paramsPartial.serviceName);
      }
      if (paramsPartial?.categoryName) {
        expect(parsed?.categoryName).toBe(paramsPartial.categoryName);
      }
    },
  );

  it.each(EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_PROMPTS)(
    'rescues unknown action to explain setup for $id',
    ({ prompt, expectedAction }) => {
      expect(
        rescueExplainServiceOnlinePaymentSetupIntent(prompt, 'unknown'),
      ).toEqual({
        action: expectedAction,
        rescueReason: expectedAction,
      });
    },
  );

  it('rejects list_services without online payment context', () => {
    expect(isExplainServiceOnlinePaymentSetupPrompt('List services')).toBe(
      false,
    );
  });

  it('formats prepayment labels', () => {
    expect(
      formatServicePrepaymentLabel({
        name: 'Massage',
        prepaymentMode: PrepaymentMode.FULL,
        depositAmount: null,
      }),
    ).toBe('Massage: full prepayment');
    expect(
      formatServicePrepaymentLabel({
        name: 'Haircut',
        prepaymentMode: PrepaymentMode.DEPOSIT,
        depositAmount: null,
      }),
    ).toContain('50% deposit');
    expect(
      formatServicePrepaymentLabel({
        name: 'Color',
        prepaymentMode: PrepaymentMode.NONE,
        depositAmount: null,
      }),
    ).toBe('Color: online payment off');
  });

  it('filters services by category hint', () => {
    const filtered = filterServicesForOnlinePaymentSetupExplain(
      catalog as any,
      {
        categoryName: 'massage',
      },
    );
    expect(filtered.map((service) => service.name)).toEqual(['Massage']);
  });
});
