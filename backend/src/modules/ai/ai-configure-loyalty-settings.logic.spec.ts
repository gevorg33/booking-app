import { handleConfigureLoyaltySettingsLogic } from './ai-configure-loyalty-settings.logic.js';

describe('ai-configure-loyalty-settings.logic', () => {
  const business = {
    id: 'biz-1',
    settings: { loyalty: { earnPercentCashback: 5, enabled: true } },
  };

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business, settings: { ...business.settings, loyalty: { ...business.settings.loyalty } } })),
    save: jest.fn(async (row: typeof business) => row),
  };

  const planEntitlementsService = {
    assertFeature: jest.fn(async () => undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = { loyalty: { earnPercentCashback: 5, enabled: true } };
  });

  it('updates earn percent cashback', async () => {
    const result = await handleConfigureLoyaltySettingsLogic(
      { businessRepo, planEntitlementsService } as any,
      'biz-1',
      {},
      'Set loyalty earn rate to 10%',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('10%');
    expect(businessRepo.save).toHaveBeenCalled();
    const saved = businessRepo.save.mock.calls[0][0];
    expect(saved.settings.loyalty.earnPercentCashback).toBe(10);
  });

  it('enables loyalty program', async () => {
    business.settings = { loyalty: { earnPercentCashback: 5, enabled: false } };
    const result = await handleConfigureLoyaltySettingsLogic(
      { businessRepo, planEntitlementsService } as any,
      'biz-1',
      {},
      'Enable loyalty program',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('enabled');
    const saved = businessRepo.save.mock.calls[0][0];
    expect(saved.settings.loyalty.enabled).toBe(true);
  });

  it('disables loyalty program', async () => {
    const result = await handleConfigureLoyaltySettingsLogic(
      { businessRepo, planEntitlementsService } as any,
      'biz-1',
      {},
      'Disable loyalty program',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('disabled');
    const saved = businessRepo.save.mock.calls[0][0];
    expect(saved.settings.loyalty.enabled).toBe(false);
  });

  it('returns clarify when no changes detected', async () => {
    const result = await handleConfigureLoyaltySettingsLogic(
      { businessRepo, planEntitlementsService } as any,
      'biz-1',
      {},
      'Configure loyalty settings',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns clarify when prompt is not a configure request', async () => {
    const result = await handleConfigureLoyaltySettingsLogic(
      { businessRepo, planEntitlementsService } as any,
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns failure when plan feature is unavailable', async () => {
    const result = await handleConfigureLoyaltySettingsLogic(
      {
        businessRepo,
        planEntitlementsService: {
          assertFeature: jest.fn(async () => {
            throw new Error('Loyalty is not on your plan');
          }),
        },
      } as any,
      'biz-1',
      {},
      'Set loyalty earn rate to 10%',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toBe('Loyalty is not on your plan');
  });

  it('updates excluded service ids from params', async () => {
    const result = await handleConfigureLoyaltySettingsLogic(
      { businessRepo, planEntitlementsService } as any,
      'biz-1',
      {
        earnExcludedServiceIds: [
          '11111111-1111-4111-8111-111111111111',
          '22222222-2222-4222-8222-222222222222',
        ],
      },
      'Configure loyalty settings',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('excluded services');
  });

  it('returns failure when business is missing', async () => {
    const result = await handleConfigureLoyaltySettingsLogic(
      {
        businessRepo: { findOne: jest.fn(async () => null), save: jest.fn() },
        planEntitlementsService,
      } as any,
      'biz-1',
      {},
      'Set loyalty earn rate to 10%',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toBe('Business not found.');
  });
});
