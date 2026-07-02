import { buildCustomerWaitlistRequest } from '../../common/utils/customer-waitlist.util.js';
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
