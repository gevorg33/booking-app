import { PROVIDER_EXP_2_PROMPT_SCENARIOS } from './ai-provider-exp-2.fixtures.js';
import {
  extractBookingActionCustomerName,
  extractRunningLateMinutesFromPrompt,
  formatProviderMyStatsSummary,
  formatTeamFloorStatusSummary,
  inferMyStatsPeriodFromPrompt,
  inferMyStatsScopeFromPrompt,
  isCheckInClientPrompt,
  isMarkRunningLatePrompt,
  isMyStatsPrompt,
  isTeamFloorStatusPrompt,
  rescueProviderExp2Intent,
} from './ai-provider-exp-2.util.js';

describe('ai-provider-exp-2.util', () => {
  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'my_stats',
    ).map((s) => [s.id, s.prompt]),
  )('detects my_stats prompt %s', (_id, prompt) => {
    expect(isMyStatsPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'team_floor_status',
    ).map((s) => [s.id, s.prompt]),
  )('detects team_floor_status prompt %s', (_id, prompt) => {
    expect(isTeamFloorStatusPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'check_in_client',
    ).map((s) => [s.id, s.prompt]),
  )('detects check_in_client prompt %s', (_id, prompt) => {
    expect(isCheckInClientPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'mark_running_late',
    ).map((s) => [s.id, s.prompt]),
  )('detects mark_running_late prompt %s', (_id, prompt) => {
    expect(isMarkRunningLatePrompt(prompt)).toBe(true);
  });

  it.each(PROVIDER_EXP_2_PROMPT_SCENARIOS.map((s) => [s.id, s]))(
    'rescues $0 to $1.expectedAction',
    (_id, scenario) => {
      expect(rescueProviderExp2Intent(scenario.prompt, 'unknown')?.action).toBe(
        scenario.expectedAction,
      );
    },
  );

  it('infers month period and team scope from prompt', () => {
    expect(inferMyStatsPeriodFromPrompt('How am I doing this month?', {})).toBe(
      'month',
    );
    expect(inferMyStatsScopeFromPrompt('Team stats for the week', {})).toBe(
      'team',
    );
    expect(inferMyStatsPeriodFromPrompt('stats', { period: 'month' })).toBe(
      'month',
    );
    expect(inferMyStatsScopeFromPrompt('stats', { scope: 'team' })).toBe(
      'team',
    );
  });

  it('extracts running late minutes from prompt and params', () => {
    expect(
      extractRunningLateMinutesFromPrompt("I'm running 10 minutes late", {}),
    ).toBe(10);
    expect(
      extractRunningLateMinutesFromPrompt('late', { minutesLate: 15 }),
    ).toBe(15);
  });

  it('formats my stats summary with tips and reviews', () => {
    const summary = formatProviderMyStatsSummary(
      {
        period: 'week',
        scope: 'mine',
        from: '2026-06-02',
        to: '2026-06-08',
        canTeamRollup: false,
        completedBookings: 12,
        paidRevenue: 480,
        currency: 'USD',
        utilizationPercent: 72,
        bookedMinutes: 360,
        scheduledMinutes: 500,
        averageReviewScore: 4.8,
        newReviewsCount: 3,
        employeeCount: 1,
        tipsEnabled: true,
        tipTotal: 40,
        tippedVisitCount: 4,
      },
      { currency: 'USD' },
    );
    expect(summary).toContain('12 completed visits');
    expect(summary).toContain('4.8★');
    expect(summary).toContain('tips');
  });

  it('formats empty team floor summary', () => {
    expect(
      formatTeamFloorStatusSummary({
        date: '2026-06-09',
        viewMode: 'team',
        filterEmployeeId: null,
        providers: [],
        columns: [],
        totalBookings: 0,
      }),
    ).toContain('clear today');
  });

  it('formats team floor summary with column counts', () => {
    const summary = formatTeamFloorStatusSummary({
      date: '2026-06-09',
      viewMode: 'team',
      filterEmployeeId: null,
      providers: [{ id: 'emp-1', name: 'Alex' }],
      totalBookings: 2,
      columns: [
        {
          employeeId: 'emp-1',
          employeeName: 'Alex',
          statusCounts: {
            waiting: 1,
            in_service: 1,
            done: 0,
            no_show: 0,
          },
          bookings: [
            {
              id: 'bk-1',
              teamFloorStatus: 'waiting',
              customer: { name: 'Jane' },
            },
          ],
        },
      ],
    } as any);
    expect(summary).toContain('Team floor today');
    expect(summary).toContain('Alex');
    expect(summary).toContain('Jane');
  });

  it('extracts customer names from check-in and running late prompts', () => {
    expect(extractBookingActionCustomerName('Check in Jane Doe', {})).toBe(
      'Jane Doe',
    );
    expect(extractBookingActionCustomerName('Mark Sam checked in', {})).toBe(
      'Sam',
    );
    expect(
      extractBookingActionCustomerName(
        "I'm running 10 minutes late for Jane",
        {},
      ),
    ).toBe('Jane');
  });

  it('rescues summarize_utilization misroute to my_stats', () => {
    expect(
      rescueProviderExp2Intent(
        'Show my stats this week',
        'summarize_utilization',
      )?.action,
    ).toBe('my_stats');
  });

  it('extracts armenian and cyrillic running late minutes', () => {
    expect(extractRunningLateMinutesFromPrompt('Ես 10 րոպե ուշ եմ', {})).toBe(
      10,
    );
    expect(
      extractRunningLateMinutesFromPrompt('Я опаздываю на 10 минут', {}),
    ).toBe(10);
  });

  it('reads numeric minutesLate param when already a number', () => {
    expect(
      extractRunningLateMinutesFromPrompt('late', { minutesLate: 12 }),
    ).toBe(12);
    expect(
      extractRunningLateMinutesFromPrompt('late', { minutesLate: '8' }),
    ).toBe(8);
  });

  it('returns null when prompt does not match exp-2 intents', () => {
    expect(rescueProviderExp2Intent('hello team', 'unknown')).toBeNull();
  });

  it('formats idle team floor column without active bookings', () => {
    const summary = formatTeamFloorStatusSummary({
      date: '2026-06-09',
      viewMode: 'team',
      filterEmployeeId: null,
      providers: [{ id: 'emp-2', name: 'Sam' }],
      totalBookings: 1,
      columns: [
        {
          employeeId: 'emp-2',
          employeeName: 'Sam',
          statusCounts: {
            waiting: 0,
            in_service: 0,
            done: 0,
            no_show: 0,
          },
          bookings: [],
        },
      ],
    } as any);
    expect(summary).toContain('idle');
  });

  it('formats team-scoped stats label', () => {
    const summary = formatProviderMyStatsSummary(
      {
        period: 'week',
        scope: 'team',
        from: '2026-06-02',
        to: '2026-06-08',
        canTeamRollup: true,
        completedBookings: 20,
        paidRevenue: 2000,
        currency: 'USD',
        utilizationPercent: 80,
        bookedMinutes: 400,
        scheduledMinutes: 500,
        averageReviewScore: 5,
        newReviewsCount: 1,
        employeeCount: 4,
        tipsEnabled: true,
        tipTotal: 100,
        tippedVisitCount: 5,
      },
      { currency: 'USD' },
    );
    expect(summary).toContain('Team stats');
    expect(summary).toContain('tips');
  });

  it('formats my stats without optional review and tip lines', () => {
    const summary = formatProviderMyStatsSummary(
      {
        period: 'week',
        scope: 'mine',
        from: '2026-06-02',
        to: '2026-06-08',
        canTeamRollup: false,
        completedBookings: 0,
        paidRevenue: 0,
        currency: 'USD',
        utilizationPercent: 0,
        bookedMinutes: 0,
        scheduledMinutes: 0,
        averageReviewScore: null,
        newReviewsCount: 0,
        employeeCount: 1,
        tipsEnabled: false,
      },
      { currency: 'USD' },
    );
    expect(summary).toContain('0 completed visits');
    expect(summary).not.toContain('★');
  });
});
