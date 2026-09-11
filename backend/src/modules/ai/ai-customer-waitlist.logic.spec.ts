import { buildCustomerWaitlistRequest } from '../../common/utils/customer-waitlist.util.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import {
  handleCheckWaitlistStatusLogic,
  handleJoinWaitlistLogic,
} from './ai-customer-waitlist.logic.js';

describe('ai-customer-waitlist.logic (ai-cmd-customer-4.4.7)', () => {
  const request = buildCustomerWaitlistRequest({
    serviceName: 'Massage',
    date: '2030-06-01',
  });

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () =>
        makeBusiness({ id: 'biz-1', slug: 'glow-salon' }),
      ),
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

  it('requires sign-in to join waitlist', async () => {
    const result = await handleJoinWaitlistLogic(
      deps() as any,
      'biz-1',
      {},
      'Notify me if something opens Friday',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/sign in/i);
  });

  it('joins waitlist for signed-in customer', async () => {
    const localDeps = deps();
    const result = await handleJoinWaitlistLogic(
      localDeps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Join the waitlist for massage',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('join_waitlist');
    expect(
      localDeps.publicCustomerWaitlistService.joinWaitlist,
    ).toHaveBeenCalled();
  });

  it('checks waitlist status for signed-in customer', async () => {
    const localDeps = deps();
    const result = await handleCheckWaitlistStatusLogic(
      localDeps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Am I on the waitlist?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('check_waitlist_status');
    expect(
      localDeps.publicCustomerWaitlistService.getWaitlistStatus,
    ).toHaveBeenCalled();
  });

  it('handles join failures', async () => {
    const localDeps = deps();
    localDeps.publicCustomerWaitlistService.joinWaitlist = jest.fn(async () => {
      throw new Error('Service unavailable');
    });
    const result = await handleJoinWaitlistLogic(
      localDeps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Join the waitlist for massage',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/Service unavailable/);
  });
});

/**
 * e2e-bug.489 — a near-miss service name now links to the real service.
 *
 * `resolveServiceIdByName` only ever did `LOWER(name) = :name`, so "haircut"
 * against a catalog entry "Haircut - Men's" linked nothing and the row was
 * stored with a free-text `serviceName` and no `serviceId`. That is a supported
 * outcome — the waitlist accepts free-text names by design — so this was never
 * a correctness bug, only fewer rows linked than could be.
 *
 * The fallback is **strictly additive**: the exact match still wins and runs
 * first, so this can only turn a previously-unlinked row into a linked one.
 * That constraint is what makes widening a matcher safe here; widening one
 * without it is how e2e-bug.362 happened.
 */
describe('e2e-bug.489 — waitlist service linking falls back to the shared matcher', () => {
  const CATALOG = [
    { id: 'svc-1', name: "Haircut - Men's" },
    { id: 'svc-2', name: 'Deep Tissue Massage' },
  ];

  const depsWith = (exact: any, catalog = CATALOG) => ({
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'glow-salon' })),
    },
    serviceRepo: {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn(async () => exact),
      })),
      find: jest.fn(async () => catalog),
    },
    publicCustomerWaitlistService: {
      joinWaitlist: jest.fn(async () => ({ onWaitlist: true, request: {} })),
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

  const join = async (d: any, serviceName: string) => {
    await handleJoinWaitlistLogic(
      d as any,
      'biz-1',
      { sessionCustomerId: 'cust-1', serviceName },
      `Notify me if a ${serviceName} opens Friday`,
    );
    return (
      d.publicCustomerWaitlistService.joinWaitlist.mock.calls[0]?.[2] ?? {}
    );
  };

  it('links a near-miss name that exact matching missed', async () => {
    const d = depsWith(null);
    const dto = await join(d, 'haircut');
    expect(dto.serviceId).toBe('svc-1');
  });

  it('does not run the fallback when the exact match hits', async () => {
    // The fast path is unchanged, and the extra catalog read must not happen.
    const d = depsWith({ id: 'svc-9', name: 'Massage' });
    const dto = await join(d, 'Massage');
    expect(dto.serviceId).toBe('svc-9');
    expect(d.serviceRepo.find).not.toHaveBeenCalled();
  });

  it('leaves the row free-text when the name is ambiguous', async () => {
    // Two equally good matches: linking an arbitrary one is worse than the
    // unlinked row, which is a supported outcome.
    const d = depsWith(null, [
      { id: 'svc-1', name: 'Deep Tissue Massage' },
      { id: 'svc-2', name: 'Deep Tissue Facial' },
    ]);
    const dto = await join(d, 'Deep Tissue');
    expect(dto.serviceId).toBeUndefined();
    // Only `serviceId` is asserted. Whether a free-text `serviceName` is
    // carried is decided by the prompt parser (`parsed.serviceName`), not by
    // this resolver — a separate concern, and asserting it here would pin
    // parser behaviour this change does not touch.
  });

  it('leaves the row free-text when nothing matches at all', async () => {
    const d = depsWith(null);
    const dto = await join(d, 'Hot Air Balloon Ride');
    expect(dto.serviceId).toBeUndefined();
  });
});
