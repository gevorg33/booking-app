/** ai-cmd-dashboard-6.19 — every dashboard REST endpoint (from the ai-cmd-dashboard-6.1..6.18
 *  audit tables) maps to a dashboard AI intent, an AI-native bulk resolution, or is explicitly
 *  marked `no-ai`. Mirrors the customer-side gate in `customer-public-api-ai-parity.fixtures.ts`
 *  (ai-cmd-customer-6.13) and the provider-side gate in `provider-public-api-ai-parity.fixtures.ts`
 *  (ai-cmd-provider-6.14). Unlike the customer/provider apps, the dashboard frontend has no single
 *  centralized `public-api.ts` — REST calls are scattered across many page files — so each row here
 *  keys off the REST path(s) from the audit table rather than a frontend export name. */

export type DashboardApiAiParityCoverage =
  | { kind: 'dashboard-ai'; intents: readonly string[] }
  | { kind: 'ai-bulk-internal'; intents: readonly string[] }
  | { kind: 'no-ai'; reason: string }
  | { kind: 'no-ai-binary'; reason: string }
  | { kind: 'no-ai-realtime'; reason: string };

export interface DashboardApiParityEntry {
  id: string;
  restPath: string;
  apiModule: string;
  coverage: DashboardApiAiParityCoverage;
  notes?: string;
}

export const DASHBOARD_API_AI_PARITY: readonly DashboardApiParityEntry[] = [
  // ai-cmd-dashboard-6.1 — AI gateway, agents & suggestions
  {
    id: 'dapi-ai-command-gateway',
    restPath:
      'POST ai/command, ai/command/tasks/:id/approve, ai/command/steps/:id/retry',
    apiModule: 'ai-command',
    coverage: {
      kind: 'no-ai',
      reason:
        'Meta-endpoint that dispatches to every DASHBOARD_INTENTS entry; not itself bound to one intent',
    },
  },
  {
    id: 'dapi-ai-suggestions',
    restPath:
      'GET ai/suggestions, ai/capabilities, ai/settings, ai/analytics, ai/audit, ai/briefing, ai/weekly-report',
    apiModule: 'ai-command',
    coverage: { kind: 'dashboard-ai', intents: ['explain_ai_settings'] },
    notes:
      'Read helpers sparse — suggestions surface as chips, not a distinct AI command',
  },
  {
    id: 'dapi-ai-settings-put',
    restPath: 'PUT ai/settings',
    apiModule: 'ai-command',
    coverage: {
      kind: 'no-ai',
      reason:
        'Autopilot/macros panel overlaps proposed configure_ai_autopilot (2.21), not yet a shipped intent',
    },
  },
  {
    id: 'dapi-agent-tasks',
    restPath: 'GET agents/tasks, agents/tasks/pending, agents/tasks/:id/preview',
    apiModule: 'ai-command',
    coverage: { kind: 'dashboard-ai', intents: ['list_agent_tasks'] },
  },
  {
    id: 'dapi-agent-rebook-all',
    restPath: 'POST agents/tasks/:id/rebook-all',
    apiModule: 'ai-command',
    coverage: { kind: 'dashboard-ai', intents: ['rebook_all_from_agent_task'] },
  },
  {
    id: 'dapi-agent-undo-latest',
    restPath: 'GET agents/tasks/undo-latest/preview, POST agents/tasks/undo-latest',
    apiModule: 'ai-command',
    coverage: { kind: 'dashboard-ai', intents: ['undo_latest_agent_task'] },
  },

  // ai-cmd-dashboard-6.2 — Business core, overview & onboarding
  {
    id: 'dapi-business-profile',
    restPath: 'GET/PUT businesses/:id, PUT businesses/:id/profile',
    apiModule: 'business',
    coverage: { kind: 'dashboard-ai', intents: ['update_business_profile'] },
  },
  {
    id: 'dapi-dashboard-overview',
    restPath: 'GET businesses/:id/dashboard/overview',
    apiModule: 'business',
    coverage: { kind: 'dashboard-ai', intents: ['get_dashboard_overview'] },
  },
  {
    id: 'dapi-onboarding-status',
    restPath:
      'GET onboarding/status, onboarding/business-types, onboarding/vertical-playbook',
    apiModule: 'onboarding',
    coverage: { kind: 'dashboard-ai', intents: ['explain_onboarding_status'] },
  },
  {
    id: 'dapi-onboarding-actions',
    restPath:
      'POST onboarding/business-type, recommend-catalog, apply-catalog, apply-schedule, skip-schedule, apply-playbook, complete',
    apiModule: 'onboarding',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'set_business_type',
        'recommend_catalog',
        'apply_onboarding_catalog',
        'apply_onboarding_schedule',
        'skip_onboarding_schedule',
        'apply_onboarding_playbook',
        'complete_onboarding',
      ],
    },
  },
  {
    id: 'dapi-invitations-create',
    restPath: 'POST businesses/:id/invitations',
    apiModule: 'business',
    coverage: { kind: 'dashboard-ai', intents: ['invite_staff_member'] },
  },
  {
    id: 'dapi-invitations-accept',
    restPath: 'POST invitations/:token/accept',
    apiModule: 'business',
    coverage: {
      kind: 'no-ai',
      reason: 'Auth bootstrap for an invited user, not an in-session assistant action',
    },
  },

  // ai-cmd-dashboard-6.3 — Bookings, appointments & retail POS
  {
    id: 'dapi-bookings-list',
    restPath: 'GET bookings, bookings/dashboard, bookings/:id',
    apiModule: 'booking',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['list_bookings', 'show_appointments'],
    },
    notes:
      'open_booking_detail navigate is UI-only, out of scope — IDs already returned by these reads',
  },
  {
    id: 'dapi-bookings-availability',
    restPath: 'GET bookings/availability',
    apiModule: 'booking',
    coverage: { kind: 'dashboard-ai', intents: ['check_availability'] },
  },
  {
    id: 'dapi-bookings-create',
    restPath: 'POST bookings, bookings/quote',
    apiModule: 'booking',
    coverage: { kind: 'dashboard-ai', intents: ['create_booking'] },
  },
  {
    id: 'dapi-bookings-update-cancel',
    restPath: 'PUT bookings/:id, bookings/:id/cancel',
    apiModule: 'booking',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['update_bookings', 'cancel_bookings', 'bulk_smart_cancel'],
    },
  },
  {
    id: 'dapi-bookings-retail-sales',
    restPath: 'GET/PUT bookings/:id/retail-sales',
    apiModule: 'retail-finance',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'add_retail_sale_to_booking',
        'remove_retail_line',
        'set_retail_sales_lines',
      ],
    },
  },
  {
    id: 'dapi-retail-pos-products',
    restPath: 'GET retail-pos/products',
    apiModule: 'retail-finance',
    coverage: {
      kind: 'no-ai',
      reason:
        'REST endpoint has no text-search param (listSellableProducts takes only businessId); suggest_retail_upsell already superset-covers this via service-link ranking — confirmed false gap, not a genuine intent target',
    },
  },
  {
    id: 'dapi-pre-visit-intake-booking',
    restPath: 'GET/POST bookings/:id/pre-visit-intake',
    apiModule: 'clinic-pre-visit-intake',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['assign_pre_visit_intake_to_booking'],
    },
  },

  // ai-cmd-dashboard-6.4 — Services, categories, packages & multi-service
  {
    id: 'dapi-services-crud',
    restPath: 'GET/POST/PUT/DELETE services, services/:id',
    apiModule: 'catalog',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'create_service',
        'update_service',
        'deactivate_service',
        'configure_service_online_payment',
      ],
    },
    notes:
      'DELETE is a soft-delete via the same ServiceService.remove() call as deactivate_service — no separate delete_service intent needed',
  },
  {
    id: 'dapi-service-categories',
    restPath: 'GET/POST/PUT/DELETE service-categories',
    apiModule: 'catalog',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'create_service_category',
        'update_service_category',
        'delete_service_category',
      ],
    },
  },
  {
    id: 'dapi-packages-crud',
    restPath:
      'GET/POST/PUT/PATCH/DELETE packages, activate/deactivate/duplicate',
    apiModule: 'catalog',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'create_package',
        'update_package',
        'deactivate_package',
        'activate_package',
        'duplicate_package',
      ],
    },
  },
  {
    id: 'dapi-multi-service-settings',
    restPath: 'GET/PUT multi-service/settings',
    apiModule: 'catalog',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['configure_multi_service_settings'],
    },
  },

  // ai-cmd-dashboard-6.5 — Schedules, blocks & time off
  {
    id: 'dapi-schedule-reads',
    restPath: 'GET schedules/templates, block-schedules, provider-calendar',
    apiModule: 'schedule',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'list_templates',
        'list_schedule_blocks',
        'get_provider_calendar',
      ],
    },
  },
  {
    id: 'dapi-schedule-create',
    restPath:
      'POST schedules/direct, templates, templates/:id/duplicate, templates/apply, block-schedules',
    apiModule: 'schedule',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'create_schedule_template',
        'apply_schedule',
        'block_schedule',
        'create_direct_schedule',
        'duplicate_schedule_template',
      ],
    },
  },
  {
    id: 'dapi-schedule-template-update',
    restPath: 'PUT schedules/templates/:id',
    apiModule: 'schedule',
    coverage: { kind: 'dashboard-ai', intents: ['update_schedule_template'] },
  },
  {
    id: 'dapi-schedule-template-delete',
    restPath: 'DELETE schedules/templates (templateIds[])',
    apiModule: 'schedule',
    coverage: { kind: 'dashboard-ai', intents: ['delete_schedule_templates'] },
  },
  {
    id: 'dapi-schedule-block-delete',
    restPath: 'DELETE schedules/block-schedules/:id',
    apiModule: 'schedule',
    coverage: { kind: 'dashboard-ai', intents: ['delete_schedule_block'] },
  },
  {
    id: 'dapi-time-off',
    restPath: 'GET time-off-requests, POST :id/approve, POST :id/deny',
    apiModule: 'schedule',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'list_time_off_requests',
        'approve_time_off_request',
        'deny_time_off_request',
      ],
    },
  },

  // ai-cmd-dashboard-6.6 — Staff, employees & team
  {
    id: 'dapi-employees-crud',
    restPath:
      'GET/POST/PUT/PATCH/DELETE employees, access-role, send-app-access',
    apiModule: 'staff-operations',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'create_employee',
        'update_employee',
        'deactivate_employee',
        'list_employees',
      ],
    },
    notes:
      'DELETE confirmed a false gap — soft-delete, same EmployeeService.remove() call as deactivate_employee',
  },
  {
    id: 'dapi-team-member-role',
    restPath: 'GET/PATCH team-members, team-members/:id/role',
    apiModule: 'staff-operations',
    coverage: { kind: 'dashboard-ai', intents: ['update_team_member_role'] },
  },

  // ai-cmd-dashboard-6.7 — Customers & patient chart
  {
    id: 'dapi-customers-list',
    restPath: 'GET customers/dashboard, customers/:id, customers/:id/detail',
    apiModule: 'customer-crm',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['summarize_customers', 'lookup_customer'],
    },
  },
  {
    id: 'dapi-customer-update',
    restPath: 'PUT customers/:id, customers/:id/clinical-profile',
    apiModule: 'patient-clinical-profiles',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['update_customer', 'update_clinical_profile'],
    },
  },
  {
    id: 'dapi-patient-documents-upload',
    restPath: 'POST documents',
    apiModule: 'patient-clinical-profiles',
    coverage: {
      kind: 'no-ai-binary',
      reason:
        'Raw document file upload — cannot be passed through NL params (ai-cmd-dashboard-6.20.1)',
    },
  },
  {
    id: 'dapi-patient-documents-release',
    restPath: 'GET documents, PATCH release',
    apiModule: 'patient-clinical-profiles',
    coverage: { kind: 'dashboard-ai', intents: ['release_patient_document'] },
  },
  {
    id: 'dapi-patient-encounters',
    restPath: 'GET/PUT/POST encounters, addenda, by-booking',
    apiModule: 'patient-clinical-profiles',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'explain_patient_chart',
        'create_encounter_addendum',
        'update_encounter_by_booking',
      ],
    },
  },
  {
    id: 'dapi-patient-staff-notes',
    restPath: 'GET/POST pre-visit-intakes, staff-notes',
    apiModule: 'patient-clinical-profiles',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['list_customer_staff_notes', 'add_customer_staff_note'],
    },
  },
  {
    id: 'dapi-patient-alerts',
    restPath: 'GET/POST patient-chart/alerts, dismiss',
    apiModule: 'patient-clinical-profiles',
    coverage: { kind: 'dashboard-ai', intents: ['dismiss_patient_alert'] },
  },
  {
    id: 'dapi-patient-results',
    restPath: 'GET orders, results (chart)',
    apiModule: 'clinic-test-results',
    coverage: { kind: 'dashboard-ai', intents: ['explain_patient_results'] },
  },
  {
    id: 'dapi-customer-data-gdpr',
    restPath: 'GET/DELETE me/data (admin paths)',
    apiModule: 'customer-crm',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'export_customer_data',
        'delete_customer_data',
        'admin_delete_customer_data',
      ],
    },
  },

  // ai-cmd-dashboard-6.8 — Pre-visit intake & clinic questionnaires
  {
    id: 'dapi-pre-visit-intake-answers',
    restPath: 'GET/POST pre-visit-intakes/:id, start, answers',
    apiModule: 'clinic-pre-visit-intake',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'assign_pre_visit_intake_to_booking',
        'staff_submit_intake_answers',
      ],
    },
  },
  {
    id: 'dapi-clinic-questionnaires',
    restPath: 'GET/POST/PUT clinic-questionnaires, definition, publish',
    apiModule: 'clinic-questionnaires',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'create_questionnaire',
        'update_questionnaire',
        'publish_questionnaire',
      ],
    },
    notes:
      'PUT .../definition (full question-array replace) stays a form-builder UI action, not NL',
  },

  // ai-cmd-dashboard-6.9 — Clinic test results & lab ops
  {
    id: 'dapi-clinic-test-results-reads',
    restPath:
      'GET clinic-test-results/orders, specimens, booking orders/results/summaries',
    apiModule: 'clinic-test-results',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['list_test_orders', 'explain_patient_results', 'upload_patient_result'],
    },
  },
  {
    id: 'dapi-clinic-test-orders-create',
    restPath: 'POST bookings/:id/orders, book-collection, push-to-patient',
    apiModule: 'clinic-test-results',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'create_test_order',
        'staff_book_lab_collection',
        'push_lab_booking_to_patient',
      ],
    },
  },
  {
    id: 'dapi-clinic-test-transitions',
    restPath: 'POST results/:id/transition, specimens/:id/transition',
    apiModule: 'clinic-test-results',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['enter_test_result', 'release_test_result', 'transition_specimen'],
    },
  },
  {
    id: 'dapi-clinic-test-catalog-crud',
    restPath: 'test-types/panels CRUD, items',
    apiModule: 'clinic-test-catalog',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'create_test_type',
        'update_test_type',
        'delete_test_type',
        'create_test_panel',
        'update_test_panel',
        'set_test_panel_items',
      ],
    },
  },
  {
    id: 'dapi-clinic-catalog-import',
    restPath: 'POST catalog/import-csv, seed-playbook',
    apiModule: 'clinic-test-catalog',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['apply_clinic_playbook', 'import_clinic_catalog_csv'],
    },
  },
  {
    id: 'dapi-specimen-label-history',
    restPath: 'GET specimens/:id/label, change-history',
    apiModule: 'clinic-test-results',
    coverage: { kind: 'dashboard-ai', intents: ['explain_lab_result_history'] },
    notes: 'Label print stays UI — no AI value',
  },

  // ai-cmd-dashboard-6.10 — Gift cards
  {
    id: 'dapi-gift-cards-list-create',
    restPath: 'GET gift-cards, gift-cards/settings, POST gift-cards',
    apiModule: 'gift-cards',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'list_gift_card_orders',
        'configure_gift_card_products',
        'create_gift_card_bundle',
      ],
    },
  },
  {
    id: 'dapi-gift-cards-settings-expiry',
    restPath: 'PUT settings, :id/expiration, expiration-audit',
    apiModule: 'gift-cards',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['extend_gift_card_expiry', 'update_gift_card_settings'],
    },
  },
  {
    id: 'dapi-gift-fulfillment-queue',
    restPath: 'GET fulfillment, fulfillment/:id, PUT ship',
    apiModule: 'gift-cards',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'mark_shipped',
        'list_gift_card_orders',
        'mark_card_ready',
        'gift_fulfill_batch',
      ],
    },
  },
  {
    id: 'dapi-gift-change-requests',
    restPath: 'GET/PUT change-requests, resolve',
    apiModule: 'gift-cards',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'list_gift_card_change_requests',
        'resolve_gift_card_change_request',
      ],
    },
  },
  {
    id: 'dapi-gift-refund-cancel',
    restPath: 'Refund/cancel (via order detail)',
    apiModule: 'gift-cards',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['refund_gift_card_order', 'cancel_gift_card_order'],
    },
  },

  // ai-cmd-dashboard-6.11 — Subscriptions, loyalty & promos
  {
    id: 'dapi-subscription-plans-crud',
    restPath:
      'GET/POST/PUT/PATCH/DELETE subscriptions/plans, activate/deactivate',
    apiModule: 'catalog',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'create_subscription_plan',
        'update_subscription_plan',
        'deactivate_subscription_plan',
        'activate_subscription_plan',
      ],
    },
  },
  {
    id: 'dapi-subscription-assign',
    restPath: 'POST subscriptions/assign, customer subscription CRUD',
    apiModule: 'catalog',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'assign_subscription_to_customer',
        'list_customer_subscriptions',
        'cancel_subscription_admin',
      ],
    },
  },
  {
    id: 'dapi-loyalty-settings',
    restPath: 'GET/PATCH loyalty/settings, customer/:id, adjust',
    apiModule: 'loyalty',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['summarize_loyalty_program', 'configure_loyalty_settings'],
    },
  },
  {
    id: 'dapi-promo-codes',
    restPath: 'GET/POST/PATCH promo-codes, deactivate',
    apiModule: 'marketing-growth',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['create_promo_code', 'deactivate_promo_code'],
    },
  },

  // ai-cmd-dashboard-6.12 — Operations (inventory, locations, expenses, commissions, resources)
  {
    id: 'dapi-locations',
    restPath: 'GET/POST locations',
    apiModule: 'locations',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['create_location', 'update_location'],
    },
  },
  {
    id: 'dapi-inventory-products',
    restPath: 'GET/POST/PUT inventory/products',
    apiModule: 'retail-finance',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'adjust_inventory',
        'create_product',
        'update_inventory_product',
        'delete_inventory_product',
      ],
    },
  },
  {
    id: 'dapi-inventory-service-links',
    restPath: 'GET/POST/DELETE inventory/service-links',
    apiModule: 'retail-finance',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['link_product_to_service', 'unlink_inventory_product'],
    },
  },
  {
    id: 'dapi-inventory-recommendations',
    restPath:
      'PUT inventory/recommendations/services|categories/:id (productIds[])',
    apiModule: 'retail-finance',
    coverage: { kind: 'dashboard-ai', intents: ['set_recommended_products'] },
  },
  {
    id: 'dapi-expenses',
    restPath: 'GET/POST/DELETE expenses',
    apiModule: 'retail-finance',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['record_expense', 'list_expenses', 'delete_expense'],
    },
  },
  {
    id: 'dapi-commissions',
    restPath: 'GET/POST/DELETE commissions',
    apiModule: 'retail-finance',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'commission_report',
        'payout_export',
        'create_commission_rule',
        'delete_commission_rule',
      ],
    },
  },
  {
    id: 'dapi-resources',
    restPath: 'GET/POST/DELETE resources, PUT requirements',
    apiModule: 'schedule-resources',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'create_resource',
        'assign_booking_resource',
        'deactivate_resource',
        'set_service_resource_requirements',
      ],
    },
  },

  // ai-cmd-dashboard-6.13 — Billing, SaaS & business settings
  {
    id: 'dapi-billing-plans',
    restPath: 'GET billing/plans, subscription, entitlements, checkout, portal',
    apiModule: 'billing',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['open_billing_settings', 'start_billing_checkout'],
    },
  },
  {
    id: 'dapi-stripe-connect',
    restPath:
      'GET/POST/PUT stripe-connect (oauth, onboard, sync, login, disconnect)',
    apiModule: 'marketing-growth',
    coverage: { kind: 'dashboard-ai', intents: ['configure_stripe_connect'] },
  },
  {
    id: 'dapi-business-settings-tabs',
    restPath:
      'PUT businesses/:id settings tabs: currency, tax, language, date format, pay-at-venue, privacy, compliance',
    apiModule: 'business',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'configure_business_currency',
        'configure_business_tax',
        'configure_business_languages',
        'configure_business_date_format',
        'configure_cash_payments',
        'configure_privacy_retention',
        'configure_granular_consent',
      ],
    },
  },
  {
    id: 'dapi-provider-context-flags',
    restPath:
      'GET provider/context flags (open shifts, time off, self block, lab)',
    apiModule: 'business',
    coverage: {
      kind: 'no-ai',
      reason:
        'Product blocker — no PUT route exists anywhere to persist providerSelfBlock/providerTimeOff/providerOpenShifts; only a GET read path exists. Nothing for an AI intent to call yet.',
    },
  },

  // ai-cmd-dashboard-6.14 — Notifications, integrations & growth
  {
    id: 'dapi-notifications-settings',
    restPath:
      'GET/PUT notifications/settings, whatsapp, email-templates, reset, custom-variables',
    apiModule: 'integrations',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'notification_history',
        'configure_notification_settings',
        'configure_whatsapp_integration',
        'configure_push_recipients',
        'test_push',
      ],
    },
  },
  {
    id: 'dapi-integrations-api-keys',
    restPath: 'GET/POST/DELETE integrations/api-keys, webhooks, events, docs',
    apiModule: 'integrations',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'create_webhook',
        'delete_webhook',
        'toggle_webhook',
        'list_webhooks',
        'test_webhook',
        'rotate_api_key',
        'create_api_key',
        'revoke_api_key',
      ],
    },
  },
  {
    id: 'dapi-integrations-misc',
    restPath:
      'Zapier, accounting, distribution, google-reserve, openai, zendesk, app-install',
    apiModule: 'integrations',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'list_integration_health',
        'configure_zapier',
        'configure_openai_integration',
        'run_accounting_export',
        'configure_zendesk',
        'configure_distribution_channels',
        'regenerate_tenant_app_install_qr',
        'explain_tenant_app_install',
      ],
    },
  },
  {
    id: 'dapi-zendesk-support-ticket',
    restPath: 'POST integrations/zendesk/support-ticket',
    apiModule: 'integrations',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['create_support_ticket', 'sync_customer_to_zendesk'],
    },
  },
  {
    id: 'dapi-marketing-automation',
    restPath: 'GET/PUT marketing-automation/summary, settings',
    apiModule: 'marketing-growth',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['configure_marketing_automation'],
    },
  },

  // ai-cmd-dashboard-6.15 — Analytics, reports & reviews
  {
    id: 'dapi-analytics-reads',
    restPath: 'GET analytics/staff, services, heatmap, pl, adoption',
    apiModule: 'retail-finance',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['summarize_pl', 'commission_report'],
    },
  },
  {
    id: 'dapi-analytics-export',
    restPath: 'GET analytics/export.csv, export.pdf',
    apiModule: 'retail-finance',
    coverage: { kind: 'dashboard-ai', intents: ['export_analytics_report'] },
  },
  {
    id: 'dapi-reviews',
    restPath: 'GET reviews, reviews/summary',
    apiModule: 'retail-finance',
    coverage: { kind: 'dashboard-ai', intents: ['summarize_reviews'] },
  },

  // ai-cmd-dashboard-6.16 — Compliance, enterprise trust & strategy eval
  {
    id: 'dapi-compliance-status',
    restPath: 'GET compliance/status, breach-incidents, phi-access-audit',
    apiModule: 'compliance',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'explain_compliance_status',
        'list_breach_incidents',
        'view_phi_access_audit',
      ],
    },
  },
  {
    id: 'dapi-compliance-breach-create',
    restPath: 'POST compliance/breach-incidents',
    apiModule: 'compliance',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['report_data_breach', 'send_breach_notification'],
    },
  },
  {
    id: 'dapi-enterprise-trust-strategy-eval',
    restPath:
      'GET/PUT enterprise-trust/settings, documents, security-one-pager, strategy-eval/*',
    apiModule: 'compliance',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'explain_enterprise_trust',
        'explain_strategy_eval',
        'update_strategy_eval',
      ],
    },
  },

  // ai-cmd-dashboard-6.17 — Auth, uploads & telemetry (out of scope)
  {
    id: 'dapi-auth-login',
    restPath:
      'POST auth/login, register, reset-password, forgot-password, switch-business',
    apiModule: 'auth',
    coverage: {
      kind: 'no-ai',
      reason: 'Staff authentication flows, not an assistant action',
    },
  },
  {
    id: 'dapi-auth-preferences',
    restPath: 'PATCH auth/preferences',
    apiModule: 'auth',
    coverage: {
      kind: 'no-ai',
      reason: 'Raw user preference toggle, no AI angle',
    },
  },
  {
    id: 'dapi-uploads',
    restPath: 'POST uploads/avatar, uploads/logo',
    apiModule: 'uploads',
    coverage: {
      kind: 'no-ai-binary',
      reason:
        'Raw file/byte payload — cannot be passed through NL params. No backend method accepts a file buffer from an AI param, and there is no product ask for AI-driven file uploads (ai-cmd-dashboard-6.20.1)',
    },
  },
  {
    id: 'dapi-events-app',
    restPath: 'POST events/app',
    apiModule: 'analytics',
    coverage: {
      kind: 'no-ai',
      reason: 'Internal analytics telemetry beacon, not user-facing',
    },
  },

  // ai-cmd-dashboard-6.18 — Bulk insert / update / delete summary (dashboard)
  {
    id: 'dapi-bulk-ai-native',
    restPath: 'AI matcher (no dedicated bulk_* REST route)',
    apiModule: 'ai-command',
    coverage: {
      kind: 'ai-bulk-internal',
      intents: [
        'cancel_bookings',
        'update_bookings',
        'bulk_smart_cancel',
        'payment_sweep',
        'mark_no_shows',
        'bulk_strip_disabled_locale_translations',
        'bulk_update_service_currency',
      ],
    },
    notes:
      'Resolved via repeated single-item service calls inside the AI handler itself, not a dedicated bulk REST endpoint',
  },
  {
    id: 'dapi-bulk-category-assign',
    restPath: 'Repeated PUT or future bulk-assign API',
    apiModule: 'catalog',
    coverage: { kind: 'dashboard-ai', intents: ['bulk_assign_services_category'] },
  },

  // ai-cmd-dashboard-6.21 — Audit follow-up (rows added after first pass)
  {
    id: 'dapi-billing-confirm-checkout',
    restPath: 'POST billing/confirm-checkout',
    apiModule: 'marketing-growth',
    coverage: { kind: 'dashboard-ai', intents: ['confirm_billing_checkout'] },
  },
  {
    id: 'dapi-billing-entitlements',
    restPath: 'GET billing/entitlements',
    apiModule: 'marketing-growth',
    coverage: { kind: 'dashboard-ai', intents: ['explain_plan_entitlements'] },
  },
  {
    id: 'dapi-referral-program-settings',
    restPath: 'PUT businesses/:id settings.referralProgram',
    apiModule: 'ai-command',
    coverage: { kind: 'dashboard-ai', intents: ['configure_referral_program'] },
  },
  {
    id: 'dapi-staff-message-templates-settings',
    restPath: 'PUT businesses/:id settings.staffMessageTemplates',
    apiModule: 'ai-command',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['configure_staff_message_templates'],
    },
  },
  {
    id: 'dapi-subscription-usage-dashboard',
    restPath: 'GET subscriptions/:id/usage',
    apiModule: 'customer-crm',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['subscription_usage_history'],
    },
    notes:
      'Proposed explain_subscription_usage was a false gap — subscription_usage_history already calls the same SubscriptionsService.getUsageHistory as this REST route',
  },
  {
    id: 'dapi-external-doctors',
    restPath: 'GET/POST/PUT external-doctors',
    apiModule: 'ai-command',
    coverage: {
      kind: 'dashboard-ai',
      intents: [
        'create_external_doctor',
        'update_external_doctor',
        'list_external_doctors',
      ],
    },
  },
  {
    id: 'dapi-booking-lab-summaries-dashboard',
    restPath: 'GET clinic-test-results/bookings/:id/summaries',
    apiModule: 'clinic-test-results',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['list_booking_lab_summaries'],
    },
    notes:
      'Same handler/service call as the ai-cmd-provider-6.9.4 provider-mobile intent — extended to the dashboard surface since listBookingLabSummaries has no provider-session scoping',
  },
  {
    id: 'dapi-agent-task-approve-retry',
    restPath:
      'POST ai/command/tasks/:id/approve, ai/command/tasks/:id/steps/:id/retry',
    apiModule: 'ai-command',
    coverage: {
      kind: 'dashboard-ai',
      intents: ['approve_agent_task', 'retry_agent_step'],
    },
  },
  {
    id: 'dapi-adoption-funnel',
    restPath: 'GET analytics/adoption',
    apiModule: 'retail-finance',
    coverage: { kind: 'dashboard-ai', intents: ['summarize_adoption_funnel'] },
  },
  {
    id: 'dapi-websocket-events',
    restPath: 'WS /events (Socket.IO)',
    apiModule: 'ai-command',
    coverage: {
      kind: 'no-ai-realtime',
      reason:
        'Realtime invalidation channel for bookings/AI task updates — no REST request/response shape for an AI intent to call, purely a push notification transport',
    },
  },
] as const;
