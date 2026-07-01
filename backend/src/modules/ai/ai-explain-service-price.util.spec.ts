import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  CUSTOMER_PUBLIC_EXPLAIN_SERVICE_PRICE_CLASSIFIER_RULES,
  EXPLAIN_SERVICE_PRICE_PROMPTS,
  buildServicePriceExplainCopy,
  detectExplainServicePriceAction,
  enrichExplainServicePriceParamsFromPrompt,
  extractServiceNameForPricePrompt,
  isExplainServicePricePrompt,
  rescueExplainServicePriceIntent,
} from './ai-explain-service-price.util.js';
import { EXPLAIN_SERVICE_PRICE_MULTILINGUAL_SCENARIOS } from './ai-explain-service-price-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_EXPLAIN_SERVICE_PRICE_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';

describe('ai-explain-service-price.util (ai-cmd-customer-4.1.1)', () => {
  it('exports classifier rules for explain_service_price', () => {
    expect(CUSTOMER_PUBLIC_EXPLAIN_SERVICE_PRICE_CLASSIFIER_RULES).toContain(
      'explain_service_price',
    );
  });

  it.each(EXPLAIN_SERVICE_PRICE_PROMPTS.map((row) => [row.id, row] as const))(
    'detects explain-service-price prompt $id',
    (_id, row) => {
      expect(isExplainServicePricePrompt(row.prompt)).toBe(true);
      expect(detectExplainServicePriceAction(row.prompt)).toBe(
        row.expectedAction,
      );
    },
  );

  it.each(
    EXPLAIN_SERVICE_PRICE_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain-service-price prompt $id', (_id, row) => {
    expect(isExplainServicePricePrompt(row.prompt)).toBe(true);
    expect(rescueExplainServicePriceIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_service_price',
    );
  });

  it.each(EXPLAIN_SERVICE_PRICE_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues explain-service-price prompt $id from unknown',
    (_id, row) => {
      const rescued = rescueExplainServicePriceIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
      expect(rescued?.rescueReason).toBe(row.rescueReason);
      expect(rescuePaymentsIntent(row.prompt, 'unknown')?.action).toBe(
        'explain_service_price',
      );
    },
  );

  it('extracts service names from price phrasing', () => {
    expect(extractServiceNameForPricePrompt('How much is a haircut?')).toBe(
      'haircut',
    );
    expect(
      extractServiceNameForPricePrompt("What's the price of massage?"),
    ).toBe('massage');
    expect(
      extractServiceNameForPricePrompt('Is massage included in the $80?'),
    ).toBe('massage');
    expect(
      enrichExplainServicePriceParamsFromPrompt({}, 'How much is a haircut?')
        .serviceName,
    ).toBe('haircut');
  });

  it('builds service card copy with tax badge and deposit note', () => {
    const copy = buildServicePriceExplainCopy(
      {
        id: 's1',
        name: 'Massage',
        price: 80,
        currency: 'USD',
        durationMinutes: 60,
        prepaymentMode: PrepaymentMode.DEPOSIT,
        depositAmount: null,
      },
      {
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'inclusive',
        },
      },
      { prompt: 'Is massage included in the $80?' },
    );
    expect(copy.summary).toContain('Massage');
    expect(copy.summary).toContain('incl. 20% VAT');
    expect(copy.summary).toContain('50% deposit');
    expect(copy.taxBadge).toBe('incl. 20% VAT');
    expect(copy.depositDueNow).toBe(40);
  });

  it('does not steal checkout-total or budget-list prompts', () => {
    expect(
      isExplainServicePricePrompt('How much do I pay today for massage?'),
    ).toBe(false);
    expect(
      isExplainServicePricePrompt('Explain checkout total for massage'),
    ).toBe(false);
    expect(isExplainServicePricePrompt('What can I book under $50?')).toBe(
      false,
    );
    expect(
      isExplainServicePricePrompt('Why is there a deposit for massage?'),
    ).toBe(false);
  });

  it('maps explain-service-price fixtures to passing eval golden cases', () => {
    expect(
      EXPLAIN_SERVICE_PRICE_PROMPTS.filter((row) => row.surface === 'customer')
        .length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      EXPLAIN_SERVICE_PRICE_PROMPTS.filter((row) => row.surface === 'public')
        .length,
    ).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_EXPLAIN_SERVICE_PRICE_CASES.length).toBe(
      EXPLAIN_SERVICE_PRICE_PROMPTS.length +
        EXPLAIN_SERVICE_PRICE_MULTILINGUAL_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_SERVICE_PRICE_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
