import {
  E2E52_EXPECTED_NAVIGATE,
  E2E52_MY_APPOINTMENTS_NAVIGATE_CASES,
} from './ai-e2e52-my-appointments-navigate.fixtures.js';
import { handleMyAppointmentsLogic } from './ai-customer-crm.logic.js';
import { buildMyAppointmentsNavigate } from './ai-customer-crm.util.js';
import { handleListMyAppointmentsLogic } from './ai-self-service-booking.logic.js';
import { handleListMyUpcomingAppointmentsLogic } from './ai-list-my-upcoming-appointments.logic.js';
import { commandResultToPublicAssistantResult } from './customer-ai-command.util.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('e2e-bug.52 my_appointments navigates to Account bookings', () => {
  it('buildMyAppointmentsNavigate deep-links to account bookings tab', () => {
    expect(buildMyAppointmentsNavigate()).toEqual(E2E52_EXPECTED_NAVIGATE);
  });

  it.each(E2E52_MY_APPOINTMENTS_NAVIGATE_CASES)(
    '$id: handler navigate survives public assistant shaping',
    async ({ appointments, expectedSummary }) => {
      const result = await handleMyAppointmentsLogic(
        {
          customerService: {
            getCustomerDetail: jest.fn(async () => ({
              customer: { id: 'cust-1' },
              stats: {},
              appointments,
            })),
          },
        } as any,
        'biz-1',
        { sessionCustomerId: 'cust-1' },
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('my_appointments');
      expect(result.summary).toBe(expectedSummary);
      expect(result.details?.navigate).toEqual(E2E52_EXPECTED_NAVIGATE);

      const publicResult = commandResultToPublicAssistantResult(result);
      expect(publicResult.navigate).toEqual(E2E52_EXPECTED_NAVIGATE);
      expect(publicResult.summary).toBe(expectedSummary);
    },
  );

  it('list_my_appointments includes the same Account handoff', async () => {
    const result = await handleListMyAppointmentsLogic(
      {
        businessRepo: {
          findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'demo' })),
        },
        publicCustomerAuthService: {
          listBookings: jest.fn(async () => ({
            bookings: [
              {
                id: 'b1',
                serviceName: 'facemassage',
                employeeName: 'Alex',
                startTime: '2026-07-20T10:00:00.000Z',
                status: BookingStatus.CONFIRMED,
                canCancel: true,
                canReschedule: true,
              },
            ],
          })),
        },
      } as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
    );

    expect(result.success).toBe(true);
    expect(result.details?.navigate).toEqual(E2E52_EXPECTED_NAVIGATE);
    expect(commandResultToPublicAssistantResult(result).navigate).toEqual(
      E2E52_EXPECTED_NAVIGATE,
    );
  });

  it('list_my_upcoming_appointments uses tab=bookings handoff', async () => {
    const result = await handleListMyUpcomingAppointmentsLogic(
      {
        businessRepo: {
          findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'demo' })),
        },
        publicCustomerAuthService: {
          listBookings: jest.fn(async () => ({
            bookings: [
              {
                id: 'b1',
                serviceName: 'facemassage',
                employeeName: 'Alex',
                startTime: '2026-07-20T10:00:00.000Z',
                status: BookingStatus.CONFIRMED,
                canCancel: true,
                canReschedule: true,
              },
            ],
          })),
        },
      } as any,
      'biz-1',
      { sessionCustomerId: 'cust-1', _timeZone: 'UTC' },
      'Show my upcoming appointments',
    );

    expect(result.success).toBe(true);
    expect(result.details?.navigate).toEqual(E2E52_EXPECTED_NAVIGATE);
  });

  it('requires sign-in for my_appointments', async () => {
    const result = await handleMyAppointmentsLogic(
      { customerService: { getCustomerDetail: jest.fn() } } as any,
      'biz-1',
      {},
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
