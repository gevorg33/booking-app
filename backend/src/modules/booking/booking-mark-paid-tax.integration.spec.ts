import { PaymentStatus } from './entities/booking.entity.js';
import { recordTaxInclusivePaymentAmount } from './booking-payment-summary.util.js';

describe('Sprint 36 — mark paid tax-inclusive amount', () => {
  it('records tax-inclusive amount paid when provider marks booking paid', () => {
    const metadata = {
      pricing: {
        servicePrice: 100,
        subtotal: 100,
        amountDue: 120,
        taxEnabled: true,
        taxName: 'VAT',
        taxRate: 20,
        taxModel: 'exclusive',
        taxAmount: 20,
        netAmount: 100,
      },
    };

    const updated = recordTaxInclusivePaymentAmount(metadata);

    expect(updated).toMatchObject({
      amountPaid: 120,
      cashPaidEligible: 120,
      pricing: expect.objectContaining({
        amountDue: 120,
        taxAmount: 20,
      }),
    });
  });

  it('preserves stacked tax metadata when marking paid', () => {
    const metadata = {
      pricing: {
        amountDue: 113,
        taxEnabled: true,
        taxAmount: 13,
        taxRules: [
          { id: 'gst', name: 'GST', rate: 5, amount: 5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 8 },
        ],
      },
    };

    expect(recordTaxInclusivePaymentAmount(metadata)).toMatchObject({
      amountPaid: 113,
      cashPaidEligible: 113,
    });
  });

  it('simulates payment status transition to paid with tax-inclusive total', () => {
    const previousPaymentStatus = PaymentStatus.PENDING;
    const paymentStatus = PaymentStatus.PAID;
    let bookingMetadata = {
      pricing: { amountDue: 120, taxAmount: 20 },
    };

    if (
      paymentStatus === PaymentStatus.PAID &&
      previousPaymentStatus !== PaymentStatus.PAID
    ) {
      bookingMetadata = recordTaxInclusivePaymentAmount(bookingMetadata);
    }

    expect(bookingMetadata).toMatchObject({
      amountPaid: 120,
      cashPaidEligible: 120,
    });
  });
});
