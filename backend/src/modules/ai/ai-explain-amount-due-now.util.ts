import {
  enrichPrepaymentExplainParamsFromPrompt,
  referencesCatalogServiceContext,
} from './ai-explain-prepayment.util.js';

export const CUSTOMER_PUBLIC_EXPLAIN_AMOUNT_DUE_NOW_CLASSIFIER_RULES = `- explain_amount_due_now: READ — explain how much the visitor pays today at checkout using prepaymentDue semantics (deposit or full prepayment due now, balance at visit). Triggers: "How much do I pay today?", "What's due today?", "Is the 50% deposit $40?", "What deposit is due for facial?". Set serviceName when they name a catalog service; on public booking use session serviceId/serviceName for this/selected/current service. NOT explain_checkout_total (holistic checkout total with gift-card line math), NOT explain_service_price (listed card price), NOT list_services or maxPrice budget browse ("what can I book with $50"), NOT explain_why_stripe_required (why policy), NOT explain_payment_options_for_service (can I pay cash/online), and NOT choose_payment_method|pay_online (mutate).`;

export type ExplainAmountDueNowPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_amount_due_now';
  serviceName?: string;
  rescueReason: 'amount_due_now';
};

export const EXPLAIN_AMOUNT_DUE_NOW_PROMPTS: readonly ExplainAmountDueNowPromptFixture[] =
  [
    {
      id: 'amount-due-now-massage-customer',
      prompt: 'How much do I pay today for massage?',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'massage',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'is-deposit-forty-customer',
      prompt: 'Is the 50% deposit $40 for facial?',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'facial',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'what-due-today-customer',
      prompt: "What's due today at checkout?",
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'break-down-amount-due-customer',
      prompt: 'Break down amount due now for color',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'color',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'how-much-pay-today-customer',
      prompt: 'How much do I pay today?',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'due-now-haircut-customer',
      prompt: 'What is due now for haircut?',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'haircut',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'deposit-today-blowdry-customer',
      prompt: 'How much deposit do I pay today for blowdry?',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'blowdry',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'is-deposit-twenty-five-customer',
      prompt: 'Is the deposit $25 for manicure?',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'manicure',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'owe-today-checkout-customer',
      prompt: 'What do I owe today at checkout?',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'due-upfront-spa-customer',
      prompt: 'How much is due upfront for spa treatment?',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'spa treatment',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'confirm-deposit-pedicure-customer',
      prompt: 'Confirm the deposit amount for pedicure',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'pedicure',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'pay-today-swedish-massage-customer',
      prompt: "What's the pay-today amount for Swedish massage?",
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'Swedish massage',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'how-much-due-today-public',
      prompt: 'How much is due today for massage?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'massage',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'deposit-amount-public',
      prompt: 'What is the deposit amount for facial?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'facial',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'pay-today-breakdown-public',
      prompt: 'Break down what I pay today',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'amount-due-now-public',
      prompt: 'What amount is due now at checkout?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'how-much-pay-today-public',
      prompt: 'How much do I pay today?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'is-half-deposit-forty-public',
      prompt: 'Is half the deposit $40 for color?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'color',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'due-today-checkout-public',
      prompt: "What's due today at checkout?",
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'deposit-due-now-haircut-public',
      prompt: 'How much deposit is due now for haircut?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'haircut',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'pay-today-blowdry-public',
      prompt: 'What do I pay today for blowdry?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'blowdry',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'amount-due-upfront-public',
      prompt: 'How much is due upfront at checkout?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'confirm-deposit-manicure-public',
      prompt: 'Is the deposit $30 for manicure?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      serviceName: 'manicure',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'due-now-selected-service-public',
      prompt: 'How much is due now for the selected service?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
  ];

function isBudgetCatalogBrowsePrompt(prompt: string): boolean {
  if (/\b(?:pay|due|deposit|today|checkout|prepay)\b/i.test(prompt)) {
    return false;
  }
  return (
    /\bwhat\s+can\s+i\s+book\b/i.test(prompt) ||
    /\b(?:under|below|at most|no more than|within|affordable|cheapest)\b/i.test(
      prompt,
    ) ||
    /\b(?:options?|services?)\s+(?:under|below|within)\b/i.test(prompt) ||
    /\bi\s+have\s+\$?\d+/i.test(prompt)
  );
}

export function isExplainAmountDueNowPrompt(prompt: string): boolean {
  if (/\bwhy\b/i.test(prompt)) return false;
  if (isBudgetCatalogBrowsePrompt(prompt)) return false;
  if (
    /\b(?:refund(?:able)?|forfeit|lose\s+my|get\s+my|cancel\s+for\s+free|free\s+cancel|cancellation\s+fee)\b/i.test(
      prompt,
    ) &&
    /\b(?:cancel|cancellation|if\s+i\s+cancel)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(?:explain|break\s*down)\b/i.test(prompt) &&
    /\bcheckout\s+total\b/i.test(prompt) &&
    !/\b(?:pay|due)\s+today\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /(?:որքան\s+եմ\s+վճարում\s+այսօր|անկախավճար)/iu.test(prompt) ||
    /(?:сколько\s+я\s+плачу\s+сегодня|депозит\s+50)/iu.test(prompt)
  ) {
    return true;
  }

  if (
    referencesCatalogServiceContext(prompt) &&
    /\b(how\s+much|what(?:'s| is)|break\s*down|deposit|confirm)\b/i.test(
      prompt,
    ) &&
    /\b(pay|due|deposit|today|checkout|upfront|owe)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(explain|break\s*down|how\s+much|what(?:'s| is)|what|confirm|is)\b/i.test(
      prompt,
    ) &&
    /\b(amount\s+due|due\s+now|due\s+today|deposit\s+amount|pay[\s-]?today)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(explain|break\s*down|how\s+much|what(?:'s| is)|what|confirm)\b/i.test(
      prompt,
    ) &&
    /\btoday\b/i.test(prompt) &&
    /\b(pay|due|checkout|owe)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(is|confirm)\b/i.test(prompt) &&
    /\b(?:\d+%\s+)?deposit\b/i.test(prompt) &&
    /\$\d+/i.test(prompt)
  ) {
    return true;
  }
  return (
    /\b(explain|break\s*down|how\s+much|what(?:'s| is)|is\s+the|confirm)\b/i.test(
      prompt,
    ) &&
    /\b(amount\s+due|due\s+now|due\s+today|pay\s+today|deposit\s+amount|is\s+the\s+\d+%\s+deposit|due\s+upfront|pay[\s-]?today)\b/i.test(
      prompt,
    )
  );
}

export function enrichExplainAmountDueNowParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  extractServiceName: (value: string) => string | null,
): Record<string, unknown> {
  return enrichPrepaymentExplainParamsFromPrompt(
    params,
    prompt,
    extractServiceName,
  );
}

export function rescueExplainAmountDueNowIntent(
  prompt: string,
  action: string,
): {
  action: 'explain_amount_due_now';
  rescueReason: string;
} | null {
  if (action === 'explain_amount_due_now') return null;
  if (!isExplainAmountDueNowPrompt(prompt)) return null;
  return {
    action: 'explain_amount_due_now',
    rescueReason: 'amount_due_now',
  };
}

export function detectExplainAmountDueNowAction(
  prompt: string,
): 'explain_amount_due_now' | null {
  return rescueExplainAmountDueNowIntent(prompt, 'unknown')?.action ?? null;
}
