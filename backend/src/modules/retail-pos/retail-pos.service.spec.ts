import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { Product } from '../inventory/entities/inventory.entity.js';
import { BookingRetailSale } from './entities/booking-retail-sale.entity.js';
import { RetailPosService } from './retail-pos.service.js';

function mockTransaction(
  saleRepo: { manager: { transaction: jest.Mock } },
  productRepoTx: object,
  saleRepoTx: object,
) {
  saleRepo.manager.transaction.mockImplementation(async (cb) =>
    cb({
      getRepository: (entity: unknown) => {
        if (entity === Product) return productRepoTx;
        if (entity === BookingRetailSale) return saleRepoTx;
        throw new Error(`Unexpected repository ${String(entity)}`);
      },
    }),
  );
}

describe('RetailPosService', () => {
  const saleRepo = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    manager: { transaction: jest.fn() },
  };
  const bookingRepo = { findOne: jest.fn(), save: jest.fn() };
  const productRepo = { find: jest.fn() };

  const service = new RetailPosService(saleRepo as any, bookingRepo as any, productRepo as any);

  const booking = {
    id: 'booking-1',
    businessId: 'biz-1',
    status: BookingStatus.CONFIRMED,
    metadata: {},
    service: { currency: 'USD' },
  };

  const product = {
    id: 'prod-1',
    businessId: 'biz-1',
    name: 'Shampoo',
    retailPrice: 18,
    quantityOnHand: 10,
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    saleRepo.create.mockImplementation((v) => v);
    saleRepo.save.mockImplementation(async (v) => ({ id: 'sale-1', ...v }));
    bookingRepo.findOne.mockResolvedValue(booking);
    bookingRepo.save.mockImplementation(async (b) => b);
    productRepo.find.mockResolvedValue([product]);
  });

  it('lists sellable products with retail price and stock', async () => {
    await expect(service.listSellableProducts('biz-1')).resolves.toEqual([
      expect.objectContaining({ id: 'prod-1', retailPrice: 18, quantityOnHand: 10 }),
    ]);
  });

  it('replaces booking retail cart and deducts inventory', async () => {
    const productRepoTx = {
      findOne: jest.fn().mockResolvedValue({ ...product }),
      save: jest.fn().mockImplementation(async (p) => p),
    };
    const saleRepoTx = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
      save: jest.fn().mockImplementation(async (v) => v),
      create: jest.fn().mockImplementation((v) => v),
    };

    mockTransaction(saleRepo, productRepoTx, saleRepoTx);

    saleRepo.find.mockResolvedValue([
      {
        id: 'sale-1',
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 18,
        lineTotal: 36,
        product,
      },
    ]);

    const result = await service.setBookingRetailSales('biz-1', 'booking-1', 'user-1', {
      lines: [{ productId: 'prod-1', quantity: 2 }],
    });

    expect(result.retailTotal).toBe(36);
    expect(result.lines).toHaveLength(1);
    expect(productRepoTx.save).toHaveBeenCalledWith(
      expect.objectContaining({ quantityOnHand: 8 }),
    );
    expect(bookingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          retailPos: expect.objectContaining({ retailTotal: 36 }),
        }),
      }),
    );
  });

  it('rejects retail sales on cancelled bookings', async () => {
    bookingRepo.findOne.mockResolvedValue({ ...booking, status: BookingStatus.CANCELLED });
    await expect(
      service.setBookingRetailSales('biz-1', 'booking-1', 'user-1', { lines: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns empty checkout when booking has no retail sales', async () => {
    saleRepo.find.mockResolvedValue([]);
    await expect(service.getBookingRetailSales('biz-1', 'booking-1')).resolves.toEqual({
      lines: [],
      retailTotal: 0,
      currency: 'USD',
    });
  });

  it('merges duplicate product lines before checkout', async () => {
    const productRepoTx = {
      findOne: jest.fn().mockResolvedValue({ ...product }),
      save: jest.fn().mockImplementation(async (p) => p),
    };
    const saleRepoTx = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
      save: jest.fn().mockImplementation(async (v) => v),
      create: jest.fn().mockImplementation((v) => v),
    };
    mockTransaction(saleRepo, productRepoTx, saleRepoTx);
    saleRepo.find.mockResolvedValue([
      {
        id: 'sale-1',
        productId: 'prod-1',
        quantity: 3,
        unitPrice: 18,
        lineTotal: 54,
        product,
      },
    ]);

    const result = await service.setBookingRetailSales('biz-1', 'booking-1', 'user-1', {
      lines: [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-1', quantity: 2 },
      ],
    });

    expect(result.retailTotal).toBe(54);
    expect(saleRepoTx.save).toHaveBeenCalledTimes(1);
  });

  it('restores stock when replacing an existing retail cart', async () => {
    const stockedProduct = { ...product, quantityOnHand: 5 };
    const productRepoTx = {
      findOne: jest.fn().mockResolvedValue({ ...stockedProduct }),
      save: jest.fn().mockImplementation(async (p) => p),
    };
    const saleRepoTx = {
      find: jest.fn().mockResolvedValue([
        { id: 'old-sale', quantity: 2, product: { ...stockedProduct, quantityOnHand: 5 } },
      ]),
      delete: jest.fn(),
      save: jest.fn(),
      create: jest.fn().mockImplementation((v) => v),
    };
    mockTransaction(saleRepo, productRepoTx, saleRepoTx);
    saleRepo.find.mockResolvedValue([]);

    await service.setBookingRetailSales('biz-1', 'booking-1', 'user-1', { lines: [] });
    expect(saleRepoTx.delete).toHaveBeenCalledWith({ bookingId: 'booking-1' });
    expect(productRepoTx.save).toHaveBeenCalledWith(
      expect.objectContaining({ quantityOnHand: 7 }),
    );
  });

  it('skips stock restore when prior sale has no product relation', async () => {
    const productRepoTx = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    const saleRepoTx = {
      find: jest.fn().mockResolvedValue([{ id: 'old-sale', quantity: 2, product: null }]),
      delete: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    mockTransaction(saleRepo, productRepoTx, saleRepoTx);
    saleRepo.find.mockResolvedValue([]);

    await service.setBookingRetailSales('biz-1', 'booking-1', 'user-1', { lines: [] });
    expect(productRepoTx.save).not.toHaveBeenCalled();
    expect(saleRepoTx.delete).toHaveBeenCalledWith({ bookingId: 'booking-1' });
  });

  it('rejects checkout when stock is insufficient', async () => {
    const productRepoTx = {
      findOne: jest.fn().mockResolvedValue({ ...product, quantityOnHand: 1 }),
      save: jest.fn(),
    };
    const saleRepoTx = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    mockTransaction(saleRepo, productRepoTx, saleRepoTx);

    await expect(
      service.setBookingRetailSales('biz-1', 'booking-1', 'user-1', {
        lines: [{ productId: 'prod-1', quantity: 5 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects products without retail price', async () => {
    const productRepoTx = {
      findOne: jest.fn().mockResolvedValue({ ...product, retailPrice: 0 }),
      save: jest.fn(),
    };
    const saleRepoTx = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    mockTransaction(saleRepo, productRepoTx, saleRepoTx);

    await expect(
      service.setBookingRetailSales('biz-1', 'booking-1', 'user-1', {
        lines: [{ productId: 'prod-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('groups sale views by booking id', async () => {
    saleRepo.find.mockResolvedValue([
      {
        bookingId: 'b1',
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 18,
        lineTotal: 18,
        product,
      },
      {
        bookingId: 'b2',
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 18,
        lineTotal: 36,
        product,
      },
    ]);

    const map = await service.listSaleViewsForBookings(['b1', 'b2']);
    expect(map.get('b1')).toHaveLength(1);
    expect(map.get('b2')?.[0]?.lineTotal).toBe(36);
  });

  it('normalizes null line input when clearing cart', async () => {
    const saleRepoTx = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    mockTransaction(saleRepo, { findOne: jest.fn(), save: jest.fn() }, saleRepoTx);
    saleRepo.find.mockResolvedValue([]);

    await service.setBookingRetailSales('biz-1', 'booking-1', 'user-1', { lines: null as any });
    expect(saleRepoTx.delete).not.toHaveBeenCalled();
  });

  it('throws when booking is missing', async () => {
    bookingRepo.findOne.mockResolvedValue(null);
    await expect(service.getBookingRetailSales('biz-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('filters out products without retail price or stock', async () => {
    productRepo.find.mockResolvedValue([
      product,
      { ...product, id: 'prod-2', retailPrice: 0 },
      { ...product, id: 'prod-3', quantityOnHand: 0 },
    ]);
    const result = await service.listSellableProducts('biz-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('prod-1');
  });

  it('returns empty map when no booking ids are provided', async () => {
    await expect(service.listSaleViewsForBookings([])).resolves.toEqual(new Map());
    expect(saleRepo.find).not.toHaveBeenCalled();
  });

  it('defaults currency when booking service has no currency', async () => {
    bookingRepo.findOne.mockResolvedValue({ ...booking, service: null });
    saleRepo.find.mockResolvedValue([]);
    await expect(service.getBookingRetailSales('biz-1', 'booking-1')).resolves.toMatchObject({
      currency: 'USD',
    });
  });

  it('throws when product is missing during checkout', async () => {
    const productRepoTx = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const saleRepoTx = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    mockTransaction(saleRepo, productRepoTx, saleRepoTx);

    await expect(
      service.setBookingRetailSales('biz-1', 'booking-1', 'user-1', {
        lines: [{ productId: 'missing', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('skips zero-quantity lines and preserves existing booking metadata', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...booking,
      metadata: { note: 'vip' },
      service: { currency: 'EUR' },
    });
    const productRepoTx = {
      findOne: jest.fn().mockResolvedValue({ ...product }),
      save: jest.fn().mockImplementation(async (p) => p),
    };
    const saleRepoTx = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
      save: jest.fn().mockImplementation(async (v) => v),
      create: jest.fn().mockImplementation((v) => v),
    };
    mockTransaction(saleRepo, productRepoTx, saleRepoTx);
    saleRepo.find.mockResolvedValue([
      {
        id: 'sale-1',
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 18,
        lineTotal: 18,
        product,
      },
    ]);

    const result = await service.setBookingRetailSales('biz-1', 'booking-1', 'user-1', {
      lines: [
        { productId: 'prod-1', quantity: 0 },
        { productId: 'prod-1', quantity: 1 },
      ],
    });

    expect(result.currency).toBe('EUR');
    expect(bookingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          note: 'vip',
          retailPos: expect.objectContaining({ lineCount: 1 }),
        }),
      }),
    );
  });

  it('uses fallback product label when relation is missing', async () => {
    saleRepo.find.mockResolvedValue([
      {
        bookingId: 'b1',
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 18,
        lineTotal: 18,
        product: null,
      },
    ]);
    const map = await service.listSaleViewsForBookings(['b1']);
    expect(map.get('b1')?.[0]?.productName).toBe('Product');
  });
});
