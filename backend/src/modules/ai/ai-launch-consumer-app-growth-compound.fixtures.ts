import type { LaunchConsumerAppGrowthStepAction } from './ai-launch-consumer-app-growth-compound.util.js';

export type LaunchConsumerAppGrowthCompoundFixture = {
  id: string;
  prompt: string;
  orderedActions: readonly LaunchConsumerAppGrowthStepAction[];
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_PROMPTS: LaunchConsumerAppGrowthCompoundFixture[] = [
  {
    id: 'consumer-app-growth-e2e-en',
    prompt:
      'Launch consumer app growth end-to-end: explain our tenant app install QR, regenerate the growth QR code, and configure marketing registration email notifications',
    orderedActions: [
      'explain_tenant_app_install',
      'regenerate_tenant_app_install_qr',
      'configure_marketing_registration_email',
    ] as const,
    expectedParams: {
      emailOnNewCustomerRegistration: true,
    },
    misclassifiedAction: 'explain_tenant_app_install',
  },
  {
    id: 'customer-app-growth-launch-spa-en',
    prompt:
      'Launch customer app growth for our spa — explain get-app link, refresh growth QR, enable marketing registration emails to team@salon.com',
    orderedActions: [
      'explain_tenant_app_install',
      'regenerate_tenant_app_install_qr',
      'configure_marketing_registration_email',
    ] as const,
    expectedParams: {
      emailOnNewCustomerRegistration: true,
      marketingTeamEmails: ['team@salon.com'],
    },
    misclassifiedAction: 'regenerate_tenant_app_install_qr',
  },
  {
    id: 'growth-launch-from-scratch-en',
    prompt:
      'Set up consumer app growth from scratch; explain app install landing page; regenerate tenant app install QR; configure marketing registration email',
    orderedActions: [
      'explain_tenant_app_install',
      'regenerate_tenant_app_install_qr',
      'configure_marketing_registration_email',
    ] as const,
    misclassifiedAction: 'configure_marketing_registration_email',
  },
  {
    id: 'end-to-end-app-growth-salon-en',
    prompt:
      'End-to-end consumer app growth for the salon — explain tenant app install, regenerate get-app QR, configure new customer registration email alerts',
    orderedActions: [
      'explain_tenant_app_install',
      'regenerate_tenant_app_install_qr',
      'configure_marketing_registration_email',
    ] as const,
    expectedParams: {
      emailOnNewCustomerRegistration: true,
    },
  },
  {
    id: 'growth-distribution-launch-en',
    prompt:
      'Consumer app growth launch: show our get-app distribution QR, refresh the app install QR, and set up marketing registration email notifications',
    orderedActions: [
      'explain_tenant_app_install',
      'regenerate_tenant_app_install_qr',
      'configure_marketing_registration_email',
    ] as const,
  },
  {
    id: 'launch-growth-semicolon-en',
    prompt:
      'Launch app growth: explain tenant app install QR; regenerate growth QR; configure marketing registration email',
    orderedActions: [
      'explain_tenant_app_install',
      'regenerate_tenant_app_install_qr',
      'configure_marketing_registration_email',
    ] as const,
  },
  {
    id: 'salon-consumer-app-growth-en',
    prompt:
      'Salon consumer app growth setup — explain where customers download our app, regenerate venue QR, enable marketing registration emails',
    orderedActions: [
      'explain_tenant_app_install',
      'regenerate_tenant_app_install_qr',
      'configure_marketing_registration_email',
    ] as const,
  },
  {
    id: 'growth-tab-launch-complete-en',
    prompt:
      'Complete growth tab launch — explain integrations growth QR, regenerate tenant app install assets, configure registration email for marketing team',
    orderedActions: [
      'explain_tenant_app_install',
      'regenerate_tenant_app_install_qr',
      'configure_marketing_registration_email',
    ] as const,
  },
  {
    id: 'get-app-growth-onboarding-en',
    prompt:
      'Onboard consumer app growth — explain get-app landing link, refresh our growth QR code, and configure marketing registration email notifications',
    orderedActions: [
      'explain_tenant_app_install',
      'regenerate_tenant_app_install_qr',
      'configure_marketing_registration_email',
    ] as const,
  },
  {
    id: 'launch-growth-then-registration-en',
    prompt:
      'Launch consumer app growth and then configure marketing registration email; explain tenant app install QR; regenerate growth QR',
    orderedActions: [
      'explain_tenant_app_install',
      'regenerate_tenant_app_install_qr',
      'configure_marketing_registration_email',
    ] as const,
  },
  {
    id: 'customer-download-growth-setup-en',
    prompt:
      'Customer app growth setup end-to-end: explain app install link for clients, regenerate consumer app install QR, enable marketing registration email to growth@venue.com',
    orderedActions: [
      'explain_tenant_app_install',
      'regenerate_tenant_app_install_qr',
      'configure_marketing_registration_email',
    ] as const,
    expectedParams: {
      emailOnNewCustomerRegistration: true,
      marketingTeamEmails: ['growth@venue.com'],
    },
  },
];

export const LAUNCH_CONSUMER_APP_GROWTH_EN_SCENARIO_IDS =
  LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_PROMPTS.map((row) => row.id);

export const LAUNCH_CONSUMER_APP_GROWTH_RESCUE_SCENARIOS =
  LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_PROMPTS.filter(
    (scenario) =>
      'misclassifiedAction' in scenario && !!scenario.misclassifiedAction,
  ) as Array<
    LaunchConsumerAppGrowthCompoundFixture & { misclassifiedAction: string }
  >;
