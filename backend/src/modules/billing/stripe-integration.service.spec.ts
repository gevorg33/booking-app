import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StripeIntegrationService } from './stripe-integration.service.js';
import type { StripeService } from './stripe.service.js';
import type { Business } from '../business/entities/business.entity.js';

describe('StripeIntegrationService', () => {
  const business: Business = {
    id: 'biz-1',
    slug: 'salon',
    name: 'Salon',
    email: 'owner@salon.test',
    timezone: 'Asia/Yerevan',
    settings: {},
  } as Business;

  let businessRepo: { findOne: jest.Mock; save: jest.Mock };
  let stripeService: {
    isConfigured: boolean;
    frontendUrl: string;
    connectDefaultCountry: string;
    connectClientId?: string;
    connectOAuthRedirectUri: string;
    isOAuthConfigured: jest.Mock;
    usesDestinationCharges: jest.Mock;
    client: {
      oauth: { token: jest.Mock };
      accounts: {
        create: jest.Mock;
        retrieve: jest.Mock;
        createLoginLink: jest.Mock;
      };
      accountLinks: { create: jest.Mock };
    };
  };
  let service: StripeIntegrationService;

  beforeEach(() => {
    business.settings = {};
    businessRepo = {
      findOne: jest.fn().mockResolvedValue(business),
      save: jest.fn().mockImplementation(async (b: Business) => b),
    };
    stripeService = {
      isConfigured: true,
      frontendUrl: 'http://localhost:3000',
      connectDefaultCountry: 'AE',
      connectClientId: 'ca_test',
      connectOAuthRedirectUri:
        'http://localhost:3000/dashboard/billing?stripe_connect=oauth',
      isOAuthConfigured: jest.fn().mockReturnValue(true),
      usesDestinationCharges: jest.fn().mockReturnValue(false),
      client: {
        oauth: {
          token: jest.fn().mockResolvedValue({ stripe_user_id: 'acct_oauth' }),
        },
        accounts: {
          create: jest.fn().mockResolvedValue({ id: 'acct_new' }),
          retrieve: jest.fn().mockResolvedValue({
            id: 'acct_oauth',
            type: 'standard',
            country: 'AM',
            charges_enabled: true,
            details_submitted: true,
            business_profile: { name: 'Salon Stripe' },
            capabilities: { transfers: 'active' },
          }),
          createLoginLink: jest
            .fn()
            .mockResolvedValue({ url: 'https://stripe.test/login' }),
        },
        accountLinks: {
          create: jest
            .fn()
            .mockResolvedValue({ url: 'https://stripe.test/onboard' }),
        },
      },
    };
    const planEntitlements = {
      assertFeature: jest.fn().mockResolvedValue(undefined),
    };
    service = new StripeIntegrationService(
      businessRepo as never,
      stripeService as unknown as StripeService,
      planEntitlements as never,
    );
  });

  // ─── isConnectReady / resolveConnectAccountId ───────────────────────────────

  describe('isConnectReady', () => {
    it('returns true when settings contain a connectAccountId', () => {
      expect(
        service.isConnectReady({
          integrations: { stripe: { connectAccountId: 'acct_1' } },
        }),
      ).toBe(true);
    });

    it('returns false when settings are empty', () => {
      expect(service.isConnectReady({})).toBe(false);
    });

    // e2e-bug.10 — Connect gating edge cases (fixture-driven)
    it.each([
      {
        id: 'ready-with-account-id',
        settings: {
          integrations: { stripe: { connectAccountId: 'acct_1Tmz2M81m04mcCIP' } },
        },
        expected: true,
      },
      {
        id: 'whitespace-account-id-treated-as-missing',
        settings: { integrations: { stripe: { connectAccountId: '   ' } } },
        expected: false,
      },
      {
        id: 'missing-integrations-object',
        settings: { integrations: {} },
        expected: false,
      },
    ])('e2e-bug.10 $id → $expected', ({ settings, expected }) => {
      expect(service.isConnectReady(settings)).toBe(expected);
    });
  });

  describe('resolveConnectAccountId', () => {
    it('extracts account id from nested settings', () => {
      expect(
        service.resolveConnectAccountId({
          integrations: { stripe: { connectAccountId: 'acct_abc' } },
        }),
      ).toBe('acct_abc');
    });

    it('returns null when no account is configured', () => {
      expect(service.resolveConnectAccountId({})).toBeNull();
    });
  });

  // ─── createConnectOAuthLink ──────────────────────────────────────────────────

  describe('createConnectOAuthLink', () => {
    it('builds Stripe OAuth authorize URL with client_id and state', async () => {
      const result = await service.createConnectOAuthLink('biz-1');
      expect(result.url).toContain(
        'https://connect.stripe.com/oauth/authorize',
      );
      expect(result.url).toContain('client_id=ca_test');
      expect(result.url).toContain('state=biz-1');
      expect(result.url).toContain('scope=read_write');
    });

    it('throws BadRequestException when OAuth client id is not configured', async () => {
      stripeService.connectClientId = undefined;
      service = new StripeIntegrationService(
        businessRepo as never,
        stripeService as unknown as StripeService,
      
    undefined as never);
      await expect(
        service.createConnectOAuthLink('biz-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when business is missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createConnectOAuthLink('missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ─── completeConnectOAuth ────────────────────────────────────────────────────

  describe('completeConnectOAuth', () => {
    it('always stores direct charge model for OAuth (Standard) accounts regardless of country', async () => {
      // Tenant is in AM (different from AE platform) — still must be direct
      stripeService.client.accounts.retrieve.mockResolvedValue({
        id: 'acct_oauth',
        type: 'standard',
        country: 'AM',
        charges_enabled: true,
        details_submitted: true,
      });

      await service.completeConnectOAuth('biz-1', 'ac_test_code');

      const saved = businessRepo.save.mock.calls.at(-1)?.[0] as Business;
      const stripeIntegration = (
        saved.settings?.integrations as Record<string, unknown>
      )?.stripe as { connectChargeModel?: string };
      expect(stripeIntegration.connectChargeModel).toBe('direct');
    });

    it('exchanges OAuth code and saves tenant account with direct charges when same country', async () => {
      stripeService.client.accounts.retrieve.mockResolvedValue({
        id: 'acct_oauth',
        type: 'standard',
        country: 'AE',
        charges_enabled: true,
        details_submitted: true,
        business_profile: { name: 'Salon Stripe' },
        capabilities: { transfers: 'active' },
      });
      const view = await service.completeConnectOAuth('biz-1', 'ac_test_code');
      expect(stripeService.client.oauth.token).toHaveBeenCalled();
      expect(view.connectAccountId).toBe('acct_oauth');
      expect(view.connectCountry).toBe('AE');
      expect(view.connectMode).toBe('oauth');
      expect(view.connectChargeModel).toBe('direct');
    });

    it('throws when stripe is not configured', async () => {
      stripeService.isConfigured = false;
      await expect(
        service.completeConnectOAuth('biz-1', 'code'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when OAuth client id is not configured', async () => {
      stripeService.connectClientId = undefined;
      service = new StripeIntegrationService(
        businessRepo as never,
        stripeService as unknown as StripeService,
      
    undefined as never);
      await expect(
        service.completeConnectOAuth('biz-1', 'code'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when business is missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.completeConnectOAuth('missing', 'code'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when Stripe oauth.token fails', async () => {
      stripeService.client.oauth.token.mockRejectedValue(
        new Error('invalid_grant'),
      );
      await expect(
        service.completeConnectOAuth('biz-1', 'bad_code'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when Stripe does not return a user id', async () => {
      stripeService.client.oauth.token.mockResolvedValue({
        stripe_user_id: null,
      });
      await expect(
        service.completeConnectOAuth('biz-1', 'code'),
      ).rejects.toThrow('did not return a connected account ID');
    });
  });

  // ─── startConnect ────────────────────────────────────────────────────────────

  describe('startConnect', () => {
    it('defaults to OAuth when configured', async () => {
      const result = await service.startConnect('biz-1');
      expect(result.url).toContain('oauth/authorize');
    });

    it('falls back to standard account onboarding when OAuth is not configured', async () => {
      stripeService.isOAuthConfigured.mockReturnValue(false);
      const result = await service.startConnect('biz-1');
      expect(result.url).toBe('https://stripe.test/onboard');
      expect(stripeService.client.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'standard' }),
      );
    });

    it('respects explicit express mode override', async () => {
      const result = await service.startConnect('biz-1', {
        mode: 'express',
        country: 'AM',
      });
      expect(result.url).toBe('https://stripe.test/onboard');
    });
  });

  // ─── createConnectOnboardingLink ─────────────────────────────────────────────

  describe('createConnectOnboardingLink', () => {
    it('creates standard account in tenant country', async () => {
      const result = await service.createConnectOnboardingLink('biz-1', 'AM');
      expect(stripeService.client.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'standard',
          country: 'AM',
        }),
      );
      expect(result.url).toBe('https://stripe.test/onboard');
    });

    it('reuses existing connect account id instead of creating a new one', async () => {
      business.settings = {
        integrations: { stripe: { connectAccountId: 'acct_existing' } },
      };
      await service.createConnectOnboardingLink('biz-1');
      expect(stripeService.client.accounts.create).not.toHaveBeenCalled();
      expect(stripeService.client.accountLinks.create).toHaveBeenCalledWith(
        expect.objectContaining({ account: 'acct_existing' }),
      );
    });

    it('throws BadRequestException when stripe not configured', async () => {
      stripeService.isConfigured = false;
      await expect(
        service.createConnectOnboardingLink('biz-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when business is missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createConnectOnboardingLink('biz-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws user-friendly error when Stripe blocks cross-region Express account creation', async () => {
      stripeService.client.accounts.create.mockRejectedValue(
        new Error('cannot be created by platforms in AE'),
      );
      await expect(
        service.createConnectOnboardingLink('biz-1', 'US'),
      ).rejects.toThrow('Stripe does not allow creating');
    });

    it('throws user-friendly error when card_payments capability is unsupported', async () => {
      stripeService.client.accounts.create.mockRejectedValue(
        new Error('card_payments capability is not supported'),
      );
      await expect(
        service.createConnectOnboardingLink('biz-1', 'AM'),
      ).rejects.toThrow('Stripe does not support card_payments');
    });

    it('rethrows unexpected Stripe errors', async () => {
      stripeService.client.accounts.create.mockRejectedValue(
        new Error('network timeout'),
      );
      await expect(
        service.createConnectOnboardingLink('biz-1', 'AM'),
      ).rejects.toThrow('network timeout');
    });

    it('throws when account link has no url', async () => {
      stripeService.client.accountLinks.create.mockResolvedValue({ url: null });
      await expect(
        service.createConnectOnboardingLink('biz-1', 'AM'),
      ).rejects.toThrow('Failed to create Stripe onboarding link');
    });
  });

  // ─── createConnectLoginLink ───────────────────────────────────────────────────

  describe('createConnectLoginLink', () => {
    beforeEach(() => {
      business.settings = {
        integrations: {
          stripe: { connectAccountId: 'acct_oauth', connectMode: 'oauth' },
        },
      };
    });

    it('returns Stripe dashboard URL with account id for Standard (OAuth) accounts', async () => {
      stripeService.client.accounts.retrieve.mockResolvedValue({
        id: 'acct_oauth',
        type: 'standard',
      });
      const result = await service.createConnectLoginLink('biz-1');
      expect(result.url).toBe('https://dashboard.stripe.com/acct_oauth');
      expect(
        stripeService.client.accounts.createLoginLink,
      ).not.toHaveBeenCalled();
    });

    it('calls createLoginLink for Express accounts', async () => {
      business.settings = {
        integrations: {
          stripe: { connectAccountId: 'acct_expr', connectMode: 'express' },
        },
      };
      stripeService.client.accounts.retrieve.mockResolvedValue({
        id: 'acct_expr',
        type: 'express',
      });
      stripeService.client.accounts.createLoginLink.mockResolvedValue({
        url: 'https://stripe.test/login',
      });
      const result = await service.createConnectLoginLink('biz-1');
      expect(result.url).toBe('https://stripe.test/login');
      expect(
        stripeService.client.accounts.createLoginLink,
      ).toHaveBeenCalledWith('acct_expr');
    });

    it('throws when stripe is not configured', async () => {
      stripeService.isConfigured = false;
      await expect(
        service.createConnectLoginLink('biz-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when business is missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createConnectLoginLink('biz-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when no stripe account is linked', async () => {
      business.settings = {};
      await expect(service.createConnectLoginLink('biz-1')).rejects.toThrow(
        'Connect Stripe before opening the dashboard',
      );
    });

    it('throws when express login link has no url', async () => {
      business.settings = {
        integrations: {
          stripe: { connectAccountId: 'acct_expr', connectMode: 'express' },
        },
      };
      stripeService.client.accounts.retrieve.mockResolvedValue({
        id: 'acct_expr',
        type: 'express',
      });
      stripeService.client.accounts.createLoginLink.mockResolvedValue({
        url: null,
      });
      await expect(service.createConnectLoginLink('biz-1')).rejects.toThrow(
        'Failed to create Stripe dashboard link',
      );
    });
  });

  // ─── syncConnectAccount ───────────────────────────────────────────────────────

  describe('syncConnectAccount', () => {
    beforeEach(() => {
      business.settings = {
        integrations: {
          stripe: {
            connectAccountId: 'acct_oauth',
            connectMode: 'oauth',
            connectChargeModel: 'destination',
          },
        },
      };
    });

    it('corrects connectChargeModel from destination to direct for OAuth accounts', async () => {
      await service.syncConnectAccount('biz-1');
      const saved = businessRepo.save.mock.calls.at(-1)?.[0] as Business;
      const integration = (
        saved.settings?.integrations as Record<string, unknown>
      )?.stripe as { connectChargeModel?: string };
      expect(integration.connectChargeModel).toBe('direct');
    });

    it('corrects connectChargeModel to direct for Standard account type', async () => {
      business.settings = {
        integrations: {
          stripe: {
            connectAccountId: 'acct_std',
            connectMode: 'manual',
            connectChargeModel: 'destination',
          },
        },
      };
      stripeService.client.accounts.retrieve.mockResolvedValue({
        id: 'acct_std',
        type: 'standard',
      });
      await service.syncConnectAccount('biz-1');
      const saved = businessRepo.save.mock.calls.at(-1)?.[0] as Business;
      const integration = (
        saved.settings?.integrations as Record<string, unknown>
      )?.stripe as { connectChargeModel?: string };
      expect(integration.connectChargeModel).toBe('direct');
    });

    it('does not save when charge model is already correct', async () => {
      business.settings = {
        integrations: {
          stripe: {
            connectAccountId: 'acct_oauth',
            connectMode: 'oauth',
            connectChargeModel: 'direct',
          },
        },
      };
      await service.syncConnectAccount('biz-1');
      expect(businessRepo.save).not.toHaveBeenCalled();
    });

    it('throws when no stripe account is linked', async () => {
      business.settings = {};
      await expect(service.syncConnectAccount('biz-1')).rejects.toThrow(
        'No Stripe account linked',
      );
    });

    it('throws when stripe is not configured', async () => {
      stripeService.isConfigured = false;
      await expect(service.syncConnectAccount('biz-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws when account retrieve fails', async () => {
      stripeService.client.accounts.retrieve.mockRejectedValue(
        new Error('No such account'),
      );
      await expect(service.syncConnectAccount('biz-1')).rejects.toThrow(
        'Could not verify Stripe account',
      );
    });

    it('throws when business is missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(service.syncConnectAccount('biz-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // ─── getPublicSettings ────────────────────────────────────────────────────────

  describe('getPublicSettings', () => {
    it('returns configured: false with oauthAvailable when no account is linked', async () => {
      business.settings = {};
      const view = await service.getPublicSettings('biz-1');
      expect(view.configured).toBe(false);
      expect(view.connectAccountId).toBeUndefined();
      expect(view.oauthAvailable).toBe(true);
      expect(view.chargesEnabled).toBe(false);
    });

    it('returns full view for a ready connected account', async () => {
      business.settings = {
        integrations: {
          stripe: {
            connectAccountId: 'acct_oauth',
            connectMode: 'oauth',
            connectChargeModel: 'direct',
          },
        },
      };
      const view = await service.getPublicSettings('biz-1');
      expect(view.configured).toBe(true);
      expect(view.connectAccountId).toBe('acct_oauth');
      expect(view.connectMode).toBe('oauth');
      expect(view.connectChargeModel).toBe('direct');
      expect(view.chargesEnabled).toBe(true);
      expect(view.detailsSubmitted).toBe(true);
      expect(view.displayName).toBe('Salon Stripe');
    });

    it('returns configured: false when stripe is not configured on platform', async () => {
      stripeService.isConfigured = false;
      business.settings = {
        integrations: {
          stripe: { connectAccountId: 'acct_oauth', connectMode: 'oauth' },
        },
      };
      const view = await service.getPublicSettings('biz-1');
      expect(view.configured).toBe(false);
      expect(view.chargesEnabled).toBe(false);
    });

    it('returns configured: false gracefully when account retrieve fails', async () => {
      business.settings = {
        integrations: { stripe: { connectAccountId: 'acct_bad' } },
      };
      stripeService.client.accounts.retrieve.mockRejectedValue(
        new Error('No such account'),
      );
      const view = await service.getPublicSettings('biz-1');
      expect(view.configured).toBe(false);
      expect(view.chargesEnabled).toBe(false);
    });

    it('throws when business is missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(service.getPublicSettings('biz-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // ─── updateSettings ───────────────────────────────────────────────────────────

  describe('updateSettings', () => {
    beforeEach(() => {
      business.settings = {};
    });

    it('saves standard account with direct charge model', async () => {
      stripeService.client.accounts.retrieve.mockResolvedValue({
        id: 'acct_std',
        type: 'standard',
        country: 'US',
        charges_enabled: true,
        details_submitted: true,
        business_profile: { name: 'US Salon' },
        capabilities: { transfers: 'active' },
      });

      const view = await service.updateSettings('biz-1', {
        connectAccountId: 'acct_std',
      });

      const saved = businessRepo.save.mock.calls.at(-1)?.[0] as Business;
      const integration = (
        saved.settings?.integrations as Record<string, unknown>
      )?.stripe as { connectChargeModel?: string; connectMode?: string };
      expect(integration.connectChargeModel).toBe('direct');
      expect(integration.connectMode).toBe('manual');
      expect(view.connectAccountId).toBe('acct_std');
    });

    it('disconnects stripe integration when disconnect flag is set', async () => {
      business.settings = {
        integrations: { stripe: { connectAccountId: 'acct_old' } },
      };
      await service.updateSettings('biz-1', { disconnect: true });
      const saved = businessRepo.save.mock.calls.at(-1)?.[0] as Business;
      const integrations = saved.settings?.integrations as
        | Record<string, unknown>
        | undefined;
      expect(integrations?.stripe).toBeUndefined();
    });

    it('throws when connectAccountId is empty', async () => {
      await expect(
        service.updateSettings('biz-1', { connectAccountId: '  ' }),
      ).rejects.toThrow('Stripe Connect account ID is required');
    });

    it('throws when connectAccountId format is invalid', async () => {
      await expect(
        service.updateSettings('biz-1', { connectAccountId: 'invalid_id' }),
      ).rejects.toThrow('Invalid Stripe account ID');
    });

    it('throws when stripe is not configured', async () => {
      stripeService.isConfigured = false;
      await expect(
        service.updateSettings('biz-1', { connectAccountId: 'acct_test123' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when Stripe cannot find the account', async () => {
      stripeService.client.accounts.retrieve.mockRejectedValue(
        new Error('No such account'),
      );
      await expect(
        service.updateSettings('biz-1', { connectAccountId: 'acct_unknown' }),
      ).rejects.toThrow('Could not find that connected account');
    });

    it('throws when business is missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateSettings('biz-1', { connectAccountId: 'acct_test' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ─── assertCanAcceptOnlinePayments ────────────────────────────────────────────

  describe('assertCanAcceptOnlinePayments', () => {
    beforeEach(() => {
      business.settings = {
        integrations: {
          stripe: { connectAccountId: 'acct_oauth', connectMode: 'oauth' },
        },
      };
    });

    it('returns connect account id when account is ready', async () => {
      const accountId = await service.assertCanAcceptOnlinePayments('biz-1');
      expect(accountId).toBe('acct_oauth');
    });

    it('throws when no stripe account is linked', async () => {
      business.settings = {};
      await expect(
        service.assertCanAcceptOnlinePayments('biz-1'),
      ).rejects.toThrow('Connect your Stripe account');
    });

    it('throws when stripe is not configured on platform', async () => {
      stripeService.isConfigured = false;
      await expect(
        service.assertCanAcceptOnlinePayments('biz-1'),
      ).rejects.toThrow('Online payments are not configured');
    });

    it('throws when onboarding is incomplete (charges_enabled is false)', async () => {
      stripeService.client.accounts.retrieve.mockResolvedValue({
        id: 'acct_oauth',
        type: 'standard',
        country: 'AM',
        charges_enabled: false,
        details_submitted: false,
        capabilities: { transfers: 'inactive' },
      });
      await expect(
        service.assertCanAcceptOnlinePayments('biz-1'),
      ).rejects.toThrow('Stripe onboarding is incomplete');
    });

    it('throws when business is missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.assertCanAcceptOnlinePayments('biz-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
