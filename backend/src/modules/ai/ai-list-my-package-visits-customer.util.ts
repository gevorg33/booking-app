import {
  extractPackageNameFromPrompt,
  isListMyPackageVisitsCustomerPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';

export const CUSTOMER_LIST_MY_PACKAGE_VISITS_CLASSIFIER_RULES = `- list_my_package_visits: READ — logged-in customer views purchased package bundles (spa day / multi-visit packages): visits remaining, scheduled package appointments, and next visit in the bundle. Triggers: how many package visits left, visits left on my package, list my package visits, when is my next facial in the bundle, package visit progress. Requires session customerId. NOT list_my_appointments (single non-package appointments), NOT list_package_bookings (dashboard admin), NOT check_package_availability (open slots before purchase), NOT cancel_package_visit_self / reschedule_package_visit_self (mutate), NOT explain_package_visit_rules (read terms/expiry), NOT discover_packages (browse catalog before buying).`;

export type ListMyPackageVisitsCustomerPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'list_my_package_visits';
  rescueReason: 'list_package_visits';
  packageName?: string;
};

export const LIST_MY_PACKAGE_VISITS_CUSTOMER_PROMPTS: readonly ListMyPackageVisitsCustomerPromptFixture[] =
  [
    {
      id: 'how-many-package-visits-left-customer',
      prompt: 'How many package visits do I have left?',
      surface: 'customer',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'visits-left-on-my-package-customer',
      prompt: 'Visits left on my package',
      surface: 'customer',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'list-my-package-visits-customer',
      prompt: 'List my package visits',
      surface: 'customer',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'show-spa-day-package-visits-customer',
      prompt: 'Show my spa day package visits',
      surface: 'customer',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
      packageName: 'Spa Day',
    },
    {
      id: 'package-visit-status-customer',
      prompt: "What's my package visit status?",
      surface: 'customer',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'visits-remain-on-bundle-customer',
      prompt: 'How many visits remain on my bundle?',
      surface: 'customer',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'next-facial-in-bundle-customer',
      prompt: 'When is my next facial in the bundle?',
      surface: 'customer',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'package-visits-on-account-customer',
      prompt: 'Show package visits on my account',
      surface: 'customer',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'package-visits-still-have-customer',
      prompt: 'What package visits do I still have?',
      surface: 'customer',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'list-my-package-appointments-customer',
      prompt: 'List my package appointments',
      surface: 'customer',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
    {
      id: 'spa-day-visits-left-customer',
      prompt: 'How many spa day visits left?',
      surface: 'customer',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
      packageName: 'Spa Day',
    },
    {
      id: 'view-package-bundle-progress-customer',
      prompt: 'View my package bundle progress',
      surface: 'customer',
      expectedAction: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    },
  ];

export type CustomerPackageVisitSummary = {
  packagePurchaseId: string;
  packageId: string | null;
  packageName: string;
  visitsTotal: number;
  visitsRemaining: number;
  visitsCompleted: number;
  nextAppointment?: {
    bookingId: string;
    serviceName: string;
    startTime: string;
    employeeName: string;
  };
};

const TERMINAL_PACKAGE_VISIT_STATUSES = new Set([
  'cancelled',
  'completed',
  'no_show',
]);

const ACTIVE_PACKAGE_VISIT_STATUSES = new Set(['confirmed', 'pending']);

export function groupCustomerPackageVisits(
  bookings: ReadonlyArray<{
    id: string;
    packagePurchaseId?: string | null;
    packageId?: string | null;
    packageName?: string | null;
    serviceName: string;
    employeeName: string;
    startTime: string;
    status: string;
  }>,
): CustomerPackageVisitSummary[] {
  const byPurchase = new Map<string, Array<(typeof bookings)[number]>>();

  for (const booking of bookings) {
    if (!booking.packagePurchaseId) continue;
    const rows = byPurchase.get(booking.packagePurchaseId) ?? [];
    rows.push(booking);
    byPurchase.set(booking.packagePurchaseId, rows);
  }

  return [...byPurchase.entries()].map(([packagePurchaseId, rows]) => {
    const sorted = [...rows].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    const visitsRemaining = sorted.filter(
      (row) => !TERMINAL_PACKAGE_VISIT_STATUSES.has(row.status.toLowerCase()),
    ).length;
    const visitsCompleted = sorted.filter(
      (row) => row.status.toLowerCase() === 'completed',
    ).length;
    const next = sorted.find((row) =>
      ACTIVE_PACKAGE_VISIT_STATUSES.has(row.status.toLowerCase()),
    );

    return {
      packagePurchaseId,
      packageId: sorted[0].packageId ?? null,
      packageName: sorted[0].packageName ?? 'Package visit',
      visitsTotal: sorted.length,
      visitsRemaining,
      visitsCompleted,
      ...(next
        ? {
            nextAppointment: {
              bookingId: next.id,
              serviceName: next.serviceName,
              startTime: next.startTime,
              employeeName: next.employeeName,
            },
          }
        : {}),
    };
  });
}

export function enrichListMyPackageVisitsParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  const packageName = extractPackageNameFromPrompt(prompt);
  if (packageName && !next.packageName) {
    next.packageName = packageName;
  }
  return next;
}

export function rescueListMyPackageVisitsCustomerIntent(
  prompt: string,
  action: string,
): { action: 'list_my_package_visits'; rescueReason: string } | null {
  const rescued = rescueSelfServiceBookingIntent(prompt, action);
  if (rescued?.action === 'list_my_package_visits') {
    return {
      action: 'list_my_package_visits',
      rescueReason: rescued.rescueReason,
    };
  }
  return null;
}

export function detectListMyPackageVisitsCustomerAction(
  prompt: string,
): 'list_my_package_visits' | null {
  return isListMyPackageVisitsCustomerPrompt(prompt)
    ? 'list_my_package_visits'
    : null;
}
