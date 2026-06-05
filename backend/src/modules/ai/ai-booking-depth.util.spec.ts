import {
  PaymentStatus,
  BookingStatus,
} from '../booking/entities/booking.entity.js';
import * as selfService from '../../common/utils/customer-self-service.util.js';
import {
  rescueBookingDepthIntent,
  isCashPendingBooking,
  filterCashPendingBookings,
  filterPackageBookings,
  filterMultiServiceBookings,
  enrichCashBookingParams,
  enrichSubscriptionCreditParams,
  buildBookingPolicyExplanation,
  summarizeBookingPolicy,
  isBookingDepthIntent,
  isSubscriptionCreditBookingPrompt,
  isCashBookingPrompt,
  isPackageBookingPrompt,
  isMultiServiceBookingPrompt,
  isCancelPackageVisitPrompt,
  isCancelMultiServiceGroupPrompt,
  isReschedulePackageVisitPrompt,
  isRescheduleMultiServiceGroupPrompt,
  isListCashPendingPrompt,
  isListPackageBookingsPrompt,
  isListMultiServiceBookingsPrompt,
  isMarkPaidPrompt,
  isAssignBookingResourcePrompt,
  isExplainBookingPolicyPrompt,
  BOOKING_DEPTH_INTENTS,
} from './ai-booking-depth.util.js';

describe('ai-booking-depth.util', () => {
  describe('prompt classifiers', () => {
    it('detects subscription, cash, package, and multi-service prompts', () => {
      expect(
        isSubscriptionCreditBookingPrompt('Book using her subscription credit'),
      ).toBe(true);
      expect(isSubscriptionCreditBookingPrompt('plan visit tomorrow')).toBe(
        true,
      );
      expect(isCashBookingPrompt('pay at venue tomorrow')).toBe(true);
      expect(isCashBookingPrompt('walk-in cash appointment')).toBe(true);
      expect(isCashBookingPrompt('walk-in only')).toBe(false);
      expect(isPackageBookingPrompt('Book spa day for James')).toBe(true);
      expect(isPackageBookingPrompt('package booking for Anna')).toBe(true);
      expect(
        isMultiServiceBookingPrompt('Book haircut and beard trim Tuesday'),
      ).toBe(true);
      expect(isMultiServiceBookingPrompt('multi-service visit')).toBe(true);
    });

    it('detects cancel, reschedule, list, mark paid, assign, and policy prompts', () => {
      expect(isCancelPackageVisitPrompt('cancel package visit for Sofia')).toBe(
        true,
      );
      expect(
        isCancelMultiServiceGroupPrompt('cancel multi-service group'),
      ).toBe(true);
      expect(
        isReschedulePackageVisitPrompt('reschedule package visit to Friday'),
      ).toBe(true);
      expect(
        isRescheduleMultiServiceGroupPrompt('move multi-service to 3pm'),
      ).toBe(true);
      expect(isListCashPendingPrompt('show cash pending today')).toBe(true);
      expect(isListCashPendingPrompt('book cash tomorrow')).toBe(false);
      expect(isListCashPendingPrompt('show pending cash today')).toBe(true);
      expect(isListPackageBookingsPrompt('list package visits this week')).toBe(
        true,
      );
      expect(
        isListMultiServiceBookingsPrompt('show multi-service groups'),
      ).toBe(true);
      expect(isMarkPaidPrompt('mark booking paid')).toBe(true);
      expect(isAssignBookingResourcePrompt('assign room 2 to facial')).toBe(
        true,
      );
      expect(
        isExplainBookingPolicyPrompt('can this customer still cancel?'),
      ).toBe(true);
      expect(
        isExplainBookingPolicyPrompt('reschedule policy for booking'),
      ).toBe(true);
    });
  });

  describe('rescueBookingDepthIntent', () => {
    it('rescues package and multi-service booking prompts', () => {
      expect(
        rescueBookingDepthIntent('Book spa day package for James', 'unknown')
          ?.action,
      ).toBe('create_package_booking');
      expect(
        rescueBookingDepthIntent(
          'Book haircut and beard trim Tuesday 10am',
          'unknown',
        )?.action,
      ).toBe('create_multi_service_booking');
      expect(
        rescueBookingDepthIntent(
          'Book spa day package for James',
          'create_booking',
        ),
      ).toBeNull();
    });

    it('rescues subscription and cash variants from create_booking and unknown', () => {
      expect(
        rescueBookingDepthIntent(
          'Book Maria for nail care using her subscription credit',
          'create_booking',
        )?.action,
      ).toBe('create_booking_subscription_credit');
      expect(
        rescueBookingDepthIntent(
          'Book walk-in haircut tomorrow 3pm pay at venue',
          'create_booking',
        )?.action,
      ).toBe('create_booking_cash');
      expect(
        rescueBookingDepthIntent('Book Maria using her subscription', 'unknown')
          ?.action,
      ).toBe('create_booking_subscription_credit');
      expect(
        rescueBookingDepthIntent('pay in cash tomorrow 3pm', 'unknown')?.action,
      ).toBe('create_booking_cash');
      expect(
        rescueBookingDepthIntent('walk-in pay at venue 3pm', 'unknown')?.action,
      ).toBe('create_booking_cash');
      expect(
        rescueBookingDepthIntent('pay in cash tomorrow', 'unknown')
          ?.rescueReason,
      ).toBe('cash_booking_unknown');
      expect(
        rescueBookingDepthIntent('using her subscription plan visit', 'unknown')
          ?.rescueReason,
      ).toBe('subscription_credit_unknown');
    });

    it('rescues list, cancel, reschedule, mark paid, assign, and policy intents', () => {
      expect(
        rescueBookingDepthIntent(
          'Show pay at venue appointments today',
          'unknown',
        )?.action,
      ).toBe('list_cash_pending_bookings');
      expect(
        rescueBookingDepthIntent('list package visits today', 'unknown')
          ?.action,
      ).toBe('list_package_bookings');
      expect(
        rescueBookingDepthIntent('show multi-service groups today', 'unknown')
          ?.action,
      ).toBe('list_multi_service_bookings');
      expect(
        rescueBookingDepthIntent('cancel package visit b1', 'unknown')?.action,
      ).toBe('cancel_package_visit');
      expect(
        rescueBookingDepthIntent('cancel multi-service appointment', 'unknown')
          ?.action,
      ).toBe('cancel_multi_service_group');
      expect(
        rescueBookingDepthIntent(
          'reschedule package visit to Friday',
          'unknown',
        )?.action,
      ).toBe('reschedule_package_visit');
      expect(
        rescueBookingDepthIntent('move multi-service to 3pm', 'unknown')
          ?.action,
      ).toBe('reschedule_multi_service_group');
      expect(
        rescueBookingDepthIntent('mark booking paid', 'unknown')?.action,
      ).toBe('mark_paid');
      expect(
        rescueBookingDepthIntent('mark booking paid', 'payment_sweep'),
      ).toBeNull();
      expect(
        rescueBookingDepthIntent('assign room 2 to facial', 'unknown')?.action,
      ).toBe('assign_booking_resource');
      expect(
        rescueBookingDepthIntent('Can this customer still cancel?', 'unknown')
          ?.action,
      ).toBe('explain_booking_policy');
    });

    it('returns null when no rescue applies', () => {
      expect(
        rescueBookingDepthIntent('list bookings today', 'list_bookings'),
      ).toBeNull();
      expect(
        rescueBookingDepthIntent('mark booking paid', 'update_bookings'),
      ).toBeNull();
      expect(rescueBookingDepthIntent('hello world', 'unknown')).toBeNull();
    });

    it('prioritizes policy rescue before list intents', () => {
      expect(
        rescueBookingDepthIntent('booking policy for cancel rules', 'unknown')
          ?.action,
      ).toBe('explain_booking_policy');
    });
  });

  describe('filters and enrichers', () => {
    it('detects cash pending bookings', () => {
      const pending = {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
        metadata: { payAtVenue: true },
      };
      const cashMethodOnly = {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
        metadata: { paymentMethod: 'cash' },
      };
      expect(isCashPendingBooking(cashMethodOnly)).toBe(true);
      expect(
        isCashPendingBooking({
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.NOT_APPLICABLE,
          metadata: { payAtVenue: true },
        }),
      ).toBe(true);
      const notApplicable = {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.NOT_APPLICABLE,
        metadata: { paymentMethod: 'cash' },
      };
      const cancelled = { ...pending, status: BookingStatus.CANCELLED };
      const notCash = { ...pending, metadata: {} };

      expect(isCashPendingBooking(pending)).toBe(true);
      expect(isCashPendingBooking(notApplicable)).toBe(true);
      expect(isCashPendingBooking(cancelled)).toBe(false);
      expect(isCashPendingBooking(notCash)).toBe(false);
      expect(
        filterCashPendingBookings([pending, notCash, notApplicable]),
      ).toHaveLength(2);
      expect(
        isCashPendingBooking({
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          metadata: { payAtVenue: true },
        }),
      ).toBe(false);
      expect(
        isCashPendingBooking({
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PENDING,
        }),
      ).toBe(false);
    });

    it('filters package and multi-service bookings', () => {
      expect(
        filterPackageBookings([
          { packagePurchaseId: 'p1' },
          { packagePurchaseId: null },
        ]),
      ).toHaveLength(1);
      expect(
        filterMultiServiceBookings([{ multiServiceGroupId: 'g1' }, {}]),
      ).toHaveLength(1);
    });

    it('enriches cash and subscription booking metadata', () => {
      const cash = enrichCashBookingParams({
        serviceName: 'Cut',
        _bookingMetadata: { note: 'x' },
      });
      expect(cash._bookingMetadata).toMatchObject({
        payAtVenue: true,
        paymentMethod: 'cash',
        note: 'x',
      });

      const sub = enrichSubscriptionCreditParams(
        { serviceName: 'Nails', _bookingMetadata: { vip: true } },
        'sub-1',
      );
      expect(sub.useSubscriptionId).toBe('sub-1');
      expect(sub._bookingMetadata).toMatchObject({
        subscriptionCreditUsed: true,
        vip: true,
      });
    });
  });

  describe('booking policy explanation', () => {
    const baseBooking = {
      id: 'b1',
      startTime: new Date(Date.now() + 48 * 3600000),
      status: BookingStatus.CONFIRMED,
      metadata: {},
      packagePurchaseId: null as string | null,
      multiServiceGroupId: null as string | null,
      customer: { name: 'Anna' },
      service: { name: 'Facial' },
    };

    it('handles policy evaluation without explicit denial reasons', () => {
      const evaluateSpy = jest.spyOn(
        selfService,
        'evaluateCustomerBookingPolicy',
      );

      evaluateSpy
        .mockReturnValueOnce({ allowed: true })
        .mockReturnValueOnce({ allowed: false });
      const rescheduleBlocked = buildBookingPolicyExplanation({
        booking: {
          id: 'b2',
          startTime: new Date(Date.now() + 48 * 3600000),
          status: BookingStatus.CONFIRMED,
          metadata: {},
          customer: { name: 'Kim' },
          service: { name: 'Cut' },
        },
        businessSettings: {},
      });
      expect(rescheduleBlocked.cancelReason).toBeNull();
      expect(rescheduleBlocked.rescheduleReason).toBeNull();

      evaluateSpy.mockReset();
      evaluateSpy
        .mockReturnValueOnce({ allowed: false })
        .mockReturnValueOnce({ allowed: true });
      const cancelBlocked = buildBookingPolicyExplanation({
        booking: {
          id: 'b3',
          startTime: new Date(Date.now() + 48 * 3600000),
          status: BookingStatus.CONFIRMED,
          metadata: {},
          customer: { name: 'Lee' },
          service: { name: 'Cut' },
        },
        businessSettings: {},
      });
      expect(cancelBlocked.cancelReason).toBeNull();
      expect(cancelBlocked.rescheduleReason).toBeNull();
      evaluateSpy.mockRestore();
    });

    it('builds policy explanation with cancel and reschedule permissions', () => {
      const explanation = buildBookingPolicyExplanation({
        booking: baseBooking,
        businessSettings: {
          publicBooking: {
            customerSelfService: {
              allowCancel: true,
              allowReschedule: true,
              minimumNoticeHours: 24,
            },
            acceptCashPayments: true,
          },
        },
      });
      expect(explanation.canCancelOnline).toBe(true);
      expect(explanation.canRescheduleOnline).toBe(true);
      expect(explanation.cashPaymentsEnabled).toBe(true);
      expect(explanation.cancelReason).toBeNull();
      expect(explanation.rescheduleReason).toBeNull();
      expect(summarizeBookingPolicy(explanation)).toContain('Anna');

      const noCustomer = buildBookingPolicyExplanation({
        booking: { ...baseBooking, customer: null, service: null },
        businessSettings: {
          publicBooking: {
            customerSelfService: {
              allowCancel: true,
              allowReschedule: true,
              minimumNoticeHours: 24,
            },
          },
        },
      });
      expect(noCustomer.customerName).toBeNull();
      expect(noCustomer.serviceName).toBeNull();
      expect(summarizeBookingPolicy(explanation)).toContain(
        'cancel or reschedule',
      );
    });

    it('summarizes cancel-only, reschedule-only, blocked, package, and multi-service cases', () => {
      const cancelOnly = buildBookingPolicyExplanation({
        booking: baseBooking,
        businessSettings: {
          publicBooking: {
            customerSelfService: {
              allowCancel: true,
              allowReschedule: false,
              minimumNoticeHours: 24,
            },
          },
        },
      });
      expect(summarizeBookingPolicy(cancelOnly)).toContain(
        'can cancel online but not reschedule',
      );
      expect(cancelOnly.rescheduleReason).toBeTruthy();

      const rescheduleOnly = buildBookingPolicyExplanation({
        booking: baseBooking,
        businessSettings: {
          publicBooking: {
            customerSelfService: {
              allowCancel: false,
              allowReschedule: true,
              minimumNoticeHours: 24,
            },
          },
        },
      });
      expect(summarizeBookingPolicy(rescheduleOnly)).toContain(
        'can reschedule online but not cancel',
      );

      const blocked = buildBookingPolicyExplanation({
        booking: { ...baseBooking, startTime: new Date(Date.now() + 3600000) },
        businessSettings: {
          publicBooking: {
            customerSelfService: {
              allowCancel: false,
              allowReschedule: false,
              minimumNoticeHours: 48,
            },
          },
        },
        now: new Date(),
      });
      expect(summarizeBookingPolicy(blocked)).toContain(
        'cannot self-serve online',
      );
      expect(blocked.cancelReason).toBeTruthy();
      expect(blocked.rescheduleReason).toBeTruthy();

      const packageVisit = buildBookingPolicyExplanation({
        booking: { ...baseBooking, packagePurchaseId: 'pkg-1' },
        businessSettings: {
          publicBooking: {
            customerSelfService: {
              allowCancel: true,
              allowReschedule: true,
              minimumNoticeHours: 24,
            },
          },
        },
      });
      expect(summarizeBookingPolicy(packageVisit)).toContain('package visit');

      const multiService = buildBookingPolicyExplanation({
        booking: { ...baseBooking, multiServiceGroupId: 'grp-1' },
        businessSettings: {
          publicBooking: {
            customerSelfService: {
              allowCancel: true,
              allowReschedule: true,
              minimumNoticeHours: 24,
            },
          },
        },
      });
      expect(summarizeBookingPolicy(multiService)).toContain(
        'multi-service group',
      );

      const anonymous = { ...cancelOnly, customerName: null };
      expect(summarizeBookingPolicy(anonymous)).toContain('This customer');

      const noReason = {
        ...blocked,
        cancelReason: null,
        rescheduleReason: null,
      };
      expect(summarizeBookingPolicy(noReason)).toContain(
        'policy blocks changes',
      );

      const cancelOnlySummary = {
        ...cancelOnly,
        rescheduleReason: null,
      };
      expect(summarizeBookingPolicy(cancelOnlySummary)).toContain('policy');

      const rescheduleOnlySummary = {
        ...rescheduleOnly,
        cancelReason: null,
      };
      expect(summarizeBookingPolicy(rescheduleOnlySummary)).toContain('policy');
    });
  });

  it('isBookingDepthIntent recognizes registered intents', () => {
    for (const intent of BOOKING_DEPTH_INTENTS) {
      expect(isBookingDepthIntent(intent)).toBe(true);
    }
    expect(isBookingDepthIntent('create_booking')).toBe(false);
  });
});
