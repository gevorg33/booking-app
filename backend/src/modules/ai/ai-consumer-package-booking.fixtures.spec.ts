import { describe, expect, it } from '@jest/globals';
import { SIMILAR_CUSTOMER_PACKAGE_PROMPTS } from './ai-consumer-package-booking.fixtures.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';
import { rescueCustomerCrmIntent } from './ai-customer-crm.util.js';

describe('ai-consumer-package-booking.fixtures', () => {
  it.each(SIMILAR_CUSTOMER_PACKAGE_PROMPTS)(
    'rescue matches scenario $id',
    ({ prompt, expectedAction }) => {
      const rescue =
        expectedAction === 'discover_packages'
          ? rescueCustomerCrmIntent(prompt, 'unknown')
          : rescueSelfServiceBookingIntent(prompt, 'unknown');
      expect(rescue?.action).toBe(expectedAction);
    },
  );
});
