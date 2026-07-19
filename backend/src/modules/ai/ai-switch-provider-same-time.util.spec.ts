import { formatTimeDisplay } from '../../common/utils/date-format.util.js';
import { handleSwitchProviderSameTimeLogic } from './ai-switch-provider-same-time.logic.js';
import { SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_SCENARIOS } from './ai-switch-provider-same-time-multilingual.fixtures.js';
import {
  SWITCH_PROVIDER_SAME_TIME_PROMPTS,
  SWITCH_PROVIDER_SAME_TIME_RESCUE_SCENARIOS,
} from './ai-switch-provider-same-time.fixtures.js';
import {
  detectSwitchProviderSameTimeAction,
  enrichSwitchProviderSameTimeParamsFromPrompt,
  extractNamedProviderForSameTimeSwitch,
  hasSwitchProviderSameTimeCoreCue,
  inferSwitchProviderSameTimeMode,
  isSwitchProviderSameTimeIntent,
  isSwitchProviderSameTimePrompt,
  parseSwitchProviderSameTimeFromPrompt,
  rescueSwitchProviderSameTimeIntent,
} from './ai-switch-provider-same-time.util.js';

describe('ai-switch-provider-same-time.util (ai-cmd-customer-4.11.4)', () => {
  it.each(SWITCH_PROVIDER_SAME_TIME_PROMPTS)(
    'detects switch provider same time prompt $id',
    (row) => {
      expect(isSwitchProviderSameTimePrompt(row.prompt)).toBe(true);
      expect(parseSwitchProviderSameTimeFromPrompt(row.prompt)?.mode).toBe(
        row.mode,
      );
    },
  );

  it.each(SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_SCENARIOS)(
    'detects multilingual switch provider same time prompt $id',
    (row) => {
      expect(isSwitchProviderSameTimePrompt(row.prompt)).toBe(true);
    },
  );

  it.each(SWITCH_PROVIDER_SAME_TIME_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueSwitchProviderSameTimeIntent(prompt, misclassifiedAction)?.action,
      ).toBe('switch_provider_same_time');
    },
  );

  it('extracts named provider and time slot', () => {
    expect(
      extractNamedProviderForSameTimeSwitch('Keep 3pm but switch to Anna'),
    ).toBe('Anna');
    expect(
      parseSwitchProviderSameTimeFromPrompt('Keep 3pm but switch to Anna'),
    ).toEqual({
      mode: 'keep_time_named_provider',
      timeSlot: '15:00',
      providerName: 'Anna',
    });
  });

  it('infers keep_time_any_provider without a named stylist', () => {
    expect(
      inferSwitchProviderSameTimeMode('Keep 3pm but different stylist'),
    ).toBe('keep_time_any_provider');
    expect(
      hasSwitchProviderSameTimeCoreCue('Keep 3pm but different stylist'),
    ).toBe(true);
  });

  it('rejects reschedule-only provider change', () => {
    expect(
      isSwitchProviderSameTimePrompt(
        'Change provider when I reschedule my booking',
      ),
    ).toBe(false);
  });

  it('rejects plain pick-provider prompts', () => {
    expect(isSwitchProviderSameTimePrompt('Book with Anna for color')).toBe(
      false,
    );
    expect(isSwitchProviderSameTimePrompt('I want Anna as my stylist')).toBe(
      false,
    );
  });

  it('detects heuristic keep-time switch prompts outside fixtures', () => {
    expect(
      isSwitchProviderSameTimePrompt(
        'Keep the same time but change stylist please',
      ),
    ).toBe(true);
  });

  it('rejects availability-only prompts', () => {
    expect(isSwitchProviderSameTimePrompt('Who has openings tomorrow?')).toBe(
      false,
    );
  });

  it('skips invalid captured provider names', () => {
    expect(
      extractNamedProviderForSameTimeSwitch('switch to stylist instead'),
    ).toBeNull();
  });

  it('downgrades named mode when provider name is missing', () => {
    expect(
      parseSwitchProviderSameTimeFromPrompt('Keep 3pm but different stylist', {
        mode: 'keep_time_named_provider',
      }),
    ).toEqual({
      mode: 'keep_time_any_provider',
      timeSlot: '15:00',
    });
  });

  it('returns original params when prompt does not parse for enrich', () => {
    const params = { serviceId: 'svc-1' };
    expect(
      enrichSwitchProviderSameTimeParamsFromPrompt(
        params,
        'Book with Anna for color',
      ),
    ).toBe(params);
  });

  it('returns null rescue when already classified', () => {
    expect(
      rescueSwitchProviderSameTimeIntent(
        'Keep 3pm but different stylist',
        'switch_provider_same_time',
      ),
    ).toBeNull();
  });

  it('enriches params from prompt', () => {
    expect(
      enrichSwitchProviderSameTimeParamsFromPrompt(
        { serviceId: 'svc-1' },
        'Keep 3pm but different stylist',
      ),
    ).toMatchObject({
      serviceId: 'svc-1',
      mode: 'keep_time_any_provider',
      timeSlot: '15:00',
    });
  });

  it('detects intent helpers', () => {
    expect(
      detectSwitchProviderSameTimeAction('Keep 3pm but different stylist'),
    ).toBe('switch_provider_same_time');
    expect(isSwitchProviderSameTimeIntent('switch_provider_same_time')).toBe(
      true,
    );
    expect(isSwitchProviderSameTimeIntent('book_appointment')).toBe(false);
    expect(
      detectSwitchProviderSameTimeAction('Book with Anna for color'),
    ).toBeNull();
  });
});

describe('ai-switch-provider-same-time.logic (ai-cmd-customer-4.11.4)', () => {
  const startTime = '2026-07-01T15:00:00.000Z';
  const timeSlot = formatTimeDisplay(startTime);

  const employeeRepo = {
    find: jest.fn(async () => [
      { id: 'emp-marco', name: 'Marco', businessId: 'biz-1', isActive: true },
      { id: 'emp-anna', name: 'Anna', businessId: 'biz-1', isActive: true },
      { id: 'emp-maria', name: 'Maria', businessId: 'biz-1', isActive: true },
    ]),
  };
  const serviceRepo = {
    findOne: jest.fn(async () => ({
      id: 'svc-haircut',
      name: 'Haircut',
      businessId: 'biz-1',
      isActive: true,
    })),
  };
  const publicBookingService = {
    getServiceDaySlots: jest.fn(async () => ({
      date: '2026-07-01',
      serviceId: 'svc-haircut',
      serviceName: 'Haircut',
      slots: [
        {
          startTime,
          endTime: '2026-07-01T16:00:00.000Z',
          employeeId: 'emp-marco',
          employeeName: 'Marco',
        },
        {
          startTime,
          endTime: '2026-07-01T16:00:00.000Z',
          employeeId: 'emp-anna',
          employeeName: 'Anna',
        },
      ],
    })),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'salon' })),
  };
  const switchDeps = () => ({
    employeeRepo,
    serviceRepo,
    publicBookingService,
    businessRepo,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('switches to another provider at the same time', async () => {
    const result = await handleSwitchProviderSameTimeLogic(
      switchDeps(),
      'biz-1',
      {
        slug: 'salon',
        serviceId: 'svc-haircut',
        date: '2026-07-01',
        employeeId: 'emp-marco',
        timeSlot,
      },
      'Keep 3pm but different stylist',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('switch_provider_same_time');
    expect(result.details?.employeeId).toBe('emp-anna');
    expect(result.details?.navigate).toEqual({
      path: 'checkout',
      query: {
        serviceId: 'svc-haircut',
        employeeId: 'emp-anna',
        startTime,
      },
    });
  });

  it('switches to a named provider at the same time', async () => {
    const result = await handleSwitchProviderSameTimeLogic(
      switchDeps(),
      'biz-1',
      {
        slug: 'salon',
        serviceId: 'svc-haircut',
        date: '2026-07-01',
        employeeId: 'emp-marco',
      },
      'Keep 3pm but switch to Anna',
    );

    expect(result.success).toBe(true);
    expect(result.details?.employeeName).toBe('Anna');
  });

  it('clarifies when service is missing', async () => {
    const result = await handleSwitchProviderSameTimeLogic(
      switchDeps(),
      'biz-1',
      { slug: 'salon', date: '2026-07-01', timeSlot },
      'Keep 3pm but different stylist',
    );

    expect(result.success).toBe(false);
    expect(result.details?.missing).toContain('serviceId');
  });

  it('reports no alternate provider at the slot', async () => {
    publicBookingService.getServiceDaySlots.mockResolvedValueOnce({
      date: '2026-07-01',
      serviceId: 'svc-haircut',
      serviceName: 'Haircut',
      slots: [
        {
          startTime,
          endTime: '2026-07-01T16:00:00.000Z',
          employeeId: 'emp-marco',
          employeeName: 'Marco',
        },
      ],
    });

    const result = await handleSwitchProviderSameTimeLogic(
      switchDeps(),
      'biz-1',
      {
        slug: 'salon',
        serviceId: 'svc-haircut',
        date: '2026-07-01',
        employeeId: 'emp-marco',
        timeSlot,
      },
      'Keep 3pm but different stylist',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('No other stylist');
  });

  it('reports when named provider has no slot at the kept time', async () => {
    publicBookingService.getServiceDaySlots.mockResolvedValueOnce({
      date: '2026-07-01',
      serviceId: 'svc-haircut',
      serviceName: 'Haircut',
      slots: [
        {
          startTime: '2026-07-01T11:00:00.000Z',
          endTime: '2026-07-01T12:00:00.000Z',
          employeeId: 'emp-maria',
          employeeName: 'Maria',
        },
      ],
    });

    const result = await handleSwitchProviderSameTimeLogic(
      switchDeps(),
      'biz-1',
      {
        slug: 'salon',
        serviceId: 'svc-haircut',
        date: '2026-07-01',
        employeeId: 'emp-marco',
        timeSlot,
      },
      'Keep 3pm but switch to Anna',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Anna is not available');
  });

  it('derives time slot from session startTime', async () => {
    const result = await handleSwitchProviderSameTimeLogic(
      switchDeps(),
      'biz-1',
      {
        slug: 'salon',
        serviceId: 'svc-haircut',
        date: '2026-07-01',
        employeeId: 'emp-marco',
        startTime,
      },
      'Same time but a different provider',
    );

    expect(result.success).toBe(true);
    expect(result.details?.timeSlot).toBe(timeSlot);
  });
});
