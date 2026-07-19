import {
  AI_CMD_ENTITY_ACTION_RULES,
  AI_CMD_ENTITY_VALIDATED_ACTIONS,
  isAiCmdEntityValidatedAction,
  validateAiCmdEntityFields,
} from './ai-cmd-entity-completion.util.js';
import type { ResolvedCommand } from './command-completion.types.js';

function cmd(
  action: string,
  params: Record<string, unknown> = {},
): ResolvedCommand {
  return {
    action,
    prompt: '',
    params,
    enrichedParams: {},
    entities: {
      employees: [],
      services: [],
    },
    reasoning: 'test',
    confidence: 0.9,
  } as ResolvedCommand;
}

describe('ai-cmd-entity-completion.util (ai-cmd-t4)', () => {
  it('covers every entity-validated action with a rule', () => {
    for (const action of AI_CMD_ENTITY_VALIDATED_ACTIONS) {
      expect(AI_CMD_ENTITY_ACTION_RULES[action]).toBeDefined();
    }
  });

  it('isAiCmdEntityValidatedAction matches registry', () => {
    expect(isAiCmdEntityValidatedAction('create_package_booking')).toBe(true);
    expect(isAiCmdEntityValidatedAction('list_bookings')).toBe(false);
  });

  describe('create_package_booking', () => {
    it('requires package, customer, date, and time', () => {
      const issues = validateAiCmdEntityFields(cmd('create_package_booking'));
      expect(issues.map((i) => i.field)).toEqual(
        expect.arrayContaining([
          'packageName',
          'customerName',
          'date',
          'timeSlot',
        ]),
      );
    });

    it('passes with complete params', () => {
      const issues = validateAiCmdEntityFields(
        cmd('create_package_booking', {
          packageName: 'Spa Day',
          customerName: 'Maria',
          date: '29_05_2026',
          timeSlot: '10:00',
        }),
      );
      expect(issues).toHaveLength(0);
    });

    it('accepts packageId and customerId', () => {
      const issues = validateAiCmdEntityFields(
        cmd('create_package_booking', {
          packageId: 'pkg-abc12345',
          customerId: 'cust-abc12345',
          date: '29_05_2026',
          timeSlot: '10:00',
        }),
      );
      expect(issues).toHaveLength(0);
    });
  });

  describe('create_multi_service_booking', () => {
    it('requires serviceNames, provider, date, time', () => {
      const issues = validateAiCmdEntityFields(
        cmd('create_multi_service_booking'),
      );
      expect(issues.map((i) => i.field)).toEqual(
        expect.arrayContaining([
          'serviceNames',
          'employeeName',
          'date',
          'timeSlot',
        ]),
      );
    });

    it('accepts serviceIds array', () => {
      const issues = validateAiCmdEntityFields(
        cmd('create_multi_service_booking', {
          serviceIds: ['svc-1', 'svc-2'],
          employeeName: 'Anna',
          date: '29_05_2026',
          timeSlot: '10:00',
        }),
      );
      expect(issues).toHaveLength(0);
    });
  });

  describe('book_package (customer)', () => {
    it('requires package and date', () => {
      expect(
        validateAiCmdEntityFields(cmd('book_package')).map((i) => i.field),
      ).toEqual(expect.arrayContaining(['packageName', 'date']));
    });
  });

  describe('book_multi_service (customer)', () => {
    it('requires services and date', () => {
      expect(
        validateAiCmdEntityFields(cmd('book_multi_service')).map(
          (i) => i.field,
        ),
      ).toEqual(expect.arrayContaining(['serviceNames', 'date']));
    });
  });

  describe('cancel and reschedule package/multi-service', () => {
    it('cancel_package_visit requires bookingId', () => {
      expect(
        validateAiCmdEntityFields(cmd('cancel_package_visit'))[0]?.field,
      ).toBe('bookingId');
    });

    it('cancel_package_visit passes with bookingId', () => {
      expect(
        validateAiCmdEntityFields(
          cmd('cancel_package_visit', { bookingId: 'b1' }),
        ),
      ).toHaveLength(0);
    });

    it('cancel_multi_service_group passes with bookingId', () => {
      expect(
        validateAiCmdEntityFields(
          cmd('cancel_multi_service_group', { bookingId: 'b2' }),
        ),
      ).toHaveLength(0);
    });

    it('cancel_package_visit passes with customerName', () => {
      const bookingCmd = cmd('cancel_package_visit', { customerName: 'Maria' });
      bookingCmd.entities.customer = { id: 'c1', name: 'Maria' } as any;
      expect(validateAiCmdEntityFields(bookingCmd)).toHaveLength(0);
    });

    it('reschedule_multi_service_group requires booking and time', () => {
      const issues = validateAiCmdEntityFields(
        cmd('reschedule_multi_service_group'),
      );
      expect(issues.map((i) => i.field)).toEqual(
        expect.arrayContaining(['bookingId', 'timeSlot']),
      );
    });
  });

  describe('assign_booking_resource', () => {
    it('requires booking context and resource', () => {
      const issues = validateAiCmdEntityFields(cmd('assign_booking_resource'));
      expect(issues.map((i) => i.field)).toEqual(
        expect.arrayContaining(['bookingId', 'resourceName']),
      );
    });

    it('passes with timeSlot and resourceName', () => {
      expect(
        validateAiCmdEntityFields(
          cmd('assign_booking_resource', {
            timeSlot: '14:00',
            resourceName: 'Room 2',
          }),
        ),
      ).toHaveLength(0);
    });
  });

  describe('gift card and subscription', () => {
    it('book_with_gift_card requires code, service, date', () => {
      const fields = validateAiCmdEntityFields(cmd('book_with_gift_card')).map(
        (i) => i.field,
      );
      expect(fields).toEqual(
        expect.arrayContaining(['giftCardCode', 'serviceName', 'date']),
      );
    });

    it('check_gift_card_balance requires giftCardCode', () => {
      expect(
        validateAiCmdEntityFields(cmd('check_gift_card_balance'))[0]?.field,
      ).toBe('giftCardCode');
    });

    it('select_subscription_plan requires plan', () => {
      expect(
        validateAiCmdEntityFields(cmd('select_subscription_plan'))[0]?.field,
      ).toBe('subscriptionPlanId');
    });
  });

  describe('catalog and retail', () => {
    it('bulk_create_catalog requires draft', () => {
      expect(
        validateAiCmdEntityFields(cmd('bulk_create_catalog'))[0]?.field,
      ).toBe('categoryDraft');
    });

    it('bulk_create_catalog passes with categoryName', () => {
      expect(
        validateAiCmdEntityFields(
          cmd('bulk_create_catalog', { categoryName: 'Hair' }),
        ),
      ).toHaveLength(0);
    });

    it('create_package requires packageName', () => {
      expect(validateAiCmdEntityFields(cmd('create_package'))[0]?.field).toBe(
        'packageName',
      );
    });

    it('create_product requires name and price', () => {
      const fields = validateAiCmdEntityFields(cmd('create_product')).map(
        (i) => i.field,
      );
      expect(fields).toEqual(expect.arrayContaining(['productName', 'price']));
    });

    it('e2e-bug.148 — create_product accepts retailPrice in place of price', () => {
      expect(
        validateAiCmdEntityFields(
          cmd('create_product', {
            productName: 'QA Test Product',
            retailPrice: 5,
          }),
        ),
      ).toHaveLength(0);
    });

    it('configure_zendesk requires subdomain', () => {
      expect(
        validateAiCmdEntityFields(cmd('configure_zendesk'))[0]?.field,
      ).toBe('subdomain');
    });
  });

  describe('reschedule and subscription paths', () => {
    it('reschedule_package_visit requires booking and new time', () => {
      const fields = validateAiCmdEntityFields(
        cmd('reschedule_package_visit'),
      ).map((i) => i.field);
      expect(fields).toEqual(expect.arrayContaining(['bookingId', 'date']));
    });

    it('reschedule_package_visit passes with bookingId and date', () => {
      expect(
        validateAiCmdEntityFields(
          cmd('reschedule_package_visit', { bookingId: 'b1', date: 'Friday' }),
        ),
      ).toHaveLength(0);
    });

    it('use_subscription_credit requires service and date', () => {
      const fields = validateAiCmdEntityFields(
        cmd('use_subscription_credit'),
      ).map((i) => i.field);
      expect(fields).toEqual(expect.arrayContaining(['serviceName', 'date']));
    });

    it('apply_gift_card_code requires code', () => {
      expect(
        validateAiCmdEntityFields(cmd('apply_gift_card_code'))[0]?.field,
      ).toBe('giftCardCode');
    });

    it('book_with_gift_card passes with code, service, date', () => {
      expect(
        validateAiCmdEntityFields(
          cmd('book_with_gift_card', {
            giftCardCode: 'GC-1',
            serviceName: 'massage',
            date: 'tomorrow',
          }),
        ),
      ).toHaveLength(0);
    });
  });
});
