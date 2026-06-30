import { enrichCancelMyBookingParamsFromPrompt } from './ai-cancel-my-booking.util.js';
import { enrichRescheduleMyBookingParamsFromPrompt } from './ai-reschedule-my-booking.util.js';
import {
  extractBookingIdFromPrompt,
  extractPackageNameFromPrompt,
  isCancelPackageVisitSelfPrompt,
  isReschedulePackageVisitSelfPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';

export const CUSTOMER_PACKAGE_VISIT_SELF_CLASSIFIER_RULES = `- cancel_package_visit_self: MUTATE — logged-in customer cancels one visit within a purchased service package (spa day / multi-visit bundle). Triggers: cancel|skip + my package visit/spa day/package appointment; cancel visit 2 of my package; skip next package appointment. Uses POST /me/bookings/:id/package/cancel. NOT cancel_my_booking (single appointment), NOT cancel_package_visit (staff dashboard for named customer), NOT cancel_bookings (staff bulk), NOT remove_service_from_cart (drop service from cart).
- reschedule_package_visit_self: MUTATE — logged-in customer moves a scheduled package visit to a new date/time block. Triggers: reschedule|move|change|shift + my package visit/spa day; move package visit 3 to next week; reschedule visit 2 of my package to Friday. Uses POST /me/bookings/:id/package/reschedule. NOT reschedule_my_booking (single appointment), NOT reschedule_package_visit (staff dashboard), NOT book_package (new package purchase).`;

export type PackageVisitSelfCustomerPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'cancel_package_visit_self' | 'reschedule_package_visit_self';
  rescueReason: string;
  packageName?: string;
  date?: string;
  timeSlot?: string;
  visitIndex?: number;
};

export const CANCEL_PACKAGE_VISIT_SELF_PROMPTS: readonly PackageVisitSelfCustomerPromptFixture[] =
  [
    {
      id: 'cancel-my-package-visit-customer',
      prompt: 'Cancel my package visit',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'cancel-spa-day-package-visit-customer',
      prompt: 'Cancel my spa day package visit',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'cancel-visit-2-of-package-customer',
      prompt: 'Cancel visit 2 of my package',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      visitIndex: 2,
    },
    {
      id: 'skip-next-package-appointment-customer',
      prompt: 'Skip next package appointment',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'cancel-my-package-appointment-customer',
      prompt: 'Cancel my package appointment',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'need-cancel-spa-day-customer',
      prompt: 'I need to cancel my spa day',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'cancel-upcoming-package-visit-customer',
      prompt: 'Cancel my upcoming package visit',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'cancel-this-package-visit-customer',
      prompt: 'Cancel this package visit',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'cancel-visit-3-spa-day-bundle-customer',
      prompt: 'Cancel visit 3 on my spa day bundle',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      visitIndex: 3,
      packageName: 'Spa Day',
    },
    {
      id: 'cancel-my-spa-day-customer',
      prompt: 'Cancel my spa day',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'skip-next-package-visit-customer',
      prompt: 'Skip my next package visit',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'cancel-deluxe-spa-package-visit-customer',
      prompt: 'Cancel visit 1 of my "Deluxe Spa" package',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      visitIndex: 1,
      packageName: 'Deluxe Spa',
    },
  ];

export const RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS: readonly PackageVisitSelfCustomerPromptFixture[] =
  [
    {
      id: 'reschedule-my-spa-day-customer',
      prompt: 'Reschedule my spa day',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'reschedule-my-package-visit-customer',
      prompt: 'Reschedule my package visit',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    },
    {
      id: 'move-package-visit-3-next-week-customer',
      prompt: 'Move package visit 3 to next week',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      visitIndex: 3,
    },
    {
      id: 'change-package-appointment-tomorrow-customer',
      prompt: 'Change my package appointment to tomorrow',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    },
    {
      id: 'move-spa-day-friday-2pm-customer',
      prompt: 'Move my spa day package visit to Friday 2pm',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      packageName: 'Spa Day',
      date: 'friday',
      timeSlot: '14:00',
    },
    {
      id: 'reschedule-visit-2-next-friday-customer',
      prompt: 'Reschedule visit 2 of my package to next Friday',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      visitIndex: 2,
    },
    {
      id: 'shift-package-visit-tomorrow-customer',
      prompt: 'Shift my package visit to tomorrow',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    },
    {
      id: 'move-spa-day-next-week-customer',
      prompt: 'Move my spa day to next week',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'change-package-visit-1-friday-customer',
      prompt: 'Change package visit 1 to Friday afternoon',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      visitIndex: 1,
    },
    {
      id: 'reschedule-this-package-visit-customer',
      prompt: 'Reschedule this package visit',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    },
    {
      id: 'move-upcoming-package-visit-saturday-customer',
      prompt: 'Move my upcoming package visit to Saturday',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    },
    {
      id: 'reschedule-spa-day-march-15-customer',
      prompt: 'Reschedule my spa day package to March 15 at 10am',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      packageName: 'Spa Day',
    },
  ];

export const PACKAGE_VISIT_SELF_CUSTOMER_PROMPTS: readonly PackageVisitSelfCustomerPromptFixture[] =
  [
    ...CANCEL_PACKAGE_VISIT_SELF_PROMPTS,
    ...RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS,
  ];

const PACKAGE_VISIT_SELF_ACTIONS = new Set<
  PackageVisitSelfCustomerPromptFixture['expectedAction']
>(['cancel_package_visit_self', 'reschedule_package_visit_self']);

export function extractPackageVisitIndexFromPrompt(
  prompt: string,
): number | undefined {
  const visitOf = prompt.match(/\bvisit\s+(\d+)\s+of\s+my\b/i);
  if (visitOf) return parseInt(visitOf[1], 10);
  const packageVisitN = prompt.match(/\bpackage\s+visit\s+(\d+)\b/i);
  if (packageVisitN) return parseInt(packageVisitN[1], 10);
  const visitOn = prompt.match(/\bvisit\s+(\d+)\s+on\s+my\b/i);
  if (visitOn) return parseInt(visitOn[1], 10);
  const changeVisitN = prompt.match(/\bchange\s+package\s+visit\s+(\d+)\b/i);
  if (changeVisitN) return parseInt(changeVisitN[1], 10);
  return undefined;
}

export function enrichPackageVisitSelfParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  action: PackageVisitSelfCustomerPromptFixture['expectedAction'],
  timeZone = 'UTC',
): Record<string, unknown> {
  const next =
    action === 'reschedule_package_visit_self'
      ? enrichRescheduleMyBookingParamsFromPrompt(params, prompt, timeZone)
      : enrichCancelMyBookingParamsFromPrompt(params, prompt);
  if (!next.packageName) {
    const packageName = extractPackageNameFromPrompt(prompt);
    if (packageName) next.packageName = packageName;
  }
  if (!next.bookingId) {
    const bookingId = extractBookingIdFromPrompt(prompt);
    if (bookingId) next.bookingId = bookingId;
  }
  if (next.visitIndex == null) {
    const visitIndex = extractPackageVisitIndexFromPrompt(prompt);
    if (visitIndex != null) next.visitIndex = visitIndex;
  }
  return next;
}

export function rescuePackageVisitSelfCustomerIntent(
  prompt: string,
  action: string,
): {
  action: PackageVisitSelfCustomerPromptFixture['expectedAction'];
  rescueReason: string;
} | null {
  const rescued = rescueSelfServiceBookingIntent(prompt, action);
  if (
    rescued &&
    PACKAGE_VISIT_SELF_ACTIONS.has(
      rescued.action as PackageVisitSelfCustomerPromptFixture['expectedAction'],
    )
  ) {
    return {
      action:
        rescued.action as PackageVisitSelfCustomerPromptFixture['expectedAction'],
      rescueReason: rescued.rescueReason,
    };
  }
  return null;
}

export function detectPackageVisitSelfCustomerAction(
  prompt: string,
): PackageVisitSelfCustomerPromptFixture['expectedAction'] | null {
  if (isCancelPackageVisitSelfPrompt(prompt)) {
    return 'cancel_package_visit_self';
  }
  if (isReschedulePackageVisitSelfPrompt(prompt)) {
    return 'reschedule_package_visit_self';
  }
  return null;
}
