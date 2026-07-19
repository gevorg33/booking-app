import {
  SELF_SERVICE_BOOKING_INTENTS,
  decomposeCustomerBookingCompoundPrompt,
  extractBookingIdFromPrompt,
  extractEmployeeNameFromPrompt,
  extractGiftCardCodeFromPrompt,
  extractPackageNameFromPrompt,
  extractPlanNameFromPrompt,
  buildMultiServiceAvailabilitySummary,
  enrichMultiServiceAvailabilityParams,
  extractServiceNamesFromPrompt,
  filterMultiServiceSlotsByTimePreference,
  isMultiServiceAvailabilityDiscoveryPrompt,
  rescueSelfServiceBookingIntent,
  isAddServicesToCartPrompt,
  isBookMultiServicePrompt,
  isBookPackagePrompt,
  isBookWithCashPrompt,
  isBookWithGiftCardPrompt,
  isCancelMyBookingPrompt,
  isCancelPackageVisitSelfPrompt,
  isChangeProviderOnReschedulePrompt,
  isCheckMultiServiceAvailabilityPrompt,
  isCheckPackageAvailabilityPrompt,
  isCustomerBookingCompoundPrompt,
  isExplainCancelPolicyPrompt,
  isGetManageLinkPrompt,
  isListMyAppointmentsPrompt,
  isRemoveServiceFromCartPrompt,
  isRescheduleMyBookingPrompt,
  isReschedulePackageVisitSelfPrompt,
  isSelectSubscriptionPlanPrompt,
  isSelfServiceCustomerPrompt,
  isShowCartTotalDurationPrompt,
  isSelfServiceBookingIntent,
  isUseSubscriptionCreditPrompt,
  parseCartServiceIds,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';
import { isListMyUpcomingAppointmentsPrompt } from './ai-list-my-upcoming-appointments.util.js';

describe('ai-self-service-booking.util', () => {
  describe('intent registry', () => {
    it('includes all customer booking intents', () => {
      expect(SELF_SERVICE_BOOKING_INTENTS).toContain('book_package');
      expect(SELF_SERVICE_BOOKING_INTENTS).toContain(
        'show_cart_total_duration',
      );
      expect(SELF_SERVICE_BOOKING_INTENTS).toContain(
        'explain_multi_service_cart',
      );
      for (const intent of SELF_SERVICE_BOOKING_INTENTS) {
        expect(isSelfServiceBookingIntent(intent)).toBe(true);
      }
      expect(isSelfServiceBookingIntent('create_booking')).toBe(false);
    });
  });

  describe('prompt classifiers', () => {
    it('detects package and multi-service booking prompts', () => {
      expect(isBookPackagePrompt('Book the Spa Day package for me')).toBe(true);
      expect(isBookPackagePrompt('Buy the spa day package')).toBe(true);
      expect(isBookPackagePrompt('Purchase deluxe bundle for me')).toBe(true);
      expect(isBookPackagePrompt('Create package Hair bundle')).toBe(false);
      expect(isBookMultiServicePrompt('Book massage and facial together')).toBe(
        true,
      );
      expect(
        isCheckPackageAvailabilityPrompt(
          'Is the spa package available tomorrow',
        ),
      ).toBe(true);
      expect(
        isCheckMultiServiceAvailabilityPrompt(
          'Check multi-service availability for my cart',
        ),
      ).toBe(true);
    });

    it('detects self-service cancel/reschedule prompts', () => {
      expect(isCancelMyBookingPrompt('Cancel my booking')).toBe(true);
      expect(isCancelMyBookingPrompt('Cancel booking for customer Anna')).toBe(
        false,
      );
      expect(isRescheduleMyBookingPrompt('Reschedule my appointment')).toBe(
        true,
      );
      expect(isCancelPackageVisitSelfPrompt('Cancel my package visit')).toBe(
        true,
      );
      expect(
        isReschedulePackageVisitSelfPrompt('Reschedule my spa day visit'),
      ).toBe(true);
      expect(
        isListMyUpcomingAppointmentsPrompt('List my upcoming appointments'),
      ).toBe(true);
      expect(isGetManageLinkPrompt('Get manage link for my booking')).toBe(
        true,
      );
      expect(isExplainCancelPolicyPrompt('Explain cancellation policy')).toBe(
        true,
      );
    });

    it('detects cart and payment prompts', () => {
      expect(isBookWithCashPrompt('Book haircut and pay cash')).toBe(true);
      expect(isBookWithGiftCardPrompt('Book with gift card')).toBe(true);
      expect(
        isChangeProviderOnReschedulePrompt('Change provider when I reschedule'),
      ).toBe(true);
      expect(
        isAddServicesToCartPrompt('Add massage and facial to my cart'),
      ).toBe(true);
      expect(
        isAddServicesToCartPrompt(
          'create 10 linked services and add translations in Nails category',
        ),
      ).toBe(false);
      expect(
        isCheckPackageAvailabilityPrompt('package line availability tomorrow'),
      ).toBe(false);
      expect(
        isCheckMultiServiceAvailabilityPrompt(
          'multi-service block availability',
        ),
      ).toBe(false);
      expect(isRemoveServiceFromCartPrompt('Remove facial from cart')).toBe(
        true,
      );
      // e2e-bug.144 — catalog soft-delete is not cart remove
      expect(
        isRemoveServiceFromCartPrompt('Delete the service called QA Test Trim'),
      ).toBe(false);
      expect(
        isRemoveServiceFromCartPrompt(
          'Remove the QA Test Trim service from my catalog permanently',
        ),
      ).toBe(false);
      expect(isShowCartTotalDurationPrompt('Show cart total duration')).toBe(
        true,
      );
      expect(
        isSelectSubscriptionPlanPrompt('Select the monthly membership plan'),
      ).toBe(true);
      expect(isUseSubscriptionCreditPrompt('Use my subscription credit')).toBe(
        true,
      );
    });
  });

  describe('extractors', () => {
    it('extracts booking, package, services, plan, and gift card fields', () => {
      expect(
        extractBookingIdFromPrompt('cancel booking book-abc123def456'),
      ).toBe('book-abc123def456');
      expect(extractPackageNameFromPrompt('book the "Spa Day" package')).toBe(
        'Spa Day',
      );
      expect(extractPackageNameFromPrompt('book spa day package')).toBe(
        'Spa Day',
      );
      expect(
        extractServiceNamesFromPrompt(
          'Schedule haircut and color on the same visit',
        ),
      ).toEqual(['haircut', 'color']);
      expect(
        extractServiceNamesFromPrompt('add massage and facial to my cart'),
      ).toEqual(expect.arrayContaining(['massage', 'facial']));
      expect(
        extractServiceNamesFromPrompt(
          'I want facemassage and full body massage tomorrow afternoon',
        ),
      ).toEqual(['facemassage', 'full body massage']);
      expect(extractPlanNameFromPrompt('select the "Gold" plan')).toBe('Gold');
      expect(extractGiftCardCodeFromPrompt('pay with code GIFT1234')).toBe(
        'GIFT1234',
      );
      expect(parseCartServiceIds('svc-1,svc-2')).toEqual(['svc-1', 'svc-2']);
      expect(parseCartServiceIds(['svc-1'])).toEqual(['svc-1']);
      expect(parseCartServiceIds(undefined)).toEqual([]);
      expect(parseCartServiceIds(['svc-1', ''])).toEqual(['svc-1']);
      expect(parseCartServiceIds('  ')).toEqual([]);
    });
  });

  describe('multi-service availability discovery', () => {
    it('detects want + compound services + time as availability discovery', () => {
      expect(
        isMultiServiceAvailabilityDiscoveryPrompt(
          'I want facemassage and full body massage tomorrow evening',
        ),
      ).toBe(true);
    });

    it('rescues book_multi_service to check_multi_service_availability', () => {
      expect(
        rescueSelfServiceBookingIntent(
          'I want facemassage and full body massage tomorrow evening',
          'book_multi_service',
        ),
      ).toEqual({
        action: 'check_multi_service_availability',
        rescueReason: 'multi_service_availability_discovery',
      });
    });

    it('keeps explicit book-at-time prompts on booking', () => {
      expect(
        isMultiServiceAvailabilityDiscoveryPrompt(
          'book facemassage and full body massage tomorrow at 17:00',
        ),
      ).toBe(false);
    });
  });

  describe('multi-service availability enrichment', () => {
    it('extracts tomorrow afternoon and service names from natural prompts', () => {
      expect(
        enrichMultiServiceAvailabilityParams(
          'I want facemassage and full body massage tomorrow afternoon',
          {},
          'Asia/Yerevan',
        ),
      ).toEqual(
        expect.objectContaining({
          serviceNames: ['facemassage', 'full body massage'],
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          timeOfDay: 'afternoon',
          notBeforeTime: '12:00',
        }),
      );
    });

    it('filters afternoon multi-service block slots', () => {
      const slots = filterMultiServiceSlotsByTimePreference(
        [
          {
            startTime: '2026-06-09T09:00:00.000Z',
            employeeName: 'Gevorg',
          },
          {
            startTime: '2026-06-09T14:00:00.000Z',
            employeeName: 'Mary',
          },
        ],
        { timeOfDay: 'afternoon' },
      );
      expect(slots).toHaveLength(1);
      expect(slots[0]?.employeeName).toBe('Mary');
    });

    it('formats filtered slot summaries for the assistant', () => {
      expect(
        buildMultiServiceAvailabilitySummary({
          dateKey: '2026-06-09',
          timeOfDay: 'afternoon',
          slots: [
            {
              startTime: '2026-06-09T14:00:00.000Z',
              employeeName: 'Mary Torgomyan',
            },
          ],
        }),
      ).toContain('afternoon (12:00–17:00)');
      expect(
        buildMultiServiceAvailabilitySummary({
          dateKey: '2026-06-09',
          timeOfDay: 'afternoon',
          slots: [
            {
              startTime: '2026-06-09T14:00:00.000Z',
              employeeName: 'Mary Torgomyan',
            },
          ],
        }),
      ).toContain('Mary Torgomyan');
    });
  });

  describe('rescue routing', () => {
    it('rescues unknown prompts to selfServiceBooking intents', () => {
      expect(
        rescueSelfServiceBookingIntent('Book spa day package', 'unknown')
          ?.action,
      ).toBe('book_package');
      expect(
        rescueSelfServiceBookingIntent('Cancel my booking', 'unknown')?.action,
      ).toBe('cancel_my_booking');
      expect(
        rescueSelfServiceBookingIntent('Add massage to cart', 'unknown')
          ?.action,
      ).toBe('add_services_to_cart');
    });

    it('does not rescue when action already matches', () => {
      expect(
        rescueSelfServiceBookingIntent('Book package', 'book_package'),
      ).toBeNull();
    });

    it('does not steal dashboard customer cancel', () => {
      expect(
        rescueSelfServiceBookingIntent(
          'Cancel booking for customer Anna',
          'unknown',
        ),
      ).toBeNull();
    });

    it('prefers list_my_appointments over my_appointments phrasing with list verb', () => {
      expect(
        rescueSelfServiceBookingIntent('List my appointments', 'unknown')
          ?.action,
      ).toBe('list_my_appointments');
    });
  });

  describe('compound decomposition', () => {
    it('detects multi-step customer booking commands', () => {
      expect(
        isCustomerBookingCompoundPrompt(
          'Add massage to cart and show cart total duration',
        ),
      ).toBe(true);
      const steps = decomposeCustomerBookingCompoundPrompt(
        'List my appointments and get manage link for my booking',
      );
      expect(steps.map((s) => s.action)).toEqual([
        'list_my_appointments',
        'get_manage_link',
      ]);
    });

    it('decomposes booking + policy compound flows', () => {
      const steps = decomposeCustomerBookingCompoundPrompt(
        'Check package availability and book spa day package',
      );
      expect(steps.map((s) => s.action)).toContain(
        'check_package_availability',
      );
      expect(steps.map((s) => s.action)).toContain('book_package');
    });

    it('decomposes cart compound with payment preference', () => {
      const steps = decomposeCustomerBookingCompoundPrompt(
        'Add facial to cart and book multi service with cash',
      );
      expect(steps.length).toBeGreaterThanOrEqual(2);
      expect(steps.map((s) => s.action)).toContain('add_services_to_cart');
    });

    it('returns empty for unrelated prompts', () => {
      expect(
        decomposeCustomerBookingCompoundPrompt('What is your address'),
      ).toEqual([]);
      expect(
        decomposeCustomerBookingCompoundPrompt('Add massage to cart;'),
      ).toHaveLength(1);
    });

    it('covers spa day and for-me self-service booking phrasing', () => {
      expect(isBookPackagePrompt('Book the Spa Day package for me')).toBe(true);
      expect(
        rescueSelfServiceBookingIntent(
          'Check multi-service availability',
          'unknown',
        )?.action,
      ).toBe('check_multi_service_availability');
    });

    it('exercises classifier false branches', () => {
      expect(isBookPackagePrompt('Create package Hair')).toBe(false);
      expect(isBookMultiServicePrompt('Book spa day package')).toBe(false);
      expect(isCheckPackageAvailabilityPrompt('List packages')).toBe(false);
      expect(isCheckMultiServiceAvailabilityPrompt('Book massage')).toBe(false);
      expect(
        isSelectSubscriptionPlanPrompt('Discover subscription plans'),
      ).toBe(false);
      expect(isUseSubscriptionCreditPrompt('Cancel subscription')).toBe(false);
      expect(isCancelMyBookingPrompt('Cancel package visit')).toBe(false);
      expect(isRescheduleMyBookingPrompt('Reschedule package visit')).toBe(
        false,
      );
      expect(
        isCancelPackageVisitSelfPrompt('Cancel package visit for Anna'),
      ).toBe(false);
      expect(
        isReschedulePackageVisitSelfPrompt('Reschedule for customer'),
      ).toBe(false);
      expect(isListMyAppointmentsPrompt('My subscriptions')).toBe(false);
      expect(isGetManageLinkPrompt('Manage my profile')).toBe(false);
      expect(isExplainCancelPolicyPrompt('Explain booking policy')).toBe(false);
      expect(isBookWithCashPrompt('Pay cash at visit')).toBe(false);
      expect(isBookWithGiftCardPrompt('Buy gift card')).toBe(false);
      expect(isChangeProviderOnReschedulePrompt('Change provider now')).toBe(
        false,
      );
      expect(isAddServicesToCartPrompt('Remove massage from cart')).toBe(false);
      expect(isRemoveServiceFromCartPrompt('Add massage to cart')).toBe(false);
      expect(isShowCartTotalDurationPrompt('Show cart total price')).toBe(
        false,
      );
      expect(extractEmployeeNameFromPrompt('reschedule with Maria')).toBe(
        'Maria',
      );
      expect(
        extractGiftCardCodeFromPrompt('pay with gift card'),
      ).toBeUndefined();
      expect(extractPlanNameFromPrompt('monthly billing')).toBeUndefined();
      expect(
        decomposeCustomerBookingCompoundPrompt('book; ;cancel'),
      ).toHaveLength(0);
      expect(isSelfServiceCustomerPrompt('Book package for me')).toBe(true);
      expect(
        isSelfServiceCustomerPrompt('Book package for customer Anna'),
      ).toBe(false);
      expect(
        extractServiceNamesFromPrompt('remove Facial from my cart'),
      ).toEqual(['Facial']);
      expect(
        rescueSelfServiceBookingIntent(
          'Add massage to cart and show cart total duration',
          'unknown',
        ),
      ).toBeNull();
      expect(isGetManageLinkPrompt('booking link please')).toBe(true);
      expect(isShowCartTotalDurationPrompt('cart total duration')).toBe(true);
      expect(isBookPackagePrompt('Book package for customer Anna')).toBe(false);
      expect(
        decomposeCustomerBookingCompoundPrompt('Book spa day package'),
      ).toHaveLength(1);
      expect(
        decomposeCustomerBookingCompoundPrompt('Show cart total duration'),
      ).toHaveLength(1);
      expect(extractBookingIdFromPrompt('plain text')).toBeUndefined();
      expect(isGetManageLinkPrompt('Get manage link for my booking')).toBe(
        true,
      );
      expect(isAddServicesToCartPrompt('Add massage service')).toBe(true);
      expect(isRemoveServiceFromCartPrompt('Remove massage service')).toBe(
        true,
      );
      expect(extractPackageNameFromPrompt('book the "Deluxe" package')).toBe(
        'Deluxe',
      );
      expect(extractPackageNameFromPrompt('book wellness package')).toBe(
        'wellness',
      );
      expect(
        extractServiceNamesFromPrompt('add massage, facial to my cart'),
      ).toEqual(expect.arrayContaining(['massage', 'facial']));
      expect(
        decomposeCustomerBookingCompoundPrompt(
          'Add massage to cart and what is your address',
        ),
      ).toHaveLength(1);
      expect(isCustomerBookingCompoundPrompt('')).toBe(false);
    });

    it('covers remaining util branches', () => {
      expect(isGetManageLinkPrompt('manage link')).toBe(true);
      expect(isGetManageLinkPrompt('send me the reschedule link')).toBe(true);
      expect(isGetManageLinkPrompt('cancel link for my appointment')).toBe(
        true,
      );
      expect(isGetManageLinkPrompt('self-service link please')).toBe(true);
      expect(
        isShowCartTotalDurationPrompt('how long are my selected services'),
      ).toBe(true);
      expect(
        extractServiceNamesFromPrompt('add massage, , facial to my cart'),
      ).toEqual(expect.arrayContaining(['massage', 'facial']));
      expect(
        extractServiceNamesFromPrompt('book "Swedish Massage" service'),
      ).toEqual(['Swedish Massage']);
      expect(
        extractEmployeeNameFromPrompt('change provider to Maria on reschedule'),
      ).toBe('Maria');
      expect(
        extractGiftCardCodeFromPrompt('book with gift card code GIFT1000'),
      ).toBe('GIFT1000');
      expect(
        rescueSelfServiceBookingIntent(
          'Cancel my booking',
          'cancel_my_booking',
        ),
      ).toBeNull();
      expect(
        isBookPackagePrompt("book spa package customer Maria's gift"),
      ).toBe(false);
      expect(
        isBookPackagePrompt(
          "book spa day package customer Maria's appointment",
        ),
      ).toBe(false);
      expect(isGetManageLinkPrompt('need my booking link now')).toBe(true);
      expect(isGetManageLinkPrompt('Send me link to manage my booking')).toBe(
        true,
      );
      expect(
        parseCartServiceIds(['svc-1', '', 3 as unknown as string]),
      ).toEqual(['svc-1']);

      const compound = decomposeCustomerBookingCompoundPrompt(
        'Cancel my booking booking-abcdef123456 and book with gift card code GIFT1000',
      );
      expect(compound).toHaveLength(2);
      expect(compound[0].params.bookingId).toBe('booking-abcdef123456');
      expect(compound[1].params.giftCardCode).toBe('GIFT1000');

      expect(
        decomposeCustomerBookingCompoundPrompt(
          'Add massage to cart and then totally unknown xyz nonsense',
        ),
      ).toHaveLength(1);
      expect(
        decomposeCustomerBookingCompoundPrompt(
          'change provider to Maria on reschedule and explain cancel policy',
        ),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'change_provider_on_reschedule',
            params: expect.objectContaining({ employeeName: 'Maria' }),
          }),
        ]),
      );
      expect(
        decomposeCustomerBookingCompoundPrompt('book something weird only'),
      ).toEqual([]);
      expect(decomposeCustomerBookingCompoundPrompt('hello there')).toEqual([]);
      expect(
        isSelfServiceCustomerPrompt("book spa package customer Maria's gift"),
      ).toBe(false);
      expect(isSelfServiceCustomerPrompt('Book spa day package')).toBe(true);
    });

    it('rescues all selfServiceBooking intents individually', () => {
      const prompts: Array<[string, string]> = [
        ['Book spa day package', 'book_package'],
        ['Book massage and facial together', 'book_multi_service'],
        ['Is spa package available', 'check_package_availability'],
        [
          'Check multi-service availability',
          'check_multi_service_availability',
        ],
        ['Select monthly plan', 'select_subscription_plan'],
        ['Use subscription credit', 'use_subscription_credit'],
        ['Cancel my booking', 'cancel_my_booking'],
        ['Reschedule my appointment', 'reschedule_my_booking'],
        ['Cancel my package visit', 'cancel_package_visit_self'],
        ['Reschedule my spa day', 'reschedule_package_visit_self'],
        ['List my package visits', 'list_my_package_visits'],
        ['List my appointments', 'list_my_appointments'],
        ['Get manage link', 'get_manage_link'],
        ['Explain cancel policy', 'explain_cancel_policy'],
        ['Book with cash', 'book_with_cash'],
        ['Book with gift card', 'book_with_gift_card'],
        ['Change provider on reschedule', 'change_provider_on_reschedule'],
        ['Add massage to cart', 'add_services_to_cart'],
        ['Remove facial from cart', 'remove_service_from_cart'],
        ['Show cart total duration', 'show_cart_total_duration'],
      ];
      for (const [prompt, action] of prompts) {
        expect(rescueSelfServiceBookingIntent(prompt, 'unknown')?.action).toBe(
          action,
        );
      }
    });
  });
});
