import { resolveBookingPaymentSummary } from '../booking/booking-payment-summary.util.js';
import { RetailPosService } from './retail-pos.service.js';
import { Product } from '../inventory/entities/inventory.entity.js';
import { BookingRetailSale } from './entities/booking-retail-sale.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('Retail POS + booking payment summary integration', () => {
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
    metadata: { pricing: { subtotal: 80, amountDue: 80 } },
    service: { price: 80, currency: 'USD' },
  };

  const product = {
    id: 'prod-1',
    businessId: 'biz-1',
    name: 'Shampoo',
    retailPrice: 18,
    quantityOnHand: 10,
    isActive: true,
  };

  function mockTransaction(productRepoTx: object, saleRepoTx: object) {
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

  beforeEach(() => {
    jest.clearAllMocks();
    saleRepo.create.mockImplementation((v) => v);
    saleRepo.save.mockImplementation(async (v) => ({ id: 'sale-1', ...v }));
    bookingRepo.findOne.mockResolvedValue(booking);
    bookingRepo.save.mockImplementation(async (b) => b);
  });

  it('feeds retail sale views into booking payment grand total', async () => {
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
    mockTransaction(productRepoTx, saleRepoTx);

    saleRepo.find.mockResolvedValue([
      {
        id: 'sale-1',
        bookingId: 'booking-1',
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 18,
        lineTotal: 36,
        product,
      },
    ]);

    await service.setBookingRetailSales('biz-1', 'booking-1', 'user-1', {
      lines: [{ productId: 'prod-1', quantity: 2 }],
    });

    const retailByBooking = await service.listSaleViewsForBookings(['booking-1']);
    const retailLines = retailByBooking.get('booking-1') ?? [];
    const summary = resolveBookingPaymentSummary(booking, retailLines);

    expect(summary?.retailTotal).toBe(36);
    expect(summary?.grandTotal).toBe(116);
    expect(summary?.cashPaid).toBe(80);
    expect(summary?.retailLines).toHaveLength(1);
  });

  it('supports retail-only checkout when service pricing metadata is absent', async () => {
    saleRepo.find.mockResolvedValue([
      {
        id: 'sale-2',
        bookingId: 'booking-2',
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 12,
        lineTotal: 12,
        product: { ...product, name: 'Oil' },
      },
    ]);

    const retailByBooking = await service.listSaleViewsForBookings(['booking-2']);
    const summary = resolveBookingPaymentSummary(
      { metadata: {}, service: { price: 0, currency: 'USD' } },
      retailByBooking.get('booking-2') ?? [],
    );

    expect(summary?.retailTotal).toBe(12);
    expect(summary?.grandTotal).toBe(12);
    expect(summary?.hasDiscounts).toBe(true);
  });
});
