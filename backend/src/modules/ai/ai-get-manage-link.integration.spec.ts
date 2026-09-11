import { validateCommand } from './command-completion.validator.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import { handleGetManageLinkLogic } from './ai-get-manage-link.logic.js';
import {
  GET_MANAGE_LINK_PROMPTS,
  GET_MANAGE_LINK_RESCUE_SCENARIOS,
} from './ai-get-manage-link.fixtures.js';
import { rescueGetManageLinkIntent } from './ai-get-manage-link.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_GET_MANAGE_LINK_CASES } from './eval/ai-command-eval.cases.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai-get-manage-link integration (ai-cmd-customer-4.4.5)', () => {
  const guestBooking = {
    id: 'book-guest-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    status: BookingStatus.CONFIRMED,
    startTime: new Date('2030-01-15T14:00:00.000Z'),
    metadata: {},
    customer: { email: 'john@example.com', phone: '5551234567' },
    service: { name: 'Massage' },
  };

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () =>
        makeBusiness({ id: 'biz-1', slug: 'glow-salon' }),
      ),
    },
    bookingRepo: {
      find: jest.fn(async () => [guestBooking]),
      findOne: jest.fn(async () => guestBooking),
      save: jest.fn(async (booking: typeof guestBooking) => booking),
      // `manager.transaction` — the manifest's `mock_missing_transaction` class.
      // The manage-link path mints a token via `ensureBookingManageToken`,
      // which opens a transaction and locks the row inside it; with no
      // `manager` every case died before reaching the behaviour under test.
      // The locked read serves the same booking this mock already returns.
      manager: {
        transaction: async (cb: (m: any) => Promise<unknown>) =>
          cb({
            createQueryBuilder: () => ({
              setLock: () => ({
                where: () => ({ getOne: async () => guestBooking }),
              }),
            }),
            save: async (_entity: unknown, row: any) => row,
          }),
      },
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

  it.each(GET_MANAGE_LINK_PROMPTS)(
    'validates and executes signed-in $id',
    async ({ prompt }) => {
      const validation = validateCommand(
        makeResolvedCommand({
          action: 'get_manage_link',
          params: {},
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleGetManageLinkLogic(
        deps() as any,
        'biz-1',
        { bookingId: 'book-guest-1', sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('get_manage_link');
    },
  );

  it.each(GET_MANAGE_LINK_RESCUE_SCENARIOS)(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueGetManageLinkIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_GET_MANAGE_LINK_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
