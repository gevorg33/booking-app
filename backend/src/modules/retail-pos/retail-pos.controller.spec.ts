import { ForbiddenException } from '@nestjs/common';
import { RetailPosController } from './retail-pos.controller.js';
import { RetailPosService } from './retail-pos.service.js';
import { BusinessService } from '../business/business.service.js';

describe('RetailPosController', () => {
  const retailPosService = {
    listSellableProducts: jest.fn(),
    getBookingRetailSales: jest.fn(),
    setBookingRetailSales: jest.fn(),
  };
  const businessService = { ensureMember: jest.fn() };

  const controller = new RetailPosController(
    retailPosService as unknown as RetailPosService,
    businessService as unknown as BusinessService,
  );

  const user = { id: 'user-1' };
  const products = [{ id: 'prod-1', name: 'Shampoo', retailPrice: 18, quantityOnHand: 10 }];
  const checkout = { lines: [], retailTotal: 0, currency: 'USD' };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'owner' });
    retailPosService.listSellableProducts.mockResolvedValue(products);
    retailPosService.getBookingRetailSales.mockResolvedValue(checkout);
    retailPosService.setBookingRetailSales.mockResolvedValue({
      lines: [{ productId: 'prod-1', quantity: 1, lineTotal: 18 }],
      retailTotal: 18,
      currency: 'USD',
    });
  });

  it('lists sellable products after membership guard', async () => {
    const result = await controller.listProducts('biz-1', user);
    expect(businessService.ensureMember).toHaveBeenCalledWith('biz-1', 'user-1');
    expect(retailPosService.listSellableProducts).toHaveBeenCalledWith('biz-1');
    expect(result.products).toEqual(products);
  });

  it('returns booking retail checkout after membership guard', async () => {
    const result = await controller.getBookingSales('biz-1', 'booking-1', user);
    expect(retailPosService.getBookingRetailSales).toHaveBeenCalledWith('biz-1', 'booking-1');
    expect(result).toEqual(checkout);
  });

  it('updates booking retail cart after membership guard', async () => {
    const dto = { lines: [{ productId: 'prod-1', quantity: 1 }] };
    const result = await controller.setBookingSales('biz-1', 'booking-1', dto, user);
    expect(retailPosService.setBookingRetailSales).toHaveBeenCalledWith(
      'biz-1',
      'booking-1',
      'user-1',
      dto,
    );
    expect(result.retailTotal).toBe(18);
  });

  it('propagates membership guard failures', async () => {
    businessService.ensureMember.mockRejectedValue(new ForbiddenException());
    await expect(controller.listProducts('biz-1', user)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.getBookingSales('biz-1', 'booking-1', user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      controller.setBookingSales('biz-1', 'booking-1', { lines: [] }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
