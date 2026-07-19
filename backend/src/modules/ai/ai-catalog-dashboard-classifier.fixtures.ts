/** Dashboard catalog classifier rules (services, packages, tours, clinic catalog). */
export const CATALOG_DASHBOARD_CLASSIFIER_RULES = `- For adding a new service type to the catalog (add service, create service, new offering), use action "create_service" for ONE service, or "create_services" for TWO OR MORE.
- create_service requires serviceName, durationMinutes, and price at minimum. Extract duration from phrases like "60 minutes" or "1 hour" (60). Extract price from "$50", "50 USD", etc. Optional prepaymentMode (none|full|deposit) and depositPercent when the user sets online payment on the new service ("Add massage $80 with 50% online prepayment"). When the user scopes the new service to a catalog category ("under category Massage", "in service category: Hair"), set categoryName to that category entity — NOT serviceCategory (keyword filter). For create_service/create_services, set serviceName to the NEW offering name exactly as the user wrote it — do NOT map to an existing Available services entry even when wording is similar. The system auto-translates new service titles to Armenian (hy) and Russian (ru) when those locales are enabled — optional localizedNames in params override auto-translation per locale.
- update_service: move or assign ONE existing catalog service into a service category entity. "Move Neck Massage under service category: Massage" → serviceName=Neck Massage, categoryName=Massage. NOT create_service (new row), NOT bulk_create_catalog, NOT assign_employee_services (provider skills), NOT update_service_prices (bulk %), NOT update_service_duration_buffer (duration/buffer minutes).
- update_service_duration_buffer: bulk or scoped update of service durationMinutes and/or bufferMinutes. "Set all massage services to 60 minutes with 15 min buffer" → categoryName=massage, durationMinutes=60, bufferMinutes=15. NOT update_service (category move only), NOT create_service, NOT configure_tour_service (tour durationDays).
- create_services requires a "services" array — each entry needs serviceName, durationMinutes, and price. Optional prepaymentMode/depositPercent per row or a global policy on the bulk prompt ("all with 50% online prepayment"). Use when the user lists multiple services, paste a menu, or says "add these services".
- Example bulk: "Add services: facemassage 60min $50, haircut 30min $25, manicure 45min $40" → action create_services with services=[{serviceName:"facemassage",durationMinutes:60,price:50}, ...].
- Do not use create_service when booking an appointment — that is create_booking.
- bulk_create_catalog: create a category AND multiple services in one command (e.g. "Create category Hair with Women's cut 60m $65, Men's cut 30m $35").
- create_service_category: add a single category; optional placeholderCount for stub services. "Add a new service category called Wellness" → categoryName=Wellness. NOT create_promo_code (no discount/promo language — "called X" here is the category name, not a promo code).
- update_service_category: rename or edit an existing category (categoryName to identify it, newName/description/sortOrder to change). NOT create_service_category (new row), NOT update_service (moves a service between categories).
- delete_service_category: remove a category (categoryName). Soft-deletes (deactivates) the category, same as the dashboard's delete button. NOT deactivate_service (services, not categories).
- create_package / update_package / deactivate_package / activate_package / duplicate_package: service package CRUD — a priced multi-service catalog offering sold together (e.g. "Create a new package called QA Test Bundle combining facemassage and Neck Massage for 80 dollars" → create_package with packageName + serviceNames). NOT package visit booking (create_package_booking). NOT create_gift_card_bundle (gift-card product; requires explicit "gift card" wording). activate_package re-enables a previously deactivated package (packageName or packageId).
- create_subscription_plan / update_subscription_plan / deactivate_subscription_plan / activate_subscription_plan: membership plan CRUD for a service. activate_subscription_plan re-enables a previously deactivated plan (planName or planId).
- assign_subscription_to_customer: admin enrolls a customer on a plan (customerName + planName).
- configure_gift_card_products: enable presets and purchasable service cards (presetAmounts, serviceName).
- create_gift_card_bundle: gift-card product that bundles services onto a purchasable gift card (requires "gift card" + bundleName + serviceNames). NOT create_package — "package called … combining services for $X" is create_package even if the name contains "Bundle".
- configure_multi_service_settings: enable multi-service booking limits (maxServiceCount, maxDurationMinutes).
- configure_service_featured: mark/unmark featured services and set/clear serviceTier (standard|premium) metadata on existing catalog services. NOT configure_service_deposit_policy (deposit scoped to featured/tier), NOT update_service (move category).
- bulk_assign_services_category: move many catalog services into a target category (all services, source category, or named list). NOT update_service (single service move), NOT assign_employee_services (provider skills).
- configure_package_online_payment: set online prepayment on services included in catalog package(s). NOT configure_service_online_payment (service scope), NOT update_package (discount/items).
- configure_tour_service: enable tour mode and set tour metadata on one service (maxGroupSize, difficulty, durationDays, meetingPoint, coverImage, includedItems). "Mark City Tour as a tour with max 12 people" → serviceName, enableTour, maxGroupSize. NOT create_service or configure_multi_service_settings.
- explain_tour_services: READ-ONLY — list tour catalog services (group sizes, cover images) and upcoming tour bookings with pax / tourStartDate–tourEndDate. Optional serviceName filter and daysAhead. NOT configure_tour_service (mutate), NOT explain_tour_booking_record (one booking's stored metadata), or list_bookings (all appointment types).
- explain_tour_booking_record: READ-ONLY — explain one tour booking's paxCount, tourStartDate, tourEndDate, specialRequirements, and provider calendar multi-day span (vert-tour-1.10). Optional bookingId or customerName. NOT explain_tour_services (catalog/upcoming list), NOT explain_tour_calendar_span (general calendar UI), NOT list_bookings (all types), NOT explain_booking_policy (cancellation/deposit).
- explain_tour_calendar_span: READ-ONLY — explain vert-tour-1.10 provider calendar rendering: multi-day spans, service colors, clipped weeks, stacked departure lanes. Optional serviceName or weekStartDate. NOT explain_tour_booking_record (one booking metadata), NOT list_tour_calendar_week, NOT list_upcoming_tour_departures, NOT explain_tour_services (catalog list).
- list_tour_calendar_week: READ-ONLY — summarize confirmed tour departures visible on a provider calendar week (dates, pax, service). Optional employeeName, serviceName, weekStartDate. NOT explain_tour_calendar_span, NOT list_upcoming_tour_departures, NOT show_appointments, NOT explain_tour_services.
- list_upcoming_tour_departures: READ-ONLY — summarize confirmed tour bookings grouped by departure date with booked pax and remaining capacity (max group − booked pax). Optional serviceName and daysAhead. NOT explain_tour_services (catalog metadata or per-guest booking lines), NOT explain_tour_calendar_span, NOT list_tour_calendar_week, NOT list_bookings (all appointment types).
- apply_tour_playbook: MUTATE — tour_operator shortcut to seed tour vertical playbook catalog (Day/Multi-Day/Private tours) and Tour operating hours 08:00–18:00 schedule. "Apply tour playbook" / "Set up tour operator starter catalog and schedule". NOT bulk_create_catalog or apply_schedule.
- configure_clinic_service: MUTATE — set clinic metadata on one catalog service (serviceType=consultation|lab_test|procedure, requiresFasting, preparationNotes). "Mark CBC as a lab test requiring fasting" → serviceName, serviceType=lab_test, requiresFasting=true. NOT create_service, NOT create_test_order (patient lab order), NOT explain_clinic_services (read list).
- explain_clinic_services: READ-ONLY — summarize clinic catalog: departments, consultation vs lab_test vs procedure counts, fasting requirements. Optional serviceName filter. NOT configure_clinic_service (mutate), NOT explain_clinic_booking (consumer checkout fields), NOT list_services (general catalog).
- apply_clinic_playbook: MUTATE — clinic|polyclinic|beauty_clinic|dental shortcut to seed clinic vertical playbook catalog and clinic operating hours schedule. "Apply clinic playbook" / "Set up polyclinic starter catalog and schedule". NOT bulk_create_catalog or apply_schedule.
- set_service_compatibility: block two services from same visit (incompatibleServiceNames).
- deactivate_service: soft-delete / hide a catalog service (same as dashboard Delete — there is NO delete_service intent). Triggers: delete/remove/deactivate/hide + service; "Delete the service called X"; "Remove X service from my catalog permanently". Set serviceName. NOT remove_service_from_cart (customer cart), NOT unassign_employee_services (provider skills), NOT deactivate_employee (team roster), NOT deactivate_package, NOT delete_service_category (categories). Category bulk → categoryName + allInCategory=true ("Deactivate all dental services").
  - "Delete the service called QA Test Trim" → deactivate_service, serviceName="QA Test Trim"
  - "Remove the QA Test Trim service from my catalog permanently" → deactivate_service, serviceName="QA Test Trim"
  - "Deactivate the QA Test Trim service" → deactivate_service, serviceName="QA Test Trim"`;

/** e2e-bug.144 — natural delete/remove must rescue to deactivate_service (soft-delete). */
export const CATALOG_E2E144_DEACTIVATE_SERVICE_SCENARIOS = [
  {
    id: 'delete-service-called',
    prompt: 'Delete the service called QA Test Trim',
    expectedAction: 'deactivate_service' as const,
    serviceName: 'QA Test Trim',
    stealActions: [
      'remove_service_from_cart',
      'unassign_employee_services',
      'deactivate_employee',
      'unknown',
      'react_agent',
    ],
  },
  {
    id: 'remove-service-from-catalog-permanently',
    prompt: 'Remove the QA Test Trim service from my catalog permanently',
    expectedAction: 'deactivate_service' as const,
    serviceName: 'QA Test Trim',
    stealActions: [
      'unassign_employee_services',
      'remove_service_from_cart',
      'unknown',
      'react_agent',
    ],
  },
  {
    id: 'delete-service-disambiguated',
    prompt:
      'Delete service QA Test Trim from the business catalog. This is a catalog management delete_service action, not a cart or employee action.',
    expectedAction: 'deactivate_service' as const,
    serviceName: 'QA Test Trim',
    stealActions: [
      'deactivate_employee',
      'remove_service_from_cart',
      'unassign_employee_services',
      'unknown',
      'react_agent',
    ],
  },
  {
    id: 'deactivate-service-verbatim',
    prompt: 'Deactivate the QA Test Trim service',
    expectedAction: 'deactivate_service' as const,
    serviceName: 'QA Test Trim',
    stealActions: ['unknown', 'react_agent'],
  },
] as const;
