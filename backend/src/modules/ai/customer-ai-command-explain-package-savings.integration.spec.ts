import {
  EXPLAIN_PACKAGE_SAVINGS_PROMPTS,
  EXPLAIN_PACKAGE_SAVINGS_RESCUE_SCENARIOS,
} from './ai-explain-package-savings.fixtures.js';
import { EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_SCENARIOS } from './ai-explain-package-savings-multilingual.fixtures.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';

describe('customer/public explain_package_savings integration (ai-cmd-customer-4.6.5)', () => {
  it.each(EXPLAIN_PACKAGE_SAVINGS_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues explain_package_savings for $id on $surface',
    (_id, row) => {
      expect(
        rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action,
      ).toBe('explain_package_savings');
    },
  );

  it.each(
    EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues multilingual explain_package_savings for $id', (_id, row) => {
    expect(rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_package_savings',
    );
  });

  it.each(
    EXPLAIN_PACKAGE_SAVINGS_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues misclassified explain_package_savings for $id', (_id, row) => {
    expect(
      rescueSelfServiceBookingIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe('explain_package_savings');
  });
});
