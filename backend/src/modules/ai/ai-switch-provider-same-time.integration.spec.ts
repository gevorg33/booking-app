import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import {
  SWITCH_PROVIDER_SAME_TIME_PROMPTS,
  SWITCH_PROVIDER_SAME_TIME_RESCUE_SCENARIOS,
} from './ai-switch-provider-same-time.fixtures.js';
import { SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_SCENARIOS } from './ai-switch-provider-same-time-multilingual.fixtures.js';
import { handleSwitchProviderSameTimeLogic } from './ai-switch-provider-same-time.logic.js';
import { rescueSwitchProviderSameTimeIntent } from './ai-switch-provider-same-time.util.js';
import { formatTimeDisplay } from '../../common/utils/date-format.util.js';

describe('ai switch provider same time integration (ai-cmd-customer-4.11.4)', () => {
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
        {
          startTime,
          endTime: '2026-07-01T16:00:00.000Z',
          employeeId: 'emp-maria',
          employeeName: 'Maria',
        },
      ],
    })),
  };

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
  });

  it.each([
    ...SWITCH_PROVIDER_SAME_TIME_PROMPTS,
    ...SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_SCENARIOS,
  ])('rescues and executes switch provider same time $id', async (row) => {
    const rescued = rescue.rescue({
      prompt: row.prompt,
      action: 'unknown',
      params: {},
    });
    expect(rescued?.action).toBe('switch_provider_same_time');

    const directRescue = rescueSwitchProviderSameTimeIntent(
      row.prompt,
      'unknown',
    );
    expect(directRescue?.action).toBe('switch_provider_same_time');

    const validation = validateCommand({
      action: 'switch_provider_same_time',
      params: {
        mode: row.mode,
        ...(row.providerName ? { providerName: row.providerName } : {}),
        ...(row.timeSlot ? { timeSlot: row.timeSlot } : {}),
      },
      enrichedParams: {},
      entities: {},
      reasoning: 'test',
      confidence: 0.9,
      prompt: row.prompt,
    });
    expect(validation.issues).toEqual([]);

    const result = await handleSwitchProviderSameTimeLogic(
      { employeeRepo, serviceRepo, publicBookingService },
      'biz-1',
      {
        slug: 'salon',
        serviceId: 'svc-haircut',
        date: '2026-07-01',
        employeeId: 'emp-marco',
        timeSlot: row.timeSlot ?? timeSlot,
      },
      row.prompt,
    );
    expect(result.action).toBe('switch_provider_same_time');
    if (row.mode === 'keep_time_named_provider' && row.providerName) {
      expect(result.details?.employeeName).toBe(row.providerName);
    } else {
      expect(result.success).toBe(true);
      expect(result.details?.navigate).toBeDefined();
    }
  });

  it.each(SWITCH_PROVIDER_SAME_TIME_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id via direct rescue',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueSwitchProviderSameTimeIntent(prompt, misclassifiedAction)?.action,
      ).toBe('switch_provider_same_time');
    },
  );
});
