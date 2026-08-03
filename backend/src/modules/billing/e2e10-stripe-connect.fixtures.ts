/**
 * e2e-bug.10 — online checkout blocked when the tenant has no Stripe Connect
 * account. Not an app defect: Dashboard → Billing Connect onboarding is
 * intentional. Resolved for local QA when Connect was linked on
 * `gevgas-operations-7c299253` (acct_1Tmz2M81m04mcCIP).
 */

export const E2E10_CONNECT_REQUIRED_MESSAGE =
  'Connect your Stripe account in Dashboard → Billing before accepting online payments';

export const E2E10_ONBOARDING_INCOMPLETE_MESSAGE =
  'Stripe onboarding is incomplete. Click Continue setup in Billing to add your business address and bank details.';

export const E2E10_PLATFORM_NOT_CONFIGURED_MESSAGE =
  'Online payments are not configured on the platform';

export const E2E10_SETTINGS_CASES = [
  {
    id: 'ready-with-account-id',
    settings: {
      integrations: { stripe: { connectAccountId: 'acct_1Tmz2M81m04mcCIP' } },
    },
    expectReady: true,
    expectAccountId: 'acct_1Tmz2M81m04mcCIP',
  },
  {
    id: 'empty-settings',
    settings: {},
    expectReady: false,
    expectAccountId: null as string | null,
  },
  {
    id: 'whitespace-account-id-treated-as-missing',
    settings: {
      integrations: { stripe: { connectAccountId: '   ' } },
    },
    expectReady: false,
    expectAccountId: null as string | null,
  },
  {
    id: 'missing-integrations-object',
    settings: { integrations: {} },
    expectReady: false,
    expectAccountId: null as string | null,
  },
] as const;

export const E2E10_ACCOUNT_ID_CASES = [
  { id: 'valid-acct', value: 'acct_1Tmz2M81m04mcCIP', valid: true },
  { id: 'valid-short', value: 'acct_abc123', valid: true },
  { id: 'missing-prefix', value: '1Tmz2M81m04mcCIP', valid: false },
  { id: 'empty', value: '', valid: false },
  { id: 'trimmed-valid', value: '  acct_1Tmz  ', valid: true },
  { id: 'internal-space-invalid', value: 'acct_1 Tmz', valid: false },
] as const;

export const E2E10_LIVE_CASES = [
  {
    id: 'profile-online-payments-enabled',
    description:
      'gevgas-operations public profile reports onlinePaymentsEnabled:true (Connect linked)',
  },
  {
    id: 'full-prepay-service-online-flag',
    description:
      'Face Pilling (prepaymentMode:full) exposes onlinePaymentEnabled:true',
  },
  {
    id: 'pay-at-visit-service-not-online',
    description:
      'Face Plasma (prepaymentMode:none) exposes onlinePaymentEnabled:false',
  },
  {
    id: 'create-checkout-session-with-connect',
    description:
      'POST /bookings/checkout creates a Stripe session when Connect is ready',
  },
  {
    id: 'clinic-without-connect-online-disabled',
    description:
      'qa-test-clinic public profile reports onlinePaymentsEnabled:false',
  },
  {
    id: 'clinic-checkout-clear-connect-message',
    description:
      'Checkout without Connect returns clear Dashboard → Billing message (not opaque 500)',
  },
] as const;
