import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  API_BUG7_LIVE_SCENARIOS,
  API_BUG7_SOURCE_RULES,
  API_BUG7_UNIT_SCENARIOS,
} from './api-bug7-prepayment-sum.fixtures.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import { BookingPaymentService } from './booking-payment.service.js';

describe('api-bug.7 prepayment sum pricing', () => {
  it.each(API_BUG7_SOURCE_RULES)('$id', ({ file, mustContain }) => {
    const source = readFileSync(resolve(__dirname, file), 'utf8');
    expect(source).toContain(mustContain);
  });

  it('live scenario inventory covers package/multi/single + UI semantics', () => {
    expect(API_BUG7_LIVE_SCENARIOS.map((s) => s.id)).toEqual(
      expect.arrayContaining([
        'api7-live-package-quote-deposit-line-only',
        'api7-live-package-all-none-amount-due-zero',
        'api7-live-multi-all-none-quote',
        'api7-live-multi-all-none-checkout-refused',
        'api7-live-multi-mixed-deposit',
        'api7-live-single-deposit-quote',
        'api7-live-frontend-cart-total-semantics',
      ]),
    );
    expect(API_BUG7_LIVE_SCENARIOS).toHaveLength(8);
  });

  describe('calculatePrepaymentAmount matrix', () => {
    const service = Object.create(
      BookingPaymentService.prototype,
    ) as BookingPaymentService;

    it.each(API_BUG7_UNIT_SCENARIOS)(
      '$id',
      ({ modes, prices, deposits, expectPrepayment, packageCap }) => {
        let sum = 0;
        for (let i = 0; i < modes.length; i++) {
          const mode =
            modes[i] === 'full'
              ? PrepaymentMode.FULL
              : modes[i] === 'deposit'
                ? PrepaymentMode.DEPOSIT
                : PrepaymentMode.NONE;
          sum += service.calculatePrepaymentAmount({
            price: prices[i],
            prepaymentMode: mode,
            depositAmount: deposits[i],
          } as never);
        }
        sum = Math.round(sum * 100) / 100;
        if (packageCap != null) {
          sum = Math.min(sum, packageCap);
        }
        expect(sum).toBe(expectPrepayment);
      },
    );
  });
});
