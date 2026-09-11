import {
  handleGetMyLocaleLogic,
  handleUpdateMyLocaleLogic,
} from './ai-my-locale.logic.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import type { CustomerCrmLogicDeps } from './ai-customer-crm.logic.js';

function buildDeps(
  overrides: Partial<CustomerCrmLogicDeps> = {},
): CustomerCrmLogicDeps {
  return {
    publicCustomerAuthService: {
      getPreferredLocale: jest.fn(async () => ({
        preferredLocale: 'en',
        storedLocale: null,
      })),
      updatePreferredLocale: jest.fn(async () => ({
        preferredLocale: 'hy',
        storedLocale: 'hy',
      })),
    } as any,
    businessRepo: {
      findOne: jest.fn(async () =>
        makeBusiness({ id: 'biz-1', slug: 'salon' }),
      ),
    } as any,
    ...overrides,
  } as CustomerCrmLogicDeps;
}

describe('ai-my-locale.logic', () => {
  let deps: CustomerCrmLogicDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  describe('handleGetMyLocaleLogic', () => {
    it('reads the current preferred locale', async () => {
      const result = await handleGetMyLocaleLogic(deps, 'biz-1', {
        sessionCustomerId: 'cust-1',
        slug: 'salon',
      });
      expect(result.success).toBe(true);
      expect(result.action).toBe('get_my_locale');
      expect(result.details?.preferredLocale).toBe('en');
      expect(
        deps.publicCustomerAuthService.getPreferredLocale,
      ).toHaveBeenCalledWith('salon', 'cust-1');
    });

    it('requires sign-in', async () => {
      const result = await handleGetMyLocaleLogic(deps, 'biz-1', {
        slug: 'salon',
      });
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('fails when business slug cannot be resolved', async () => {
      const result = await handleGetMyLocaleLogic(
        buildDeps({
          businessRepo: { findOne: jest.fn(async () => null) } as any,
        }),
        'biz-1',
        { sessionCustomerId: 'cust-1' },
      );
      expect(result.success).toBe(false);
      expect(result.summary).toContain('Business not found');
    });

    it('resolves slug from businessId when params.slug is omitted (e2e-bug.82)', async () => {
      const result = await handleGetMyLocaleLogic(deps, 'biz-1', {
        sessionCustomerId: 'cust-1',
      });
      expect(result.success).toBe(true);
      expect(
        deps.publicCustomerAuthService.getPreferredLocale,
      ).toHaveBeenCalledWith('salon', 'cust-1');
    });

    it('fails gracefully on service error', async () => {
      (
        deps.publicCustomerAuthService.getPreferredLocale as jest.Mock
      ).mockRejectedValueOnce(new Error('Business not found'));
      const result = await handleGetMyLocaleLogic(deps, 'biz-1', {
        sessionCustomerId: 'cust-1',
        slug: 'salon',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handleUpdateMyLocaleLogic', () => {
    it('updates the locale using preferredLocale param', async () => {
      const result = await handleUpdateMyLocaleLogic(deps, 'biz-1', {
        sessionCustomerId: 'cust-1',
        slug: 'salon',
        preferredLocale: 'hy',
      });
      expect(result.success).toBe(true);
      expect(result.details?.preferredLocale).toBe('hy');
      expect(
        deps.publicCustomerAuthService.updatePreferredLocale,
      ).toHaveBeenCalledWith('salon', 'cust-1', 'hy');
    });

    it('parses a free-text language name from the prompt', async () => {
      const result = await handleUpdateMyLocaleLogic(
        deps,
        'biz-1',
        { sessionCustomerId: 'cust-1', slug: 'salon' },
        'Switch my language to Armenian',
      );
      expect(result.success).toBe(true);
      expect(
        deps.publicCustomerAuthService.updatePreferredLocale,
      ).toHaveBeenCalledWith('salon', 'cust-1', 'hy');
    });

    it('requires sign-in', async () => {
      const result = await handleUpdateMyLocaleLogic(deps, 'biz-1', {
        slug: 'salon',
        preferredLocale: 'hy',
      });
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('clarifies when no locale is given or recognized', async () => {
      const result = await handleUpdateMyLocaleLogic(deps, 'biz-1', {
        sessionCustomerId: 'cust-1',
        slug: 'salon',
      });
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('fails gracefully when the service rejects a disabled locale', async () => {
      (
        deps.publicCustomerAuthService.updatePreferredLocale as jest.Mock
      ).mockRejectedValueOnce(
        new Error('preferredLocale must be one of the enabled languages'),
      );
      const result = await handleUpdateMyLocaleLogic(deps, 'biz-1', {
        sessionCustomerId: 'cust-1',
        slug: 'salon',
        preferredLocale: 'ru',
      });
      expect(result.success).toBe(false);
    });
  });
});
