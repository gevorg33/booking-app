import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import { handleRebookLastAppointmentLogic } from './ai-rebook-last-appointment.logic.js';

describe('ai-rebook-last-appointment.logic (ai-cmd-customer-4.4.8)', () => {
  const booking = {
    id: 'b1',
    serviceId: 'svc-1',
    serviceName: 'Haircut',
    employeeId: 'emp-1',
    employeeName: 'Alex',
    startTime: '2026-05-01T10:00:00.000Z',
    status: BookingStatus.COMPLETED,
  };

  const deps = () => ({
    publicCustomerAuthService: {
      listBookings: jest.fn(async () => ({ bookings: [booking] })),
    },
    businessRepo: {
      findOne: jest.fn(async () =>
        makeBusiness({ id: 'biz-1', slug: 'demo-salon' }),
      ),
    },
  });

  it('requires sign-in', async () => {
    const result = await handleRebookLastAppointmentLogic(
      deps() as any,
      'biz-1',
      { slug: 'demo-salon' },
      'Rebook my last appointment',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/sign in/i);
  });

  it('returns checkout navigate with rebook query', async () => {
    const result = await handleRebookLastAppointmentLogic(
      deps() as any,
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'demo-salon' },
      'Book the same as last time',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('rebook_last_appointment');
    expect(result.details?.navigate).toMatchObject({
      path: 'checkout',
      query: expect.objectContaining({
        serviceId: 'svc-1',
        rebook: '1',
        rebookBookingId: 'b1',
        rebookSource: 'account',
        date: '2026-05-01',
        slot: '2026-05-01T10:00:00.000Z',
      }),
    });
    expect(String(result.details?.path)).toContain('/book/svc-1');
  });

  it('handles no completed visits', async () => {
    const localDeps = deps();
    localDeps.publicCustomerAuthService.listBookings = jest.fn(async () => ({
      bookings: [],
    }));
    const result = await handleRebookLastAppointmentLogic(
      localDeps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'demo-salon' },
      'Repeat my last visit',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/No completed visits/i);
  });
});
