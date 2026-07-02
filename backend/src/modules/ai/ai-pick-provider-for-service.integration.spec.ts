import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import {
  PICK_PROVIDER_FOR_SERVICE_PROMPTS,
  PICK_PROVIDER_FOR_SERVICE_RESCUE_SCENARIOS,
} from './ai-pick-provider-for-service.fixtures.js';
import { PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_SCENARIOS } from './ai-pick-provider-for-service-multilingual.fixtures.js';
import { handlePickProviderForServiceLogic } from './ai-pick-provider-for-service.logic.js';
import { rescuePickProviderForServiceIntent } from './ai-pick-provider-for-service.util.js';

describe('ai pick provider for service integration (ai-cmd-customer-4.11.2)', () => {
  const employeeRepo = {
    find: jest.fn(async () => [
      { id: 'emp-anna', name: 'Anna', businessId: 'biz-1', isActive: true },
      { id: 'emp-maria', name: 'Maria', businessId: 'biz-1', isActive: true },
      { id: 'emp-james', name: 'James', businessId: 'biz-1', isActive: true },
      { id: 'emp-sophie', name: 'Sophie', businessId: 'biz-1', isActive: true },
      { id: 'emp-alex', name: 'Alex', businessId: 'biz-1', isActive: true },
      { id: 'emp-emma', name: 'Emma', businessId: 'biz-1', isActive: true },
    ]),
  };
  const serviceRepo = {
    find: jest.fn(async () => [
      { id: 'svc-color', name: 'Color', businessId: 'biz-1', isActive: true },
      {
        id: 'svc-highlights',
        name: 'Highlights',
        businessId: 'biz-1',
        isActive: true,
      },
      {
        id: 'svc-haircut',
        name: 'Haircut',
        businessId: 'biz-1',
        isActive: true,
      },
      {
        id: 'svc-balayage',
        name: 'Balayage',
        businessId: 'biz-1',
        isActive: true,
      },
    ]),
  };
  const publicCustomerAuthService = {
    listBookings: jest.fn(async () => ({
      bookings: [
        {
          id: 'book-1',
          status: 'completed',
          startTime: '2026-06-01T10:00:00.000Z',
          employeeId: 'emp-anna',
          employeeName: 'Anna',
          serviceId: 'svc-color',
          serviceName: 'Color',
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
    ...PICK_PROVIDER_FOR_SERVICE_PROMPTS,
    ...PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_SCENARIOS,
  ])('rescues and executes pick provider for service $id', async (row) => {
    const rescued = rescue.rescue({
      prompt: row.prompt,
      action: 'unknown',
      params: {},
    });
    expect(rescued?.action).toBe('pick_provider_for_service');

    const directRescue = rescuePickProviderForServiceIntent(
      row.prompt,
      'unknown',
    );
    expect(directRescue?.action).toBe('pick_provider_for_service');

    const validation = validateCommand({
      action: 'pick_provider_for_service',
      params: {
        mode: row.mode,
        ...(row.providerName ? { providerName: row.providerName } : {}),
        ...(row.serviceName ? { serviceName: row.serviceName } : {}),
      },
      enrichedParams: {},
      entities: {},
      reasoning: 'test',
      confidence: 0.9,
      prompt: row.prompt,
    });
    expect(validation.issues).toEqual([]);

    const result = await handlePickProviderForServiceLogic(
      { employeeRepo, serviceRepo, publicCustomerAuthService },
      'biz-1',
      row.mode === 'same_as_last'
        ? { sessionCustomerId: 'cust-1', slug: 'salon' }
        : {},
      row.prompt,
    );
    expect(result.action).toBe('pick_provider_for_service');
    if (row.mode === 'named_provider') {
      expect(result.success).toBe(true);
      expect(result.details?.navigate).toBeDefined();
    }
  });

  it.each(PICK_PROVIDER_FOR_SERVICE_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id via direct rescue',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescuePickProviderForServiceIntent(prompt, misclassifiedAction)?.action,
      ).toBe('pick_provider_for_service');
    },
  );
});
