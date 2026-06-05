import { BadRequestException } from '@nestjs/common';
import { BusinessService } from './business.service.js';
import type { Business } from './entities/business.entity.js';

describe('BusinessService currency (Sprint 28)', () => {
  const businessRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (b: Business) => b),
  };
  const memberRepo = { find: jest.fn() };

  const service = new BusinessService(
    businessRepo as never,
    memberRepo as never,
  );

  const baseBusiness: Business = {
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: { locale: 'en', publicBooking: { enabled: true } },
  } as Business;

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({ ...baseBusiness });
  });

  describe('update settings.currency', () => {
    it.each([
      ['amd', 'AMD'],
      ['EUR', 'EUR'],
      [' rub ', 'RUB'],
    ])(
      'normalizes and persists %s as %s with legacy sync',
      async (input, expected) => {
        await service.update('biz-1', { settings: { currency: input } });

        expect(businessRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({
            settings: expect.objectContaining({
              currency: expected,
              defaultCurrency: expected,
            }),
          }),
        );
      },
    );

    it.each([['XYZ'], ['US'], [''], ['   ']])(
      'rejects invalid currency code %s',
      async (code) => {
        await expect(
          service.update('biz-1', { settings: { currency: code } }),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(businessRepo.save).not.toHaveBeenCalled();
      },
    );

    it('merges other settings without touching currency when omitted', async () => {
      await service.update('biz-1', {
        settings: { publicBooking: { acceptCashPayments: true } },
      });

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            publicBooking: expect.objectContaining({
              acceptCashPayments: true,
            }),
          }),
        }),
      );
    });

    it('skips currency validation when settings patch is null', async () => {
      await service.update('biz-1', {
        settings: null as unknown as Record<string, unknown>,
      });
      expect(businessRepo.save).toHaveBeenCalled();
    });
  });

  describe('getDefaultCurrency', () => {
    it('reads currency from business settings', () => {
      expect(
        service.getDefaultCurrency({
          ...baseBusiness,
          settings: { currency: 'AMD' },
        }),
      ).toBe('AMD');
    });

    it('falls back to USD', () => {
      expect(
        service.getDefaultCurrency({
          ...baseBusiness,
          settings: {},
        }),
      ).toBe('USD');
    });
  });
});
