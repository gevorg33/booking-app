import type { RebookAndPayCompoundFixture } from './ai-rebook-and-pay-compound.fixtures.js';

export const REBOOK_AND_PAY_MULTILINGUAL_SCENARIOS: readonly RebookAndPayCompoundFixture[] =
  [
    {
      id: 'rebook-pay-hy-last-visit',
      prompt: 'Rebook my last visit and pay online — veramagrel verjin ayts@',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      paymentAction: 'pay_online',
    },
    {
      id: 'rebook-pay-hy-same-as-last',
      prompt: 'Book the same as last time and pay with card — vchar kartov',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      paymentAction: 'pay_online',
    },
    {
      id: 'rebook-pay-ru-last-visit',
      prompt:
        'Repeat my last visit and pay online — povtorno zapisatsya na proshlyj vizit',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      paymentAction: 'pay_online',
    },
    {
      id: 'rebook-pay-ru-same-as-last',
      prompt: 'Book the same as last time and pay with card — oplati kartoj',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      paymentAction: 'pay_online',
    },
  ];
