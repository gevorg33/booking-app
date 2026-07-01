import { handleReportBookingProblemLogic } from './ai-report-booking-problem.logic.js';

describe('ai-report-booking-problem.logic (ai-cmd-customer-4.12.3)', () => {
  const booking = {
    id: 'book-1',
    startTime: '2030-06-01T10:00:00.000Z',
    endTime: '2030-06-01T11:00:00.000Z',
    status: 'completed',
    paymentStatus: 'paid',
    serviceName: 'Haircut',
    employeeName: 'Alex',
    canReview: false,
  };

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'glow-salon' })),
    },
    publicCustomerAuthService: {
      listBookings: jest.fn(async () => ({ bookings: [booking] })),
    },
    publicConsumerSupportService: {
      createPostBookingSupportTicket: jest.fn(async () => ({
        ticketId: 42,
        agentUrl: 'https://example.zendesk.com/agent/tickets/42',
      })),
    },
    configService: {
      get: jest.fn(() => 'https://book.example.com'),
    },
    publicBookingService: {},
    publicCustomerBookingService: {},
    bookingRepo: {},
    packagesService: {},
    subscriptionsService: {},
    multiServiceBookingsService: {},
    serviceRepo: {},
  });

  it('requires sign-in', async () => {
    const result = await handleReportBookingProblemLogic(
      deps() as any,
      'biz-1',
      {},
      'Something went wrong with my visit',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/Sign in/i);
  });

  it('submits zendesk ticket for signed-in customer', async () => {
    const localDeps = deps();
    const result = await handleReportBookingProblemLogic(
      localDeps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Something went wrong with my visit',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('report_booking_problem');
    expect(result.details.handoff).toBe('zendesk_ticket');
    expect(
      localDeps.publicConsumerSupportService.createPostBookingSupportTicket,
    ).toHaveBeenCalled();
  });

  it('falls back to web support when email is missing', async () => {
    const localDeps = deps();
    localDeps.publicConsumerSupportService.createPostBookingSupportTicket =
      jest.fn(async () => {
        throw new Error(
          'An email on your profile is required to open a support ticket',
        );
      });
    const result = await handleReportBookingProblemLogic(
      localDeps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'I was charged twice',
    );
    expect(result.success).toBe(true);
    expect(result.details.handoff).toBe('support_web');
    expect(result.details.supportUrl).toMatch(/support=1/);
  });

  it('clarifies when prompt is not a booking problem', async () => {
    const result = await handleReportBookingProblemLogic(
      deps() as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Contact support',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails when customer has no bookings', async () => {
    const localDeps = deps();
    localDeps.publicCustomerAuthService.listBookings = jest.fn(async () => ({
      bookings: [],
    }));
    const result = await handleReportBookingProblemLogic(
      localDeps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Something went wrong with my visit',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/No bookings found/i);
  });

  it('asks which booking when multiple match', async () => {
    const localDeps = deps();
    localDeps.publicCustomerAuthService.listBookings = jest.fn(async () => ({
      bookings: [
        booking,
        {
          ...booking,
          id: 'book-2',
          startTime: '2030-06-02T10:00:00.000Z',
        },
      ],
    }));
    const result = await handleReportBookingProblemLogic(
      localDeps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1', serviceName: 'Haircut' },
      'Something went wrong with my haircut',
    );
    expect(result.success).toBe(false);
    expect(result.details?.missing).toContain('bookingId');
    expect(result.summary).toMatch(/Multiple bookings match/i);
  });

  it('fails when no booking matches filters', async () => {
    const result = await handleReportBookingProblemLogic(
      deps() as any,
      'biz-1',
      { sessionCustomerId: 'cust-1', serviceName: 'Manicure' },
      'Something went wrong with my visit',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/No matching booking/i);
  });

  it('returns hard failure when ticket creation fails without web origin', async () => {
    const localDeps = deps();
    localDeps.configService.get = jest.fn(() => '');
    localDeps.publicConsumerSupportService.createPostBookingSupportTicket =
      jest.fn(async () => {
        throw new Error('Zendesk unavailable');
      });
    const result = await handleReportBookingProblemLogic(
      localDeps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Something went wrong with my visit',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/Zendesk unavailable/i);
  });
});
