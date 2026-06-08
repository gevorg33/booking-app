import type { CommandSurface } from './ai-command-registry.types.js';

export const LIST_CAPABILITIES_INTENT = 'list_capabilities' as const;

/** parity-3.7 — classifier rules (dashboard). */
export const DASHBOARD_LIST_CAPABILITIES_CLASSIFIER_RULES = `- list_capabilities: READ — role-aware capability discovery; enumerate what this assistant can do for the current membership role on the dashboard. Triggers: what can you do, what are you able to do, list capabilities, what commands, help me discover features. NOT summarize_day or list_bookings.`;

/** parity-3.7 — provider mobile. */
export const PROVIDER_LIST_CAPABILITIES_CLASSIFIER_RULES = `- list_capabilities: READ — list what the provider assistant can do for this staff member on mobile. Triggers: what can you do, what can I ask, show capabilities.`;

/** parity-3.7 — customer mobile. */
export const CUSTOMER_LIST_CAPABILITIES_CLASSIFIER_RULES = `- list_capabilities: READ — list self-service actions available to this logged-in customer. Triggers: what can you do, what can I ask you, help me discover.`;

/** parity-3.7 — public booking web. */
export const PUBLIC_LIST_CAPABILITIES_CLASSIFIER_RULES = `- list_capabilities: READ — list what the booking assistant can help with before login. Triggers: what can you do, what can you help with, what services can I book.`;

export interface RoleCapabilityListingScenario {
  id: string;
  prompt: string;
  surface: CommandSurface;
  expectDetect: boolean;
}

/** parity-3.7 — NL discovery prompts per surface (≥10 variants each). */
export const ROLE_CAPABILITY_LISTING_SCENARIOS: RoleCapabilityListingScenario[] = [
  // dashboard
  {
    id: 'dash-what-can-you-do',
    prompt: 'What can you do for me?',
    surface: 'dashboard',
    expectDetect: true,
  },
  {
    id: 'dash-list-capabilities',
    prompt: 'List your capabilities for this role',
    surface: 'dashboard',
    expectDetect: true,
  },
  {
    id: 'dash-what-commands',
    prompt: 'What commands are available on the dashboard?',
    surface: 'dashboard',
    expectDetect: true,
  },
  {
    id: 'dash-discover-features',
    prompt: 'Help me discover features you support',
    surface: 'dashboard',
    expectDetect: true,
  },
  {
    id: 'dash-able-to-do',
    prompt: 'What are you able to do as my assistant?',
    surface: 'dashboard',
    expectDetect: true,
  },
  {
    id: 'dash-show-capabilities',
    prompt: 'Show me your capabilities',
    surface: 'dashboard',
    expectDetect: true,
  },
  {
    id: 'dash-help-with',
    prompt: 'What can you help me with today?',
    surface: 'dashboard',
    expectDetect: true,
  },
  {
    id: 'dash-actions-available',
    prompt: 'What actions can I run here?',
    surface: 'dashboard',
    expectDetect: true,
  },
  {
    id: 'dash-features-support',
    prompt: 'What features does this assistant support?',
    surface: 'dashboard',
    expectDetect: true,
  },
  {
    id: 'dash-how-help',
    prompt: 'How can you help me manage the business?',
    surface: 'dashboard',
    expectDetect: true,
  },
  {
    id: 'dash-not-discovery-booking',
    prompt: 'Book haircut tomorrow at 10',
    surface: 'dashboard',
    expectDetect: false,
  },
  // provider
  {
    id: 'provider-discover',
    prompt: 'What can I ask you on the provider app?',
    surface: 'provider',
    expectDetect: true,
  },
  {
    id: 'provider-what-can-you-do',
    prompt: 'What can you do on provider mobile?',
    surface: 'provider',
    expectDetect: true,
  },
  {
    id: 'provider-show-capabilities',
    prompt: 'Show capabilities for my staff role',
    surface: 'provider',
    expectDetect: true,
  },
  {
    id: 'provider-list-commands',
    prompt: 'List what commands I can use here',
    surface: 'provider',
    expectDetect: true,
  },
  {
    id: 'provider-help-discover',
    prompt: 'Help me discover what you can do',
    surface: 'provider',
    expectDetect: true,
  },
  {
    id: 'provider-able-to-do',
    prompt: 'What are you able to do for providers?',
    surface: 'provider',
    expectDetect: true,
  },
  {
    id: 'provider-what-support',
    prompt: 'What do you support on this app?',
    surface: 'provider',
    expectDetect: true,
  },
  {
    id: 'provider-how-help',
    prompt: 'How can you help with my schedule?',
    surface: 'provider',
    expectDetect: true,
  },
  {
    id: 'provider-ask-you',
    prompt: 'What can I ask you about appointments?',
    surface: 'provider',
    expectDetect: true,
  },
  {
    id: 'provider-features',
    prompt: 'What features are available for me?',
    surface: 'provider',
    expectDetect: true,
  },
  {
    id: 'provider-not-discovery',
    prompt: "Who's next on my schedule?",
    surface: 'provider',
    expectDetect: false,
  },
  // customer
  {
    id: 'customer-discover',
    prompt: 'What can you help me with?',
    surface: 'customer',
    expectDetect: true,
  },
  {
    id: 'customer-what-can-you-do',
    prompt: 'What can you do in the consumer app?',
    surface: 'customer',
    expectDetect: true,
  },
  {
    id: 'customer-list-capabilities',
    prompt: 'List your capabilities',
    surface: 'customer',
    expectDetect: true,
  },
  {
    id: 'customer-what-ask',
    prompt: 'What can I ask you about my account?',
    surface: 'customer',
    expectDetect: true,
  },
  {
    id: 'customer-discover-self-service',
    prompt: 'Help me discover self-service options',
    surface: 'customer',
    expectDetect: true,
  },
  {
    id: 'customer-how-help',
    prompt: 'How can you help me as a customer?',
    surface: 'customer',
    expectDetect: true,
  },
  {
    id: 'customer-what-support',
    prompt: 'What do you support for logged-in customers?',
    surface: 'customer',
    expectDetect: true,
  },
  {
    id: 'customer-show-features',
    prompt: 'Show me what you can do',
    surface: 'customer',
    expectDetect: true,
  },
  {
    id: 'customer-available-actions',
    prompt: "What's available for me to ask?",
    surface: 'customer',
    expectDetect: true,
  },
  {
    id: 'customer-commands',
    prompt: 'What commands can I use here?',
    surface: 'customer',
    expectDetect: true,
  },
  {
    id: 'customer-not-discovery',
    prompt: 'Cancel my booking tomorrow',
    surface: 'customer',
    expectDetect: false,
  },
  // public
  {
    id: 'public-discover',
    prompt: 'What can you do on this booking page?',
    surface: 'public',
    expectDetect: true,
  },
  {
    id: 'public-what-help',
    prompt: 'What can you help with before I log in?',
    surface: 'public',
    expectDetect: true,
  },
  {
    id: 'public-list-capabilities',
    prompt: 'List capabilities of this assistant',
    surface: 'public',
    expectDetect: true,
  },
  {
    id: 'public-what-book',
    prompt: 'What services can I book through you?',
    surface: 'public',
    expectDetect: true,
  },
  {
    id: 'public-discover-features',
    prompt: 'Help me discover what this page can do',
    surface: 'public',
    expectDetect: true,
  },
  {
    id: 'public-how-help',
    prompt: 'How can you help me book an appointment?',
    surface: 'public',
    expectDetect: true,
  },
  {
    id: 'public-what-ask',
    prompt: 'What can I ask the booking assistant?',
    surface: 'public',
    expectDetect: true,
  },
  {
    id: 'public-show-capabilities',
    prompt: 'Show your capabilities on public booking',
    surface: 'public',
    expectDetect: true,
  },
  {
    id: 'public-able-to-do',
    prompt: 'What are you able to do here?',
    surface: 'public',
    expectDetect: true,
  },
  {
    id: 'public-features',
    prompt: 'What features does this assistant have?',
    surface: 'public',
    expectDetect: true,
  },
  {
    id: 'public-not-discovery',
    prompt: 'Book facemassage tomorrow at 14:00',
    surface: 'public',
    expectDetect: false,
  },
];

export const ROLE_CAPABILITY_LISTING_PROBE_BOUNDS = {
  ownerDashboard: {
    surface: 'dashboard' as const,
    accessTier: 'owner' as const,
    planTierId: 'business' as const,
  },
  staffDashboard: {
    surface: 'dashboard' as const,
    accessTier: 'staff' as const,
    planTierId: 'solo' as const,
  },
  clientCustomer: {
    surface: 'customer' as const,
    accessTier: 'client' as const,
    planTierId: 'solo' as const,
  },
} as const;

export interface Parity37EvalScenario {
  id: string;
  prompt: string;
  surface: CommandSurface;
  accessTier: 'owner' | 'staff' | 'client';
}

export const PARITY_37_EVAL_SCENARIOS: Parity37EvalScenario[] = [
  {
    id: 'parity-37-dash-owner',
    prompt: 'What can you do for me?',
    surface: 'dashboard',
    accessTier: 'owner',
  },
  {
    id: 'parity-37-dash-staff',
    prompt: 'List your capabilities for this role',
    surface: 'dashboard',
    accessTier: 'staff',
  },
  {
    id: 'parity-37-provider',
    prompt: 'What can I ask you on the provider app?',
    surface: 'provider',
    accessTier: 'staff',
  },
  {
    id: 'parity-37-customer',
    prompt: 'What can you help me with?',
    surface: 'customer',
    accessTier: 'client',
  },
  {
    id: 'parity-37-public',
    prompt: 'What can you do on this booking page?',
    surface: 'public',
    accessTier: 'client',
  },
];
