import { validateCommand } from './command-completion.validator.js';
import { handleRecoverLostManageLinkLogic } from './ai-recover-lost-manage-link.logic.js';
import {
  RECOVER_LOST_MANAGE_LINK_PROMPTS,
  RECOVER_LOST_MANAGE_LINK_RESCUE_SCENARIOS,
} from './ai-recover-lost-manage-link.fixtures.js';
import { rescueRecoverLostManageLinkIntent } from './ai-recover-lost-manage-link.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_RECOVER_LOST_MANAGE_LINK_CASES } from './eval/ai-command-eval.cases.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('ai-recover-lost-manage-link integration (ai-cmd-customer-4.17.3)', () => {
  const guestBooking = {
    id: 'book-guest-1',
    businessId: 'biz-1',
    status: BookingStatus.CONFIRMED,
    startTime: new Date('2030-01-15T14:00:00.000Z'),
    metadata: {},
    customer: { email: 'john@example.com', phone: '5551234567' },
    service: { name: 'Massage' },
  };

  const guestBookings = [
    guestBooking,
    {
      ...guestBooking,
      id: 'book-guest-2',
      customer: { email: 'sarah@test.com', phone: null },
    },
    {
      ...guestBooking,
      id: 'book-guest-3',
      customer: { email: 'mia@salon.com', phone: null },
    },
    {
      ...guestBooking,
      id: 'book-guest-4',
      customer: { email: null, phone: '5559876543' },
    },
  ];

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'glow-salon' })),
    },
    bookingRepo: {
      find: jest.fn(async () => guestBookings),
      findOne: jest.fn(async () => guestBooking),
      save: jest.fn(async (booking: typeof guestBooking) => booking),
    },
    configService: { get: jest.fn(() => 'http://localhost:3000') },
    notificationsService: {
      sendBookingConfirmation: jest.fn(async () => undefined),
    },
    publicBookingService: {},
    publicCustomerBookingService: {},
    publicCustomerAuthService: {},
    packagesService: {},
    subscriptionsService: {},
    multiServiceBookingsService: {},
    serviceRepo: {},
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(
    RECOVER_LOST_MANAGE_LINK_PROMPTS.filter((row) => row.email || row.phone),
  )('validates and executes guest $id', async ({ prompt }) => {
    const validation = validateCommand({
      action: 'recover_lost_manage_link',
      params: {},
      enrichedParams: {},
      entities: {},
      reasoning: 'test',
      confidence: 0.9,
      prompt,
    });
    expect(validation.issues).toEqual([]);

    const result = await handleRecoverLostManageLinkLogic(
      deps() as any,
      'biz-1',
      {},
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('recover_lost_manage_link');
  });

  it.each(RECOVER_LOST_MANAGE_LINK_RESCUE_SCENARIOS)(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueRecoverLostManageLinkIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('pipeline rescues recover_lost_manage_link for guest resend', () => {
    const rescued = rescue.rescue({
      prompt: 'Resend manage link to john@example.com',
      action: 'unknown',
      params: {},
      surface: 'customer',
    });
    expect(rescued?.action).toBe('recover_lost_manage_link');
  });

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_RECOVER_LOST_MANAGE_LINK_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
