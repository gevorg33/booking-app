import { Test } from '@nestjs/testing';
import { AiClinicLabBookingService } from './ai-clinic-lab-booking.service.js';
import { Business } from '../business/entities/business.entity.js';
import { ClinicTestOrderBookingRequestService } from '../clinic-test-results/order/clinic-test-order-booking-request.service.js';
import { ClinicTestOrderService } from '../clinic-test-results/order/clinic-test-order.service.js';
import { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BOOK_LAB_FROM_ORDER_PROMPTS,
  BOOK_LAB_FROM_ORDER_RESCUE_SCENARIOS,
} from './ai-book-lab-from-order.fixtures.js';
import { rescueConsumerClinicLabBookingIntent } from './ai-clinic-lab-booking.util.js';

describe('ai-book-lab-from-order integration (ai-cmd-customer-4.14.4)', () => {
  let service: AiClinicLabBookingService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiClinicLabBookingService,
        {
          provide: getRepositoryToken(Business),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              id: 'biz-1',
              settings: { businessType: 'clinic' },
            }),
          },
        },
        {
          provide: ClinicTestOrderService,
          useValue: { listLabQueue: jest.fn() },
        },
        {
          provide: ClinicTestOrderBookingRequestService,
          useValue: {
            listPendingBookingRequestsForCustomer: jest.fn().mockResolvedValue([
              {
                orderId: 'ord-1',
                displayNames: 'CBC',
                collectionServiceName: 'Blood draw',
                collectionServiceId: 'svc-1',
                token: 'tok-1',
                pushedAt: '2026-06-01T10:00:00.000Z',
                collectionBookingId: null,
                bookUrl: 'https://example.com/book',
              },
            ]),
          },
        },
        {
          provide: ClinicLabAccessService,
          useValue: { scopeLabQueueFilters: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(AiClinicLabBookingService);
  });

  it.each(
    BOOK_LAB_FROM_ORDER_PROMPTS.slice(0, 3).map((row) => [row.id, row.prompt]),
  )('handles book_lab_from_order for $0', async (_id, prompt) => {
    const result = await service.handleBookLabFromOrder(
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('book_lab_from_order');
  });

  it.each(BOOK_LAB_FROM_ORDER_RESCUE_SCENARIOS)(
    'pipeline rescues book_lab_from_order for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueConsumerClinicLabBookingIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('book_lab_from_order');
    },
  );
});
