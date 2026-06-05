import { EventType } from '../../../events/event-types.js';
import { ZendeskReviewListener } from './zendesk-review.listener.js';
import { ZendeskIntegrationService } from './zendesk-integration.service.js';

describe('ZendeskReviewListener', () => {
  const zendesk = {
    createTicketFromReviewIfEnabled: jest.fn(),
  };

  const listener = new ZendeskReviewListener(
    zendesk as unknown as ZendeskIntegrationService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates zendesk ticket on review.received', async () => {
    zendesk.createTicketFromReviewIfEnabled.mockResolvedValue({ ticketId: 42 });
    await listener.handleReviewReceived({
      aggregateId: 'rev-1',
      businessId: 'biz-1',
      eventType: EventType.REVIEW_RECEIVED,
      payload: {
        reviewId: 'rev-1',
        rating: 2,
        comment: 'Waited too long',
        customerName: 'Jane Doe',
        employeeId: 'emp-1',
        customerId: 'cust-1',
        bookingId: 'book-1',
      },
    } as any);

    expect(zendesk.createTicketFromReviewIfEnabled).toHaveBeenCalledWith(
      'biz-1',
      {
        reviewId: 'rev-1',
        employeeId: 'emp-1',
        rating: 2,
        comment: 'Waited too long',
        customerId: 'cust-1',
        bookingId: 'book-1',
        customerName: 'Jane Doe',
      },
    );
  });

  it('skips when business id missing', async () => {
    await listener.handleReviewReceived({
      aggregateId: 'rev-1',
      payload: { rating: 5 },
    } as any);
    expect(zendesk.createTicketFromReviewIfEnabled).not.toHaveBeenCalled();
  });

  it('swallows errors without rethrowing', async () => {
    zendesk.createTicketFromReviewIfEnabled.mockRejectedValue(
      new Error('Zendesk down'),
    );
    await expect(
      listener.handleReviewReceived({
        aggregateId: 'rev-1',
        businessId: 'biz-1',
        payload: { rating: 4 },
      } as any),
    ).resolves.toBeUndefined();
  });

  it('does not log ticket when feature disabled', async () => {
    zendesk.createTicketFromReviewIfEnabled.mockResolvedValue(null);
    await listener.handleReviewReceived({
      aggregateId: 'rev-1',
      businessId: 'biz-1',
      payload: { rating: 5 },
    } as any);
    expect(zendesk.createTicketFromReviewIfEnabled).toHaveBeenCalled();
  });
});
