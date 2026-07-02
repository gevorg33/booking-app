import {
  CUSTOMER_EXPLAIN_MULTI_SERVICE_CART_CLASSIFIER_RULES,
  EXPLAIN_MULTI_SERVICE_CART_PROMPTS,
  EXPLAIN_MULTI_SERVICE_CART_RESCUE_SCENARIOS,
} from './ai-explain-multi-service-cart.fixtures.js';
import { EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_SCENARIOS } from './ai-explain-multi-service-cart-multilingual.fixtures.js';
import {
  buildExplainMultiServiceCartSummary,
  computeMultiServiceCartTotalMinutes,
  inferExplainMultiServiceCartFocus,
  isExplainMultiServiceCartPrompt,
  rescueExplainMultiServiceCartIntent,
} from './ai-explain-multi-service-cart.util.js';
import {
  isShowCartTotalDurationPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_MULTI_SERVICE_CART_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-explain-multi-service-cart.util (ai-cmd-customer-4.6.1)', () => {
  it('exports classifier rules for explain_multi_service_cart', () => {
    expect(CUSTOMER_EXPLAIN_MULTI_SERVICE_CART_CLASSIFIER_RULES).toContain(
      'explain_multi_service_cart',
    );
  });

  it.each(
    EXPLAIN_MULTI_SERVICE_CART_PROMPTS.map((row) => [row.id, row] as const),
  )('detects explain_multi_service_cart for $id', (_id, row) => {
    expect(isExplainMultiServiceCartPrompt(row.prompt)).toBe(true);
    expect(
      rescueExplainMultiServiceCartIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_multi_service_cart');
    expect(rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_multi_service_cart',
    );
    if (row.focus) {
      expect(inferExplainMultiServiceCartFocus(row.prompt)).toBe(row.focus);
    }
  });

  it.each(
    EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain_multi_service_cart for $id', (_id, row) => {
    expect(isExplainMultiServiceCartPrompt(row.prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_MULTI_SERVICE_CART_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueSelfServiceBookingIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe('explain_multi_service_cart');
  });

  it('rejects empty and duration-only cart prompts', () => {
    expect(isExplainMultiServiceCartPrompt('')).toBe(false);
    expect(isExplainMultiServiceCartPrompt('Show cart total duration')).toBe(
      false,
    );
  });

  it('builds overview summary with price subtotal', () => {
    expect(
      buildExplainMultiServiceCartSummary({
        lines: [{ id: 's1', name: 'Massage', durationMinutes: 60, price: 50 }],
        totalMinutes: 60,
        focus: 'overview',
      }),
    ).toContain('Catalog subtotal');
  });

  it('keeps duration-only prompts on show_cart_total_duration', () => {
    expect(isShowCartTotalDurationPrompt('Show cart total duration')).toBe(
      true,
    );
    expect(isExplainMultiServiceCartPrompt("What's in my cart?")).toBe(true);
    expect(isShowCartTotalDurationPrompt("What's in my cart?")).toBe(false);
  });

  it('detects heuristic explain prompts outside fixtures', () => {
    expect(
      isExplainMultiServiceCartPrompt('How long will my spa day take?'),
    ).toBe(true);
    expect(
      isExplainMultiServiceCartPrompt('How much time do these services need?'),
    ).toBe(true);
    expect(isExplainMultiServiceCartPrompt('Add massage to cart')).toBe(false);
    expect(
      rescueExplainMultiServiceCartIntent(
        "What's in my cart?",
        'explain_multi_service_cart',
      ),
    ).toBeNull();
  });

  it('infers focus from prompt heuristics', () => {
    expect(
      inferExplainMultiServiceCartFocus('How many minutes will this take?'),
    ).toBe('duration');
    expect(
      inferExplainMultiServiceCartFocus('List my selected treatments'),
    ).toBe('contents');
    expect(inferExplainMultiServiceCartFocus('Tell me about my visit')).toBe(
      'overview',
    );
  });

  it('builds empty and single-service summaries', () => {
    expect(
      buildExplainMultiServiceCartSummary({
        lines: [],
        totalMinutes: 0,
      }),
    ).toContain('empty');
    expect(
      buildExplainMultiServiceCartSummary({
        lines: [{ id: 's1', name: 'Massage', durationMinutes: 60 }],
        totalMinutes: 60,
        focus: 'duration',
      }),
    ).not.toContain('turnover');
    expect(computeMultiServiceCartTotalMinutes([{ durationMinutes: 30 }])).toBe(
      30,
    );
  });

  it('builds enriched cart summaries', () => {
    const lines = [
      { id: 's1', name: 'Massage', durationMinutes: 60, price: 80 },
      {
        id: 's2',
        name: 'Facial',
        durationMinutes: 45,
        bufferMinutes: 5,
        price: 70,
      },
    ];
    const totalMinutes = computeMultiServiceCartTotalMinutes(lines, 10);
    expect(totalMinutes).toBe(120);
    expect(
      buildExplainMultiServiceCartSummary({
        lines,
        totalMinutes,
        turnoverBufferMinutes: 10,
        focus: 'contents',
      }),
    ).toContain('Massage');
    expect(
      buildExplainMultiServiceCartSummary({
        lines,
        totalMinutes,
        turnoverBufferMinutes: 10,
        focus: 'duration',
      }),
    ).toContain('120 minutes');
  });

  it('registers eval golden cases for every fixture scenario', () => {
    const ids = new Set(
      AI_COMMAND_EVAL_EXPLAIN_MULTI_SERVICE_CART_CASES.map((row) => row.id),
    );
    for (const row of EXPLAIN_MULTI_SERVICE_CART_PROMPTS) {
      expect(ids.has(`explain-multi-service-cart-${row.id}`)).toBe(true);
    }
    for (const row of EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_SCENARIOS) {
      expect(ids.has(`explain-multi-service-cart-${row.id}`)).toBe(true);
    }
    for (const row of EXPLAIN_MULTI_SERVICE_CART_RESCUE_SCENARIOS) {
      expect(ids.has(`explain-multi-service-cart-rescue-${row.id}`)).toBe(true);
    }
  });
});
