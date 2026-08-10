import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('list_upcoming_bookings / get_schedule_summary (ai-cmd-provider-6.2)', () => {
  const businessId = 'biz-schedule-1';
  const userId = 'user-schedule-1';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock<any> };
  let providerMobile: {
    resolveMobileAccess: jest.Mock;
    getScopedEmployeeId: jest.Mock;
    getUpcomingBookings: jest.Mock<any>;
    getScheduleSummary: jest.Mock<any>;
  };

  beforeEach(() => {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(),
    };
    providerMobile = {
      resolveMobileAccess: jest.fn(async () => ({
        viewMode: 'provider' as const,
        membershipRole: MemberRole.STAFF,
        employee: { id: 'emp-1', name: 'Alex Provider' },
      })),
      getScopedEmployeeId: jest.fn(() => 'emp-1'),
      getUpcomingBookings: jest.fn(async () => ({
        viewMode: 'provider',
        from: '2026-07-03',
        to: '2026-07-10',
        bookings: [{ id: 'b1' }, { id: 'b2' }],
      })),
      getScheduleSummary: jest.fn(async () => ({
        viewMode: 'provider',
        employee: { id: 'emp-1', name: 'Alex Provider' },
        days: [
          { date: '2026-07-03', available: 3, booked: 2 },
          { date: '2026-07-04', available: 1, booked: 4 },
        ],
        todayTimeline: { enabled: false },
        timeOffRequests: [],
      })),
    };
    service = createProviderAiCommandHarness({
      llm,
      providerMobile,
      providerBooking: {
        isProviderBookingCompound: jest.fn(() => false),
        handleProviderBookingCompound: jest.fn(),
      },
      pushNotifications: {
        isPushNotificationsCompound: jest.fn(() => false),
        handlePushNotificationsCompound: jest.fn(),
      },
    });
  });

  it('dispatches list_upcoming_bookings with a resolved days window', async () => {
    llm.completeJson.mockResolvedValueOnce({
      action: 'list_upcoming_bookings',
      params: {},
      reasoning: 'harness classified',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      "What's coming up on my schedule for the next 10 days?",
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('list_upcoming_bookings');
    expect(result.summary).toContain('2 upcoming booking');
    expect(providerMobile.getUpcomingBookings).toHaveBeenCalledWith(
      businessId,
      userId,
      10,
    );
  });

  it('defaults list_upcoming_bookings to 7 days with no cue', async () => {
    llm.completeJson.mockResolvedValueOnce({
      action: 'list_upcoming_bookings',
      params: {},
      reasoning: 'harness classified',
    });

    await service.executeCommand(
      businessId,
      userId,
      'What do I have coming up?',
    );

    expect(providerMobile.getUpcomingBookings).toHaveBeenCalledWith(
      businessId,
      userId,
      7,
    );
  });

  it('dispatches get_schedule_summary and totals booked/available', async () => {
    llm.completeJson.mockResolvedValueOnce({
      action: 'get_schedule_summary',
      params: {},
      reasoning: 'harness classified',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Summarize my schedule for the next two weeks',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('get_schedule_summary');
    expect(result.summary).toContain('6 booked');
    expect(result.summary).toContain('4 available');
    expect(providerMobile.getScheduleSummary).toHaveBeenCalledWith(
      businessId,
      userId,
      14,
    );
  });

  it('defaults get_schedule_summary to 14 days with no cue', async () => {
    llm.completeJson.mockResolvedValueOnce({
      action: 'get_schedule_summary',
      params: {},
      reasoning: 'harness classified',
    });

    await service.executeCommand(
      businessId,
      userId,
      'Give me a schedule overview',
    );

    expect(providerMobile.getScheduleSummary).toHaveBeenCalledWith(
      businessId,
      userId,
      14,
    );
  });
});
