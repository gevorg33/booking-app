import { BookingController } from '../booking/booking.controller.js';
import { BookingService } from '../booking/booking.service.js';
import { RetailPosService } from './retail-pos.service.js';
import { withBookingPaymentSummary } from '../booking/booking-payment-summary.util.js';

describe('Booking detail + retail POS integration', () => {
  const bookingService = { findOne: jest.fn() };
  const retailPosService = { getBookingRetailSales: jest.fn() };

  const controller = new BookingController(
    bookingService as unknown as BookingService,
    retailPosService as unknown as RetailPosService,
  );

  const booking = {
    id: 'booking-1',
    businessId: 'biz-1',
    metadata: { pricing: { subtotal: 80, amountDue: 80 } },
    service: { price: 80, currency: 'USD' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    bookingService.findOne.mockResolvedValue(booking);
    retailPosService.getBookingRetailSales.mockResolvedValue({
      lines: [
        {
          productName: 'Shampoo',
          quantity: 2,
          unitPrice: 18,
          lineTotal: 36,
        },
      ],
      retailTotal: 36,
      currency: 'USD',
    });
  });

  it('attaches retail lines and payment summary on booking detail', async () => {
    const result = await controller.findOne('biz-1', 'booking-1');

    expect(bookingService.findOne).toHaveBeenCalledWith('booking-1');
    expect(retailPosService.getBookingRetailSales).toHaveBeenCalledWith('biz-1', 'booking-1');
    expect(result.paymentSummary).toMatchObject({
      cashPaid: 80,
      retailTotal: 36,
      grandTotal: 116,
    });
    expect(result.paymentSummary?.retailLines).toEqual([
      { productName: 'Shampoo', quantity: 2, unitPrice: 18, lineTotal: 36 },
    ]);
  });

  it('matches standalone payment summary helper wiring', async () => {
    const checkout = await retailPosService.getBookingRetailSales('biz-1', 'booking-1');
    const retailLines = checkout.lines.map((line: {
      productName: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }) => ({
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    }));

    const fromController = await controller.findOne('biz-1', 'booking-1');
    const fromHelper = withBookingPaymentSummary(booking, retailLines);

    expect(fromController.paymentSummary).toEqual(fromHelper.paymentSummary);
  });

  it('returns service-only payment summary when retail cart is empty', async () => {
    retailPosService.getBookingRetailSales.mockResolvedValue({
      lines: [],
      retailTotal: 0,
      currency: 'USD',
    });

    const result = await controller.findOne('biz-1', 'booking-1');
    expect(result.paymentSummary?.retailTotal).toBe(0);
    expect(result.paymentSummary?.grandTotal).toBe(80);
  });
});
