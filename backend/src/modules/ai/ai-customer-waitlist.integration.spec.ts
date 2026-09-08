import { validateCommand } from './command-completion.validator.js';
import {
  CHECK_WAITLIST_STATUS_PROMPTS,
  CUSTOMER_WAITLIST_RESCUE_SCENARIOS,
  JOIN_WAITLIST_PROMPTS,
} from './ai-customer-waitlist.fixtures.js';
import {
  handleCheckWaitlistStatusLogic,
  handleJoinWaitlistLogic,
} from './ai-customer-waitlist.logic.js';
import { rescueCustomerWaitlistIntent } from './ai-customer-waitlist.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_CUSTOMER_WAITLIST_CASES } from './eval/ai-command-eval.cases.js';
import { buildCustomerWaitlistRequest } from '../../common/utils/customer-waitlist.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai-customer-waitlist integration (ai-cmd-customer-4.4.7)', () => {
  const request = buildCustomerWaitlistRequest({
    serviceName: 'Massage',
    date: '2030-06-01',
  });

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'glow-salon' })),
    },
    serviceRepo: {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn(async () => ({ id: 'svc-1', name: 'Massage' })),
      })),
    },
    publicCustomerWaitlistService: {
      joinWaitlist: jest.fn(async () => ({
        onWaitlist: true,
        request,
      })),
      getWaitlistStatus: jest.fn(async () => ({
        onWaitlist: true,
        request,
      })),
    },
    publicBookingService: {},
    publicCustomerBookingService: {},
    publicCustomerAuthService: {},
    packagesService: {},
    subscriptionsService: {},
    multiServiceBookingsService: {},
    bookingRepo: {},
    configService: {},
  });

  it.each(JOIN_WAITLIST_PROMPTS)(
    'validates and executes join waitlist $id',
    async ({ prompt, serviceName }) => {
      const validation = validateCommand(makeResolvedCommand({
        action: 'join_waitlist',
        params: {},
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const localDeps = deps();
      const result = await handleJoinWaitlistLogic(
        localDeps as any,
        'biz-1',
        {
          sessionCustomerId: 'cust-1',
          ...(serviceName ? { serviceName } : {}),
        },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('join_waitlist');
    },
  );

  it.each(CHECK_WAITLIST_STATUS_PROMPTS)(
    'validates and executes check waitlist status $id',
    async ({ prompt }) => {
      const validation = validateCommand(makeResolvedCommand({
        action: 'check_waitlist_status',
        params: {},
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const localDeps = deps();
      const result = await handleCheckWaitlistStatusLogic(
        localDeps as any,
        'biz-1',
        { sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('check_waitlist_status');
    },
  );

  it.each(CUSTOMER_WAITLIST_RESCUE_SCENARIOS)(
    'rescues misclassified waitlist intent $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueCustomerWaitlistIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_CUSTOMER_WAITLIST_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
