/**
 * e2e-bug.196 — every PUBLIC_ONLY_ASSISTANT_ACTIONS entry must be dispatchable
 * on the compound / executeDeterministicIntent path (not "not supported yet").
 */
import { PUBLIC_ONLY_ASSISTANT_ACTIONS } from './ai-public-only-assistant-actions.js';

/** Actions that were missing from dispatchCompoundStepAction before the fix. */
export const E2E196_PREVIOUSLY_DEAD_COMPOUND_ACTIONS = [
  'find_services_under_budget',
  'find_evening_weekend_slots',
  'booking_help',
  'preview_multi_service_cart',
  'list_public_promotions',
  'list_provider_reviews',
  'suggest_package_block',
] as const;

export const E2E196_PUBLIC_ONLY_COMPOUND_ACTIONS = [
  ...PUBLIC_ONLY_ASSISTANT_ACTIONS,
] as const;

export type E2E196PublicCompoundLiveCase = {
  id: string;
  /** Exact compound prompt registered for deterministic decomposition. */
  prompt: string;
  /** Second step is the previously-dead (or covered) PUBLIC_ONLY action. */
  expectActions: readonly [string, string];
  forbidSummary: RegExp;
};

/** Live compound prompts that force dispatch of each previously-dead action. */
export const E2E196_PUBLIC_COMPOUND_LIVE_CASES: readonly E2E196PublicCompoundLiveCase[] =
  [
    {
      id: 'budget-then-providers',
      prompt: 'Find services under $50 and list providers',
      expectActions: ['find_services_under_budget', 'list_providers'],
      forbidSummary: /not supported yet/i,
    },
    {
      id: 'evening-weekend-then-providers',
      prompt: 'Find evening weekend slots and list providers',
      expectActions: ['find_evening_weekend_slots', 'list_providers'],
      forbidSummary: /not supported yet/i,
    },
    {
      id: 'providers-then-booking-help',
      prompt: 'List providers and walk me through booking',
      expectActions: ['list_providers', 'booking_help'],
      forbidSummary: /not supported yet/i,
    },
    {
      id: 'services-then-preview-cart',
      prompt: 'List services and preview multi service cart',
      expectActions: ['list_services', 'preview_multi_service_cart'],
      forbidSummary: /not supported yet/i,
    },
    {
      id: 'providers-then-promotions',
      prompt: 'List providers and list public promotions',
      expectActions: ['list_providers', 'list_public_promotions'],
      forbidSummary: /not supported yet/i,
    },
    {
      id: 'providers-then-reviews',
      prompt: 'List providers and list provider reviews',
      expectActions: ['list_providers', 'list_provider_reviews'],
      forbidSummary: /not supported yet/i,
    },
    {
      id: 'services-then-package-block',
      prompt: 'List services and suggest package block',
      expectActions: ['list_services', 'suggest_package_block'],
      forbidSummary: /not supported yet/i,
    },
  ];

export const E2E196_ALREADY_WIRED_COMPOUND_SMOKE: readonly E2E196PublicCompoundLiveCase[] =
  [
    {
      id: 'providers-then-availability',
      prompt: 'List providers and check availability',
      expectActions: ['list_providers', 'check_availability'],
      forbidSummary: /not supported yet/i,
    },
    {
      id: 'book-then-business-info',
      prompt: 'Book appointment and show business info',
      expectActions: ['book_appointment', 'business_info'],
      forbidSummary: /not supported yet/i,
    },
  ];
