import type { CommandSurface } from './ai-command-registry.types.js';

export interface ProductGuideRescueScenario {
  id: string;
  surface: CommandSurface;
  prompt: string;
  fromAction: string;
  expectedAction: string;
  expectedReason?: string;
}

export interface EnrichGuideTopicScenario {
  id: string;
  surface: CommandSurface;
  prompt: string;
  route?: string;
  topicId?: string;
  activationStep?: 'welcome' | 'salon' | 'service' | 'slot' | 'confirm';
  expectedTopicId: string;
}

/** Cross-surface rescue scenarios for ai-guide-1.6.3 (pipe-1 rescue entry paths). */
export const PRODUCT_GUIDE_RESCUE_SCENARIOS: readonly ProductGuideRescueScenario[] =
  [
    {
      id: 'dashboard-misroute-online-payment',
      surface: 'dashboard',
      prompt: 'Where do I turn on online payment for a service?',
      fromAction: 'configure_service_online_payment',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_navigation',
    },
    {
      id: 'dashboard-heuristic-unknown-screen',
      surface: 'dashboard',
      prompt: 'What can I do on this page?',
      fromAction: 'unknown',
      expectedAction: 'explain_current_screen',
      expectedReason: 'product_guide_screen',
    },
    {
      id: 'provider-staff-invite',
      surface: 'provider',
      prompt: 'What is this staff invite link for?',
      fromAction: 'unknown',
      expectedAction: 'explain_staff_invite',
      expectedReason: 'provider_product_guide',
    },
    {
      id: 'provider-misroute-mark-paid',
      surface: 'provider',
      prompt: 'Where do I mark a client as paid?',
      fromAction: 'mark_paid',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_navigation',
    },
    {
      id: 'customer-gift-cards',
      surface: 'customer',
      prompt: 'How do gift cards work in the app?',
      fromAction: 'unknown',
      expectedAction: 'explain_app_feature',
      expectedReason: 'customer_app_guide',
    },
    {
      id: 'customer-profile',
      surface: 'customer',
      prompt: 'How do I update my profile?',
      fromAction: 'unknown',
      expectedAction: 'guide_user_flow',
      expectedReason: 'customer_app_guide',
    },
    {
      id: 'public-booking-help',
      surface: 'public',
      prompt: 'Walk me through booking step by step',
      fromAction: 'unknown',
      expectedAction: 'booking_help',
      expectedReason: 'public_booking_help',
    },
    {
      id: 'public-checkout-walkthrough',
      surface: 'public',
      prompt: 'Walk me through checkout and payment',
      fromAction: 'explain_checkout_tax',
      expectedAction: 'booking_help',
      expectedReason: 'public_booking_help',
    },
    {
      id: 'public-misroute-book-guide',
      surface: 'public',
      prompt: 'How do I book an appointment on this page?',
      fromAction: 'book_appointment',
      expectedAction: 'booking_help',
      expectedReason: 'public_booking_help',
    },
  ] as const;

/** Cross-surface topic enrichment for ai-guide-1.6.3. */
export const ENRICH_GUIDE_TOPIC_SCENARIOS: readonly EnrichGuideTopicScenario[] =
  [
    {
      id: 'dashboard-schedule-route',
      surface: 'dashboard',
      prompt: 'How do I set up weekly schedule templates?',
      route: '/dashboard/schedule',
      expectedTopicId: 'dashboard.core.schedule',
    },
    {
      id: 'dashboard-similar-prompt',
      surface: 'dashboard',
      prompt: 'Walk me through creating a staff schedule for next week',
      expectedTopicId: 'dashboard.core.schedule',
    },
    {
      id: 'dashboard-explicit-topic',
      surface: 'dashboard',
      prompt: 'Help me with AI ops',
      topicId: 'dashboard.ai.ops',
      expectedTopicId: 'dashboard.ai.ops',
    },
    {
      id: 'provider-today-tab',
      surface: 'provider',
      prompt: "What's on my schedule for today?",
      route: '/tabs/today',
      expectedTopicId: 'provider-appointments',
    },
    {
      id: 'provider-staff-invite-route',
      surface: 'provider',
      prompt: 'What happens when I tap Accept invite?',
      route: '/accept-invite',
      expectedTopicId: 'provider-staff-invite',
    },
    {
      id: 'customer-packages',
      surface: 'customer',
      prompt: 'How do gift cards work?',
      route: '/s/packages',
      expectedTopicId: 'consumer-packages-gift-cards',
    },
    {
      id: 'customer-activation-welcome',
      surface: 'customer',
      prompt: 'What happens on the welcome screen?',
      activationStep: 'welcome',
      expectedTopicId: 'consumer-activation-welcome',
    },
    {
      id: 'public-checkout',
      surface: 'public',
      prompt: 'What do I enter on checkout?',
      route: '/book/checkout',
      expectedTopicId: 'public-checkout',
    },
    {
      id: 'public-services-keywords',
      surface: 'public',
      prompt: 'How do I compare service duration?',
      expectedTopicId: 'public-booking-services',
    },
  ] as const;
