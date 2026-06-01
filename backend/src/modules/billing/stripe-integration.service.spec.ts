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
    client: {
      accounts: {
        create: jest.Mock;
        retrieve: jest.Mock;
        createLoginLink: jest.Mock;
      };
      accountLinks: {
        create: jest.Mock;
      };
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
      usesDestinationCharges: jest.fn().mockReturnValue(true),
      client: {
        accounts: {
          create: jest.fn().mockResolvedValue({ id: 'acct_new' }),
          retrieve: jest.fn().mockResolvedValue({
            id: 'acct_existing',
            type: 'express',
            country: 'AE',
            charges_enabled: true,
            details_submitted: true,
            business_profile: { name: 'Salon Stripe' },
          }),
          createLoginLink: jest.fn().mockResolvedValue({ url: 'https://stripe.test/login' }),
        },
        accountLinks: {
          create: jest.fn().mockResolvedValue({ url: 'https://stripe.test/onboard' }),
        },
      },
    };
    service = new StripeIntegrationService(
      businessRepo as never,
      stripeService as unknown as StripeService,
    );
  });

  it('creates express account and onboarding link', async () => {
    const result = await service.createConnectOnboardingLink('biz-1');

    expect(stripeService.client.accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'express',
        country: 'AE',
        capabilities: { transfers: { requested: true } },
      }),
    );
    expect(stripeService.client.accountLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        account: 'acct_new',
        type: 'account_onboarding',
        return_url: 'http://localhost:3000/dashboard/billing?stripe_connect=return',
        refresh_url: 'http://localhost:3000/dashboard/billing?stripe_connect=refresh',
      }),
    );
    expect(result.url).toBe('https://stripe.test/onboard');
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('reuses existing account for onboarding link', async () => {
    business.settings = { integrations: { stripe: { connectAccountId: 'acct_existing' } } };

    await service.createConnectOnboardingLink('biz-1');

    expect(stripeService.client.accounts.create).not.toHaveBeenCalled();
    expect(stripeService.client.accountLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({ account: 'acct_existing' }),
    );
  });

  it('treats transfers capability as ready for destination-charge platforms', async () => {
    business.settings = { integrations: { stripe: { connectAccountId: 'acct_ae' } } };
    stripeService.client.accounts.retrieve.mockResolvedValue({
      id: 'acct_ae',
      type: 'express',
      country: 'AE',
      charges_enabled: false,
      capabilities: { transfers: 'active' },
      details_submitted: true,
    });

    const view = await service.getPublicSettings('biz-1');

    expect(view.configured).toBe(true);
    expect(view.chargesEnabled).toBe(true);
  });

  it('saves manual account id without requiring charges enabled', async () => {
    stripeService.client.accounts.retrieve.mockResolvedValue({
      id: 'acct_manual',
      country: 'AE',
      charges_enabled: false,
    });

    const view = await service.updateSettings('biz-1', { connectAccountId: 'acct_manual' });

    expect(view.connectAccountId).toBe('acct_manual');
    expect(view.chargesEnabled).toBe(false);
  });

  it('opens express login link for express accounts', async () => {
    business.settings = { integrations: { stripe: { connectAccountId: 'acct_existing' } } };
    stripeService.client.accounts.retrieve.mockResolvedValue({ id: 'acct_existing', type: 'express' });

    const result = await service.createConnectLoginLink('biz-1');

    expect(result.url).toBe('https://stripe.test/login');
  });

  it('throws when business missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);

    await expect(service.createConnectOnboardingLink('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws when stripe is not configured', async () => {
    stripeService.isConfigured = false;

    await expect(service.createConnectOnboardingLink('biz-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
