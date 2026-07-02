import {
  EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_PROMPTS,
  EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_RESCUE_SCENARIOS,
} from './ai-explain-subscription-vs-one-time.fixtures.js';
import { EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_SCENARIOS } from './ai-explain-subscription-vs-one-time-multilingual.fixtures.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';

describe('customer/public explain_subscription_vs_one_time integration (ai-cmd-customer-4.16.3)', () => {
  it.each(
    EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'rescues explain_subscription_vs_one_time for $id on $surface',
    (_id, row) => {
      expect(
        rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action,
      ).toBe('explain_subscription_vs_one_time');
    },
  );

  it.each(
    EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'rescues multilingual explain_subscription_vs_one_time for $id',
    (_id, row) => {
      expect(
        rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action,
      ).toBe('explain_subscription_vs_one_time');
    },
  );

  it.each(
    EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'rescues misclassified explain_subscription_vs_one_time for $id',
    (_id, row) => {
      expect(
        rescueSelfServiceBookingIntent(row.prompt, row.misclassifiedAction)
          ?.action,
      ).toBe('explain_subscription_vs_one_time');
    },
  );
});
