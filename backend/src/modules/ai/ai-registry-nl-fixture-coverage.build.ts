import type { CommandSurface } from './ai-command-registry.types.js';

export type RegistryNlFixtureGatedIntent = {
  intent: string;
  surface: CommandSurface;
};

/**
 * Ratchet subset for ai-cmd-ext-gap-5 — only intents verified ≥10 NL prompts today.
 * Expand as domain fixture corpora grow; full gap list comes from the report test.
 */
export const REGISTRY_NL_FIXTURE_COVERAGE_GATED: readonly RegistryNlFixtureGatedIntent[] =
  [
    // Discover + booking (dashboard)
    { intent: 'list_services', surface: 'dashboard' },
    { intent: 'check_providers_for_service', surface: 'dashboard' },
    { intent: 'book_nearest_slot', surface: 'dashboard' },
    { intent: 'create_booking', surface: 'dashboard' },
    // Payments (dashboard)
    { intent: 'configure_service_online_payment', surface: 'dashboard' },
    // Clinic ext (dashboard)
    { intent: 'upload_patient_result', surface: 'dashboard' },
    // Customer/public discovery spine
    { intent: 'list_services', surface: 'public' },
    { intent: 'check_availability', surface: 'public' },
    { intent: 'book_appointment', surface: 'public' },
    { intent: 'list_services', surface: 'customer' },
    { intent: 'check_providers_for_service', surface: 'customer' },
    { intent: 'book_nearest_slot', surface: 'customer' },
    { intent: 'book_package', surface: 'customer' },
    { intent: 'add_services_to_cart', surface: 'customer' },
    { intent: 'list_my_appointments', surface: 'customer' },
    { intent: 'list_my_test_results', surface: 'customer' },
    { intent: 'book_lab_collection', surface: 'customer' },
    { intent: 'list_my_lab_booking_requests', surface: 'customer' },
  ];
