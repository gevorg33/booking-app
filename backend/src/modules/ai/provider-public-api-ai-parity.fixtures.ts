/** ai-cmd-provider-6.4.1 / 6.13 — provider bulk-shaped AI intents. Two distinct kinds:
 *  'ai-bulk-internal' — no dedicated REST bulk_* route; each resolves via repeated
 *  single-item mutations inside ProviderAiCommandService (executeCancel / executeUpdate).
 *  'ai-bulk-native' — a single REST call that natively accepts an array payload
 *  (e.g. lines[]), no internal looping. Seeds the provider-side API ↔ AI parity gate;
 *  the full audit (all provider REST endpoints) lands in ai-cmd-provider-6.14,
 *  mirroring ai-cmd-customer-6.13. */

export type ProviderPublicApiAiParityCoverage = {
  kind: 'ai-bulk-internal' | 'ai-bulk-native';
  intents: readonly string[];
  restEquivalent: string;
};

export interface ProviderPublicApiParityEntry {
  id: string;
  apiModule: string;
  coverage: ProviderPublicApiAiParityCoverage;
  notes?: string;
}

export const PROVIDER_PUBLIC_API_AI_PARITY: readonly ProviderPublicApiParityEntry[] =
  [
    {
      id: 'ppapi-cancel-bookings',
      apiModule: 'provider-mobile',
      coverage: {
        kind: 'ai-bulk-internal',
        intents: ['cancel_bookings'],
        restEquivalent: 'N× PUT …/bookings/:id/cancel',
      },
      notes:
        'Cancels every matching booking via repeated PUT …/bookings/:id/cancel calls inside ProviderAiCommandService.executeCancel',
    },
    {
      id: 'ppapi-update-bookings',
      apiModule: 'provider-mobile',
      coverage: {
        kind: 'ai-bulk-internal',
        intents: ['update_bookings'],
        restEquivalent: 'N× PUT …/bookings/:id',
      },
      notes:
        'Sets status/payment on every matching booking via repeated PUT …/bookings/:id calls inside ProviderAiCommandService.executeUpdate',
    },
    {
      id: 'ppapi-payment-sweep',
      apiModule: 'provider-mobile',
      coverage: {
        kind: 'ai-bulk-internal',
        intents: ['payment_sweep'],
        restEquivalent: 'N× PUT …/bookings/:id (paymentStatus=paid)',
      },
      notes:
        'Marks every unpaid matching booking as paid via repeated PUT …/bookings/:id calls',
    },
    {
      id: 'ppapi-mark-no-shows',
      apiModule: 'provider-mobile',
      coverage: {
        kind: 'ai-bulk-internal',
        intents: ['mark_no_shows'],
        restEquivalent: 'N× PUT …/bookings/:id (status=no_show)',
      },
      notes:
        'Marks every eligible past-due matching booking as no-show via repeated PUT …/bookings/:id calls',
    },
    {
      id: 'ppapi-set-retail-sales-lines',
      apiModule: 'retail-finance',
      coverage: {
        kind: 'ai-bulk-native',
        intents: ['set_retail_sales_lines'],
        restEquivalent: 'PUT …/retail-sales (lines[])',
      },
      notes:
        'Bulk-replaces the entire retail cart in one call via RetailPosService.setBookingRetailSales({ lines }) — genuinely bulk REST endpoint, not an internal loop (ai-cmd-provider-6.6/6.13.1)',
    },
    {
      id: 'ppapi-mark-all-notifications-read',
      apiModule: 'push-notifications',
      coverage: {
        kind: 'ai-bulk-native',
        intents: ['mark_all_notifications_read'],
        restEquivalent: 'POST …/notifications/read-all',
      },
      notes:
        'Bulk-marks all unread push notifications read in one call via ProviderPushHistoryService.markAllNotificationsRead — genuinely bulk REST endpoint, not an internal loop (ai-cmd-provider-6.8/6.13.2)',
    },
  ];
