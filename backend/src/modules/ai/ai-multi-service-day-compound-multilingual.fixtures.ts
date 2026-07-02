import type { MultiServiceDayCompoundFixture } from './ai-multi-service-day-compound.fixtures.js';

export const MULTI_SERVICE_DAY_MULTILINGUAL_SCENARIOS: readonly MultiServiceDayCompoundFixture[] =
  [
    {
      id: 'multi-day-hy-massage-facial',
      prompt:
        'Massage and facial same afternoon — find a time — masazh ev masazh mersum nuyn orva popoxutyun',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: {
        serviceNames: ['massage', 'facial'],
        timeOfDay: 'afternoon',
      },
    },
    {
      id: 'multi-day-hy-haircut-color',
      prompt: 'Haircut and color same day find a time — patser ev guyn nuyn or',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: { serviceNames: ['haircut', 'color'] },
    },
    {
      id: 'multi-day-ru-massage-facial',
      prompt:
        'Massage and facial same afternoon — find a time — massazh i pedikyur v odin den',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: {
        serviceNames: ['massage', 'facial'],
        timeOfDay: 'afternoon',
      },
    },
    {
      id: 'multi-day-ru-manicure-pedicure',
      prompt:
        'Manicure and pedicure tomorrow afternoon check and book — manikyur i pedikyur zavtra',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: {
        serviceNames: ['manicure', 'pedicure'],
        timeOfDay: 'afternoon',
      },
    },
  ];
