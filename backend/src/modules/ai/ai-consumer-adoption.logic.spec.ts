import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  handleFindMySavedSalonsLogic,
  handleRebookLastAppointmentLogic,
} from './ai-consumer-adoption.logic.js';

describe('ai-consumer-adoption.logic', () => {
  it('lists saved salons from client context', async () => {
    const result = await handleFindMySavedSalonsLogic({
      recentSalons: [{ slug: 'demo-salon', name: 'Demo Salon' }],
    });
    expect(result.success).toBe(true);
    expect(result.action).toBe('find_my_saved_salons');
    expect(result.details?.recentSalons).toHaveLength(1);
  });

  it('rebooks the last completed visit', async () => {
    const result = await handleRebookLastAppointmentLogic(
      {
        publicCustomerAuthService: {
          listBookings: jest.fn(async () => ({
            bookings: [
              {
                id: 'b1',
                serviceId: 'svc-1',
                serviceName: 'Haircut',
                employeeId: 'emp-1',
                employeeName: 'Alex',
                startTime: '2026-05-01T10:00:00.000Z',
                status: BookingStatus.COMPLETED,
              },
            ],
          })),
        } as any,
        publicBookingService: {} as any,
        pushNotifications: {} as any,
      },
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        slug: 'demo-salon',
      },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('rebook_last_appointment');
    expect(result.details?.navigate).toMatchObject({
      path: 'checkout',
      query: expect.objectContaining({ serviceId: 'svc-1', rebook: '1' }),
    });
  });
});
