import {
  shouldValidateAction,
  validateCommand,
} from './command-completion.validator.js';
import {
  AI_CMD_ENTITY_VALIDATED_ACTIONS,
  isAiCmdEntityValidatedAction,
} from './ai-cmd-entity-completion.util.js';
import type { ResolvedCommand } from './command-completion.types.js';

function cmd(
  action: string,
  params: Record<string, unknown> = {},
): ResolvedCommand {
  const employeeName = params.employeeName as string | undefined;
  const serviceName = params.serviceName as string | undefined;
  const serviceNames = params.serviceNames as string[] | undefined;
  return {
    action,
    prompt: '',
    params,
    enrichedParams: {},
    entities: {
      employees: employeeName ? [{ id: 'e1', name: employeeName } as any] : [],
      employee: employeeName ? ({ id: 'e1', name: employeeName } as any) : null,
      services: serviceNames?.length
        ? serviceNames.map((name, i) => ({ id: `s${i}`, name }) as any)
        : serviceName
          ? [{ id: 's1', name: serviceName } as any]
          : [],
      service: serviceName ? ({ id: 's1', name: serviceName } as any) : null,
      template: null,
      dateRange: null,
    },
    reasoning: 'test',
    confidence: 0.9,
  } as ResolvedCommand;
}

describe('ai-cmd command completion (ai-cmd-t4)', () => {
  it('shouldValidateAction includes bookingDepth+ entity actions', () => {
    for (const action of AI_CMD_ENTITY_VALIDATED_ACTIONS) {
      expect(shouldValidateAction(action)).toBe(true);
      expect(isAiCmdEntityValidatedAction(action)).toBe(true);
    }
  });

  const incompleteCases: Array<[string, string[]]> = [
    [
      'create_package_booking',
      ['packageName', 'customerName', 'date', 'timeSlot'],
    ],
    [
      'create_multi_service_booking',
      ['serviceNames', 'employeeName', 'date', 'timeSlot'],
    ],
    ['book_package', ['packageName', 'date']],
    ['book_multi_service', ['serviceNames', 'date']],
    ['cancel_package_visit', ['bookingId']],
    ['assign_booking_resource', ['bookingId', 'resourceName']],
    ['bulk_create_catalog', ['categoryDraft']],
    ['check_gift_card_balance', ['giftCardCode']],
    ['add_services_to_cart', ['serviceNames']],
    ['configure_zendesk', ['subdomain']],
    ['create_product', ['productName', 'price']],
  ];

  it.each(incompleteCases)(
    'validateCommand fails for incomplete %s',
    (action, expectedFields) => {
      const result = validateCommand(cmd(action));
      expect(result.ok).toBe(false);
      for (const field of expectedFields) {
        expect(result.issues.some((i) => i.field === field)).toBe(true);
      }
    },
  );

  const completeCases: Array<[string, Record<string, unknown>]> = [
    [
      'create_package_booking',
      {
        packageName: 'Spa Day',
        customerName: 'Maria',
        date: '29_05_2026',
        timeSlot: '10:00',
      },
    ],
    [
      'create_package_booking',
      {
        packageName: 'Spa Day',
        customerName: 'Maria',
        bookingFirstAvailable: true,
        timeOfDay: 'evening',
      },
    ],
    [
      'create_multi_service_booking',
      {
        serviceNames: ['haircut', 'beard trim'] as string[],
        employeeName: 'Anna',
        date: '29_05_2026',
        timeSlot: '10:00',
      },
    ],
    [
      'create_multi_service_booking',
      {
        serviceNames: ['haircut', 'beard trim'] as string[],
        employeeName: 'Anna',
        bookingFirstAvailable: true,
        timeOfDay: 'morning',
      },
    ],
    ['book_package', { packageName: 'Spa Day', date: 'tomorrow' }],
    ['book_multi_service', { serviceNames: ['massage'], date: 'Friday' }],
    ['cancel_package_visit', { bookingId: 'b1' }],
    ['assign_booking_resource', { timeSlot: '14:00', resourceName: 'Room 2' }],
    ['check_gift_card_balance', { giftCardCode: 'GCM-ABCD' }],
    ['add_services_to_cart', { serviceNames: ['massage'] }],
    ['create_product', { productName: 'shampoo', price: 18 }],
  ];

  it.each(completeCases)(
    'validateCommand passes for complete %s',
    (action, params) => {
      expect(validateCommand(cmd(action, params)).ok).toBe(true);
    },
  );

  it('validateCommand merges legacy and entity rules without duplication for create_booking', () => {
    const incomplete = validateCommand(
      cmd('create_booking', {
        employeeName: 'Gevorg',
        date: '29_05_2026',
        timeSlot: '09:00',
      }),
    );
    expect(incomplete.ok).toBe(false);
    expect(incomplete.issues.some((i) => i.field === 'serviceName')).toBe(true);
  });
});
