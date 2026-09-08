/**
 * AI-ROADMAP Phase 1 - the final slice: the `ai-command` catch-all, split.
 *
 * The roadmap flagged this module as needing splitting rather than porting as
 * one domain, and the probe shows why: **194 entries across 30 handlers**.
 * `ai-command` was never a domain - it is the label left on everything that did
 * not get one, and the handlers are the real seams.
 *
 * Split into eight domains here: `operations` (the scheduling and staff core,
 * 50 from `AiCommandService` plus 13 from `AiOperationsService`), `compliance`
 * (22), `business` (config: currency, dates, tax, languages, hours - 47),
 * `tour` (11), `provider` (8), `recommendation` (8), `guide` (16 across five
 * product-guide services) and `guest` (6).
 *
 * `operations.delete_schedule_block` closes a loop left open in the long-tail
 * slice: `provider.block_my_time` was declared `manual` with the note that its
 * correct inverse existed in the registry but was not yet specced. It is
 * specced now, and that declaration is converted to a real inverse.
 *
 * Three commands are registered `mutating: true` while producing a report -
 * `check_schedule_compliance`, `staff_service_matrix`, `revenue_forecast`.
 * Recorded under e2e-bug.376 as suspected instances, specced as declared.
 */
import type { CommandSpec } from './ai-command-spec.types.js';

export const CORE_COMMAND_SPECS: readonly CommandSpec[] = [
  {
    id: 'compliance.accept_hipaa_baa',
    aliases: ['accept_hipaa_baa'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Accept the HIPAA business associate agreement.',
    variables: {
      // `parseAcceptHipaaBaaFromPrompt`. The only field, and it is a rider on
      // the acceptance rather than the acceptance itself — the BAA is signed
      // either way; this decides whether HIPAA mode is switched on at the same
      // time.
      enableHipaa: {
        type: 'boolean',
        description:
          'Also turn HIPAA mode on while accepting. Falls back to whether the message asks to enable it.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['accept the HIPAA BAA', 'sign the business associate agreement'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A signed agreement is a legal record; withdrawing it is a legal act, not an undo.',
    },
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'compliance.admin_delete_customer_data',
    aliases: ['admin_delete_customer_data'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Erase a customer personal data as an administrator.',
    variables: {
      // `handleAdminDeleteCustomerDataLogic`. This calls
      // `customerPrivacyService.deleteCustomerData` **immediately** — GDPR
      // erasure, no preview and no undo (`compensation: none`). Naming the
      // target precisely is the whole safety margin, which is why both
      // identifiers are declared rather than just the one the failure message
      // mentions.
      customerName: {
        type: 'string',
        description:
          'Customer to forget. Falls back to a name found in the message; matched against active customers only.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description:
          'Exact customer to forget. Takes precedence over the name, which is a fuzzy match — supply it when a name could match more than one person.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['erase this customer data', 'admin delete their records'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Erasure is the point of the command; the records no longer exist to restore.',
    },
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'operations.analyze_appointments',
    aliases: ['analyze_appointments'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Analyse appointment patterns.',
    // §211 (C2/T0) — `resolveAppointmentMetric` + `resolveDateRange`.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      appointmentMetric: {
        type: 'string',
        description: 'Which appointment metric to rank by.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['analyse our appointments', 'what do the bookings show'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.analyze_services',
    aliases: ['analyze_services'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Analyse how services are performing.',
    // §211 (C2/T0) — `resolveServiceMetric` + `resolveDateRange`.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      serviceMetric: {
        type: 'string',
        description: 'Which service metric to rank by.',
        required: false,
        resolver: 'none',
      },
      limit: {
        type: 'number',
        description: 'How many rows to return.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['which services sell best', 'analyse our services'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.apply_and_fill',
    aliases: ['apply_and_fill'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Apply a schedule and fill the resulting gaps.',
    variables: {
      // tech-debt C2 — `handleApplyAndFill` runs `handleApplySchedule` and then
      // `handleFillScheduleGaps`, so its inputs are the **union** of two other
      // commands'. Declared here rather than cross-referenced: a planner reads
      // this entry, not the call graph.
      templateName: {
        type: 'string',
        description: 'Weekday template to apply.',
        required: false,
        resolver: 'none',
      },
      weekdays: {
        type: 'string[]',
        description: 'Days the template applies to.',
        required: false,
        resolver: 'none',
      },
      applyDays: {
        type: 'string[]',
        description:
          'Alternative spelling of `weekdays`; the parser accepts either.',
        required: false,
        resolver: 'none',
      },
      repeatWeeksCount: {
        type: 'number',
        description: 'How many weeks to repeat the template for.',
        required: false,
        resolver: 'none',
      },
      employeeName: {
        type: 'string',
        description:
          'Provider the schedule is applied to and whose gaps are then filled.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Apply and fill across the whole team.',
        required: false,
        resolver: 'none',
      },
      timeFrom: {
        type: 'string',
        description: 'Earliest time the fill step may use, `HH:MM`.',
        required: false,
        resolver: 'none',
      },
      timeTo: {
        type: 'string',
        description: 'Latest time the fill step may use, `HH:MM`.',
        required: false,
        resolver: 'none',
      },
      dateFrom: {
        type: 'string',
        description: 'First day affected, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description:
          'Last day affected, ISO 8601 date. Same as `dateFrom` for a single day.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['apply it and fill the gaps', 'apply and fill'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many bookings and schedules at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiScheduleHandlersService',
  },
  {
    id: 'clinic.apply_playbook',
    aliases: ['apply_clinic_playbook'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Apply a whole clinic configuration playbook.',
    variables: {},
    examples: ['set us up as a clinic', 'apply the clinic playbook'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many settings at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiClinicServiceService',
  },
  {
    id: 'operations.apply_schedule',
    aliases: ['apply_schedule'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Apply a schedule to providers.',
    variables: {
      // `handleApplySchedule` -> `resolveEmployees` + `resolveDateRange` +
      // `resolveTemplate` + `parseWeekdaysFromParams`. Three of its four
      // failure messages name a field: "Specify at least one service provider
      // (or 'all providers')", "Specify a date or range", "No schedule
      // template found matching …".
      employeeName: {
        type: 'string',
        description: 'Provider to apply the template to.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Several providers at once.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Apply to the whole team instead of naming providers.',
        required: false,
        resolver: 'none',
      },
      templateName: {
        type: 'string',
        description:
          'Which saved template to apply. An unmatched name comes back listing the real ones.',
        required: false,
        resolver: 'none',
      },
      date: {
        type: 'string',
        description: 'Single day to apply to.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the range to apply across.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the range.',
        required: false,
        resolver: 'date',
      },
      applyDays: {
        type: 'string[]',
        description:
          'Restrict to particular weekdays within the range. Falls back to weekdays named in the message.',
        required: false,
        resolver: 'none',
      },
      repeatWeeksCount: {
        type: 'number',
        description: 'Repeat the pattern for this many weeks. Defaults to 1.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['apply that schedule', 'put the new hours live'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many provider schedules at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiScheduleHandlersService',
  },
  {
    id: 'tour.apply_playbook',
    aliases: ['apply_tour_playbook'],
    domain: 'tour',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Apply a whole tour operator configuration playbook.',
    variables: {},
    examples: ['set us up as a tour operator', 'apply the tour playbook'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many settings at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiTourServiceService',
  },
  {
    id: 'operations.assign_employee_services',
    aliases: ['assign_employee_services'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Assign services a staff member can perform.',
    // §177 (C2/T1) — `resolveAssignEmployeeServicesInput` combines
    // `resolveEmployees` (employeeName / employeeNames / allProviders) with
    // `resolveServicesForEmployeeAssignment` (categoryName), plus its own reads.
    variables: {
      employeeName: {
        type: 'string',
        description: 'Provider to act on.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Several providers.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Apply to every provider instead of naming any.',
        required: false,
        resolver: 'none',
      },
      serviceName: {
        type: 'string',
        description: 'Service being assigned.',
        required: false,
        resolver: 'service',
      },
      categoryName: {
        type: 'string',
        description: 'Assign every service in a category.',
        required: false,
        resolver: 'none',
      },
      assignFromCategory: {
        type: 'boolean',
        description: 'Treat `categoryName` as the source of the service list.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['Mary can do facials', 'assign services to that employee'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'operations.unassign_employee_services',
      captures: ['employeeId', 'serviceIds'],
    },
    handler: 'AiCommandService',
  },
  {
    id: 'business.audit_date_surfaces',
    aliases: ['audit_dashboard_date_surfaces'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List where dates are displayed and in what format.',
    variables: {},
    examples: ['where do dates show up', 'audit our date surfaces'],
    confirm: 'never',
    handler: 'AiBusinessDateFormatService',
  },
  {
    id: 'operations.block_schedule',
    aliases: ['block_schedule'],
    domain: 'operations',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Block time in a schedule.',
    // §177 (C2/T1) — `prepareBlockSchedulePlan` composes four helpers:
    // `resolveEmployees`, `resolveDateRange`, `parseTimeWindow` and
    // `parseWeekdaysFromParams`. Every field below is read by one of them.
    variables: {
      employeeName: {
        type: 'string',
        description: 'Provider to act on.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Several providers.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Apply to every provider instead of naming any.',
        required: false,
        resolver: 'none',
      },
      date: {
        type: 'string',
        description: 'Single day.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of a date range.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of a date range.',
        required: false,
        resolver: 'date',
      },
      timeFrom: {
        type: 'string',
        description: 'Start of the daily window.',
        required: false,
        resolver: 'none',
      },
      timeTo: {
        type: 'string',
        description: 'End of the daily window.',
        required: false,
        resolver: 'none',
      },
      weekdays: {
        type: 'string[]',
        description: 'Days of the week the window applies to.',
        required: false,
        resolver: 'none',
      },
      applyDays: {
        type: 'string[]',
        description: 'Alias for `weekdays`, read by `parseWeekdaysFromParams`.',
        required: false,
        resolver: 'none',
      },
      // §306 (`e2e-bug.462`): `prepareBlockSchedulePlan` calls
      // `isFullDayBlock(params, prompt)`, whose first line is
      // `if (params.blockFullDay) return true`.
      blockFullDay: {
        type: 'boolean',
        description: 'Block the entire day rather than a time window.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['block Gevorg out tomorrow', 'block that time'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'operations.delete_schedule_block',
      captures: ['blockId'],
    },
    handler: 'AiCommandService',
  },
  {
    id: 'operations.bulk_smart_cancel',
    aliases: ['bulk_smart_cancel'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Cancel many bookings at once, choosing which to keep.',
    variables: {
      // `handleBulkSmartCancel` -> `findBookingsForCancel` (+ `resolveEmployee`,
      // `resolveServices`). T3 and destructive: this cancels every booking the
      // filters match, so the filters *are* the blast radius.
      employeeName: {
        type: 'string',
        description: 'Only cancel this provider\u2019s bookings.',
        required: false,
        resolver: 'employee',
      },
      serviceName: {
        type: 'string',
        description: 'Only cancel bookings for this service.',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Only cancel bookings on this day, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'First day affected, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description:
          'Last day affected, ISO 8601 date. Same as `dateFrom` for a single day.',
        required: false,
        resolver: 'date',
      },
      statusFilter: {
        type: 'string',
        description: 'Only cancel bookings currently in this status.',
        required: false,
        resolver: 'none',
      },
      statusFilters: {
        type: 'string[]',
        description:
          'Several statuses at once; the resolver accepts either spelling.',
        required: false,
        resolver: 'none',
      },
      reason: {
        type: 'string',
        description: 'Reason recorded against each cancellation.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'cancel tomorrow bookings',
      'smart cancel the affected appointments',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Customers have been told their bookings are cancelled and the slots may already be taken.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'business.bulk_strip_disabled_locales',
    aliases: ['bulk_strip_disabled_locale_translations'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Remove translations for languages that are switched off.',
    variables: {},
    examples: ['clean up unused translations', 'strip disabled locale text'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many translations at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiBusinessLanguagesService',
  },
  {
    id: 'business.bulk_update_service_currency',
    aliases: ['bulk_update_service_currency'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Change the currency on every service at once.',
    variables: {
      // Same parser as `configure_currency`, one command wider: this rewrites
      // the currency on **every service**. It relabels rather than converts —
      // the price figures stay as they are and only the unit changes, which
      // the variable says outright rather than leaving a planner to assume.
      currencyCode: {
        type: 'string',
        description:
          'Currency to relabel every service to. Price figures are not converted — only the unit changes.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['switch all services to euros', 'bulk change service currency'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many services at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiBusinessCurrencyService',
  },
  {
    id: 'operations.check_schedule_compliance',
    aliases: ['check_schedule_compliance'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    // e2e-bug.376, second wave (§123): registry fixed, so this can say what it
    // is. It was T1 with a `kind: 'none'` compensation only because a binding
    // passed its whole intent list as `mutateIntents` and conformance —
    // correctly — fails a spec that disagrees with the registry.
    risk: 'T0',
    description: 'Check schedules against working time rules.',
    // §214 (C2/T0) — `resolveDateRange(params, prompt, tz)`.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['are our schedules compliant', 'check schedule compliance'],
    confirm: 'never',
    handler: 'AiOperationsService',
  },
  {
    id: 'operations.clear_schedule',
    aliases: ['clear_schedule'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T3',
    description: 'Clear a schedule entirely.',
    variables: {
      // `handleClearSchedule` reads `allProviders` and hands the rest to
      // `prepareClearSchedulePlan`, whose dates come through the shared
      // `resolveDateRange`.
      allProviders: {
        type: 'boolean',
        description: 'Clear the whole team rather than one provider.',
        required: false,
        resolver: 'none',
      },
      employeeName: {
        type: 'string',
        description: 'Provider whose schedule is being cleared.',
        required: false,
        resolver: 'employee',
      },
      dateFrom: {
        type: 'string',
        description: 'First day affected, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description:
          'Last day affected, ISO 8601 date. Same as `dateFrom` for a single day.',
        required: false,
        resolver: 'date',
      },
      // §305 (`e2e-bug.462`): `handleClearSchedule` delegates to
      // `prepareClearSchedulePlan`, which calls `resolveScheduleDates(params,
      // prompt)` (reads `date`) and `resolveEmployees(employees, params)`
      // (reads `employeeNames` via `getRequestedEmployeeNames`). Depth 2 — the
      // handler body is nine lines and reads no params at all.
      date: {
        type: 'string',
        description: 'Single day to clear, ISO 8601 date. Alternative to dateFrom/dateTo.',
        required: false,
        resolver: 'date',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Clear the schedule for these providers.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['clear Gevorg schedule', 'wipe next week hours'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many schedule entries at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'operations.configure_ai_autopilot',
    aliases: ['configure_ai_autopilot'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Change what the assistant is allowed to do unattended.',
    variables: {
      // Dispatched by `AiMetaOpsService`, not the `AiCommandService` this
      // spec names — the e2e-bug.440 class again, found the same way.
      enabled: {
        type: 'boolean',
        description: 'Turn autopilot on or off.',
        required: false,
        resolver: 'none',
      },
      ruleName: {
        type: 'string',
        description:
          'Scope the change to one autopilot rule rather than the whole setting.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['let the assistant book automatically', 'configure autopilot'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'operations.configure_ai_autopilot',
      captures: ['previousValues'],
    },
    handler: 'AiMetaOpsService',
  },
  {
    id: 'business.configure_currency',
    aliases: ['configure_business_currency'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Set the currency the business trades in.',
    variables: {
      // `parseCurrencyFromPrompt(prompt, params)` prefers `currencyCode`, then
      // `currency`, then scans the message for a supported code or a word
      // alias ("euros"). One spelling declared, as elsewhere.
      currencyCode: {
        type: 'string',
        description:
          'Currency to trade in. Must be one the platform supports; falls back to a code or currency word found in the message.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['set our currency to euros', 'change the business currency'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'business.configure_currency',
      captures: ['previousCurrency'],
    },
    handler: 'AiBusinessCurrencyService',
  },
  {
    id: 'business.configure_date_format',
    aliases: ['configure_business_date_format'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Set how dates are displayed.',
    // §177 (C2/T1) — chain followed to termination: the handler reads `_prompt`,
    // `parseBusinessDateFormatFromPrompt` reads both fields, and its own helpers
    // (`extractExplicitDateFormat` / `extractExplicitTimeFormat`) read none. Both
    // appear in the handler's `missing` hint.
    variables: {
      dateFormat: {
        type: 'string',
        description: 'Date display format for the business.',
        required: false,
        resolver: 'none',
      },
      timeFormat: {
        type: 'string',
        description: 'Time display format for the business.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['use day month year', 'change our date format'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'business.configure_date_format',
      captures: ['previousFormat'],
    },
    handler: 'AiBusinessDateFormatService',
  },
  {
    id: 'business.configure_languages',
    aliases: ['configure_business_languages'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Set which languages the business offers.',
    // §177 (C2/T1) — read by `parseBusinessLanguagesFromPrompt`; its own helpers
    // (`extractLocalesFromPrompt`, `resolveOperation`) read none.
    variables: {
      operation: {
        type: 'string',
        description: 'Add, remove or replace the enabled locales.',
        required: false,
        resolver: 'none',
      },
      locales: {
        type: 'string[]',
        description:
          'Locales the operation applies to. `enabledLocales` is an alias.',
        required: false,
        resolver: 'none',
      },
      enabledLocales: {
        type: 'string[]',
        description: 'Alias for `locales`.',
        required: false,
        resolver: 'none',
      },
      defaultLocale: {
        type: 'string',
        description: 'Locale used when none is requested.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add Armenian', 'change our languages'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'business.configure_languages',
      captures: ['previousLanguages'],
    },
    handler: 'AiBusinessLanguagesService',
  },
  {
    id: 'business.configure_tax',
    aliases: ['configure_business_tax'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Set how tax is charged.',
    variables: {
      // `parseBusinessTaxFromPrompt`. `model` is the one that changes how
      // every price on the business is read — inclusive tax leaves displayed
      // prices alone, exclusive adds on top at checkout.
      model: {
        type: 'string',
        description:
          'Whether displayed prices already include tax or have it added at checkout.',
        required: false,
        resolver: 'none',
      },
      rate: {
        type: 'number',
        description: 'Tax rate as a percentage.',
        required: false,
        resolver: 'none',
      },
      name: {
        type: 'string',
        description: 'Label for the tax shown on receipts (VAT, GST, …).',
        required: false,
        resolver: 'none',
      },
      enabled: {
        type: 'boolean',
        description: 'Turn tax charging on or off.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['charge 20 percent VAT', 'configure our tax'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'business.configure_tax',
      captures: ['previousValues'],
    },
    handler: 'AiBusinessTaxService',
  },
  {
    id: 'clinic.configure_service',
    aliases: ['configure_clinic_service'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Configure a clinical service and what it requires.',
    // §177 (C2/T1) — read by `parseConfigureClinicServiceFromPrompt`; the four
    // `extract*` helpers below it read no params.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service being configured as a clinic service.',
        required: false,
        resolver: 'service',
      },
      serviceId: {
        type: 'string',
        description: 'Service id, when known.',
        required: false,
        resolver: 'service',
      },
      serviceType: {
        type: 'string',
        description: 'Clinic service type.',
        required: false,
        resolver: 'none',
      },
      requiresFasting: {
        type: 'boolean',
        description: 'Whether the patient must fast beforehand.',
        required: false,
        resolver: 'none',
      },
      preparationNotes: {
        type: 'string',
        description: 'Preparation instructions shown to the patient.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'set up the blood test service',
      'configure that clinic service',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'clinic.configure_service',
      captures: ['previousValues'],
    },
    handler: 'AiClinicServiceService',
  },
  {
    id: 'compliance.configure_granular_consent',
    aliases: ['configure_granular_consent'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Change what consent customers are asked for.',
    // §177 (C2/T1) — read by `parseConfigureGranularConsentFromPrompt`, which the
    // dispatch calls before the handler and merges over `params`. Both toggles
    // appear in the handler's `missing` hint.
    variables: {
      requireAiProcessing: {
        type: 'boolean',
        description: 'Require explicit consent before AI processing.',
        required: false,
        resolver: 'none',
      },
      requireThirdPartyIntegrations: {
        type: 'boolean',
        description:
          'Require explicit consent before sharing with integrations.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['change our consent options', 'configure granular consent'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'compliance.configure_granular_consent',
      captures: ['previousValues'],
    },
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'compliance.configure_hipaa_session_timeout',
    aliases: ['configure_hipaa_session_timeout'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Set how long a HIPAA session stays open.',
    // §177 (C2/T1) — **two** levels down: the handler reads `_prompt`,
    // `parseConfigureHipaaSessionTimeoutFromPrompt` delegates to
    // `parseHipaaSessionTimeoutMinutes`, and that is what reads the param. A
    // one-level check finds nothing here and would have exempted the command.
    variables: {
      sessionTimeoutMinutes: {
        type: 'number',
        description: 'Idle minutes before a HIPAA session is ended.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['log staff out after 10 minutes', 'set the HIPAA timeout'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'compliance.configure_hipaa_session_timeout',
      captures: ['previousTimeout'],
    },
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'operations.configure_online_booking',
    aliases: ['configure_online_booking'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Change how online booking behaves.',
    // §177 (C2/T1) — one toggle; `parseOnlineBookingEnabledFromPrompt` reads no
    // params, so the prompt is the fallback rather than a second source.
    variables: {
      enabled: {
        type: 'boolean',
        description:
          'Turn online booking on or off. Parsed from the prompt when omitted.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['turn off online booking', 'configure online booking'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'operations.configure_online_booking',
      captures: ['previousValues'],
    },
    handler: 'AiOperationsService',
  },
  {
    id: 'business.configure_package_localized_names',
    aliases: ['configure_package_localized_names'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Set package names per language.',
    // §177 (C2/T1) — read by `parsePackageLocalizedNamesFromPrompt`; the three
    // `extract*` helpers and `resolveOperation` read none.
    variables: {
      packageName: {
        type: 'string',
        description: 'Package whose localized name is being set.',
        required: false,
        resolver: 'none',
      },
      packageId: {
        type: 'string',
        description: 'Package id, when known.',
        required: false,
        resolver: 'none',
      },
      locale: {
        type: 'string',
        description: 'Locale the name applies to.',
        required: false,
        resolver: 'none',
      },
      displayName: {
        type: 'string',
        description: 'Name shown in that locale. `localizedName` is an alias.',
        required: false,
        resolver: 'none',
      },
      localizedName: {
        type: 'string',
        description: 'Alias for `displayName`.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['name the package in Armenian', 'set localised package names'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'business.configure_package_localized_names',
      captures: ['previousValues'],
    },
    handler: 'AiPackageLocalizedNamesService',
  },
  {
    id: 'compliance.configure_privacy_retention',
    aliases: ['configure_privacy_retention'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Set how long personal data is kept.',
    variables: {
      // `parseConfigurePrivacyRetentionFromPrompt` -> `parseRetentionFromPrompt`
      // + `parseCookieBannerFromPrompt`. Six fields, none required: the parser
      // returns null only when *no* field is set, and the handler reports
      // `missing: ['retention', 'cookieBanner']` — a group, not a field.
      //
      // The four day counts are separate retention clocks. A planner that can
      // only say "keep data for 3 years" leaves `detectRetentionField` to guess
      // which clock from the wording; naming the field is how you avoid
      // shortening the wrong one.
      bookingHistoryDays: {
        type: 'number',
        description: 'How long booking history is kept.',
        required: false,
        resolver: 'none',
      },
      customerPiiDays: {
        type: 'number',
        description: 'How long customer personal data is kept.',
        required: false,
        resolver: 'none',
      },
      aiCommandLogsDays: {
        type: 'number',
        description: 'How long assistant command logs are kept.',
        required: false,
        resolver: 'none',
      },
      auditLogsDays: {
        type: 'number',
        description: 'How long audit logs are kept.',
        required: false,
        resolver: 'none',
      },
      cookieBannerEnabled: {
        type: 'boolean',
        description: 'Show or hide the cookie consent banner.',
        required: false,
        resolver: 'none',
      },
      cookieBannerMessage: {
        type: 'string',
        description: 'Text shown in the cookie consent banner.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['keep records for 5 years', 'change our retention policy'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'A shorter retention may already have deleted data; lengthening it does not bring that back.',
    },
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'business.configure_push_date_format',
    aliases: ['configure_provider_push_date_format'],
    domain: 'business',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Set the date format used in provider notifications.',
    // §177 (C2/T1) — the only field read directly, with no parser in between: the
    // provider-push variant sets the time format alone.
    variables: {
      timeFormat: {
        type: 'string',
        description: 'Time format used in provider push notifications.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'change dates in push alerts',
      'set the notification date format',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'business.configure_push_date_format',
      captures: ['previousFormat'],
    },
    handler: 'AiBusinessDateFormatService',
  },
  {
    id: 'recommendation.configure_product',
    aliases: ['configure_recommendation_product'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Configure a product recommendation.',
    // §177 (C2/T1) — the parser is called by the *dispatch*, which merges its
    // output over `ctx.params` before the handler runs; the handler then adds
    // `locationId`. Chain terminates at the five `extract*` helpers, none of
    // which read params.
    variables: {
      productName: {
        type: 'string',
        description:
          'Product being configured. `name` is accepted as an alias.',
        required: true,
        resolver: 'none',
      },
      name: {
        type: 'string',
        description: 'Alias for `productName`.',
        required: false,
        resolver: 'none',
      },
      productId: {
        type: 'string',
        description: 'Product id, when known.',
        required: false,
        resolver: 'none',
      },
      retailPrice: {
        type: 'number',
        description:
          'Retail price shown with the recommendation. `price` is an alias.',
        required: false,
        resolver: 'money',
      },
      price: {
        type: 'number',
        description: 'Alias for `retailPrice`.',
        required: false,
        resolver: 'money',
      },
      description: {
        type: 'string',
        description: 'Recommendation copy.',
        required: false,
        resolver: 'none',
      },
      imageUrl: {
        type: 'string',
        description: 'Product image.',
        required: false,
        resolver: 'none',
      },
      externalLink: {
        type: 'string',
        description: 'Where the recommendation links to.',
        required: false,
        resolver: 'none',
      },
      wantsImage: {
        type: 'boolean',
        description: 'Whether an image was asked for.',
        required: false,
        resolver: 'none',
      },
      wantsLink: {
        type: 'boolean',
        description: 'Whether a link was asked for.',
        required: false,
        resolver: 'none',
      },
      isUpdate: {
        type: 'boolean',
        description: 'Update an existing product rather than create one.',
        required: false,
        resolver: 'none',
      },
      locationId: {
        type: 'string',
        description: 'Location scope, read by the handler itself.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['recommend this after a cut', 'configure that recommendation'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'recommendation.configure_product',
      captures: ['previousValues'],
    },
    handler: 'AiRecommendationProductService',
  },
  {
    id: 'marketing.configure_referral_program',
    aliases: ['configure_referral_program'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Configure the customer referral programme.',
    // §177 (C2/T1) — six fields, all read directly with no helper in between.
    variables: {
      enabled: {
        type: 'boolean',
        description: 'Turn the referral programme on or off.',
        required: false,
        resolver: 'none',
      },
      referrerRewardType: {
        type: 'string',
        description: 'How the referrer is rewarded.',
        required: false,
        resolver: 'none',
      },
      referrerBonusPoints: {
        type: 'number',
        description: 'Points awarded to the referrer.',
        required: false,
        resolver: 'none',
      },
      referrerGiftCardAmount: {
        type: 'number',
        description: 'Gift card value awarded to the referrer.',
        required: false,
        resolver: 'money',
      },
      refereeBonusPoints: {
        type: 'number',
        description: 'Points awarded to the person referred.',
        required: false,
        resolver: 'none',
      },
      refereePromoCode: {
        type: 'string',
        description: 'Promo code given to the person referred.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['change our referral rewards', 'configure referrals'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'marketing.configure_referral_program',
      captures: ['previousValues'],
    },
    handler: 'AiReferralStaffTemplatesService',
  },
  {
    id: 'business.configure_stacked_tax',
    aliases: ['configure_stacked_tax_rules'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Configure multiple tax rules applied together.',
    variables: {
      // `parseConfigureStackedTaxRulesFromPrompt`. `operation` decides whether
      // the supplied rules are added to the existing set or replace it — the
      // difference between adding one tax and dropping every other.
      operation: {
        type: 'string',
        description:
          'Whether the rules are added to the current set or replace it.',
        required: false,
        resolver: 'none',
      },
      rules: {
        type: 'object[]',
        description: 'The stacked tax rules to apply.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add a city tax on top', 'configure stacked tax rules'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'business.configure_stacked_tax',
      captures: ['previousValues'],
    },
    handler: 'AiBusinessTaxService',
  },
  {
    id: 'marketing.configure_staff_message_templates',
    aliases: ['configure_staff_message_templates'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Configure the canned messages staff can send.',
    // §177 (C2/T1) — `readStaffMessageTemplatesSettings` reads business settings,
    // not params, so the chain ends at the handler.
    variables: {
      enabled: {
        type: 'boolean',
        description: 'Turn staff message templates on or off.',
        required: false,
        resolver: 'none',
      },
      templates: {
        type: 'object[]',
        description: 'The templates themselves.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add a running late template', 'configure staff messages'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'marketing.configure_staff_message_templates',
      captures: ['previousValues'],
    },
    handler: 'AiReferralStaffTemplatesService',
  },
  {
    id: 'tour.configure_service',
    aliases: ['configure_tour_service'],
    domain: 'tour',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Configure a tour and its capacity.',
    // §177 (C2/T1) — the widest of the `configure_*` family: ten fields via
    // `parseConfigureTourServiceFromPrompt`, whose eight `extract*` helpers read
    // no params. Its refusal names `serviceName`, `maxGroupSize` and `difficulty`.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service being configured as a tour.',
        required: false,
        resolver: 'service',
      },
      serviceId: {
        type: 'string',
        description: 'Service id, when known.',
        required: false,
        resolver: 'service',
      },
      serviceType: {
        type: 'string',
        description: 'Tour service type.',
        required: false,
        resolver: 'none',
      },
      enableTour: {
        type: 'boolean',
        description: 'Mark the service as a tour.',
        required: false,
        resolver: 'none',
      },
      maxGroupSize: {
        type: 'number',
        description: 'Largest group the tour accepts.',
        required: false,
        resolver: 'none',
      },
      difficulty: {
        type: 'string',
        description: 'Difficulty rating shown to customers.',
        required: false,
        resolver: 'none',
      },
      durationDays: {
        type: 'number',
        description: 'Length of the tour in days.',
        required: false,
        resolver: 'none',
      },
      meetingPoint: {
        type: 'string',
        description: 'Where the tour departs from.',
        required: false,
        resolver: 'none',
      },
      includedItems: {
        type: 'string[]',
        description: 'What the price includes.',
        required: false,
        resolver: 'none',
      },
      coverImage: {
        type: 'string',
        description: 'Cover image for the tour listing.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['set up the harbour tour', 'configure that tour'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'tour.configure_service',
      captures: ['previousValues'],
    },
    handler: 'AiTourServiceService',
  },
  {
    id: 'operations.create_direct_schedule',
    aliases: ['create_direct_schedule'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Create a schedule directly.',
    // §177 (C2/T1) — the schedule family, plus the fields this command adds.
    variables: {
      employeeName: {
        type: 'string',
        description: 'Provider to act on.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Several providers.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Apply to every provider instead of naming any.',
        required: false,
        resolver: 'none',
      },
      date: {
        type: 'string',
        description: 'Single day.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of a date range.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of a date range.',
        required: false,
        resolver: 'date',
      },
      timeFrom: {
        type: 'string',
        description: 'Start of the daily window.',
        required: false,
        resolver: 'none',
      },
      timeTo: {
        type: 'string',
        description: 'End of the daily window.',
        required: false,
        resolver: 'none',
      },
      weekdays: {
        type: 'string[]',
        description: 'Days of the week the window applies to.',
        required: false,
        resolver: 'none',
      },
      applyDays: {
        type: 'string[]',
        description: 'Alias for `weekdays`, read by `parseWeekdaysFromParams`.',
        required: false,
        resolver: 'none',
      },
      serviceNames: {
        type: 'string[]',
        description:
          'Services the schedule covers. Left empty means the provider\u2019s own services.',
        required: false,
        resolver: 'service',
      },
      notifyCustomers: {
        type: 'boolean',
        description: 'Notify affected customers.',
        required: false,
        resolver: 'none',
      },
      reason: {
        type: 'string',
        description: 'Reason recorded with the change.',
        required: false,
        resolver: 'none',
      },
      // §306 (`e2e-bug.462`): `inferDirectSchedulePeriods(params, prompt)`
      // returns `params.periods` verbatim when it is a non-empty array;
      // `employeeId` is read directly by `handleCreateDirectSchedule`.
      periods: {
        type: 'object[]',
        description: 'Explicit working periods for the day, instead of inferring them from the message.',
        required: false,
        resolver: 'none',
      },
      employeeId: {
        type: 'string',
        description: 'Provider id, when the caller already resolved one instead of naming them.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['set Gevorg hours to 9 to 5', 'create their schedule'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'operations.clear_schedule',
      captures: ['employeeId', 'previousSchedule'],
    },
    handler: 'AiCommandService',
  },
  {
    id: 'operations.create_employee',
    aliases: ['create_employee'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Add a staff member to the team.',
    variables: {
      // `handleCreateEmployeeLogic`. Not required: the name falls back to
      // `extractEmployeeNameFromPrompt`, and only when both are empty does it
      // return "Please specify the new team member name (employeeName)."
      employeeName: {
        type: 'string',
        description:
          'Name of the new team member. Falls back to a name found in the message.',
        required: false,
        resolver: 'employee',
      },
      email: {
        type: 'string',
        description:
          'Their email. Falls back to an address found in the message.',
        required: false,
        resolver: 'none',
      },
      phone: {
        type: 'string',
        description: 'Their phone number.',
        required: false,
        resolver: 'none',
      },
      serviceNames: {
        type: 'string[]',
        description:
          'Services to assign them on creation. Falls back to service names found in the message.',
        required: false,
        resolver: 'service',
      },
    },
    examples: [
      'add Mary as a stylist',
      'create an employee',
      'Add a new employee named QA Test Employee, role hairstylist, phone +15555559999',
    ],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Bookings and schedules may already reference the employee; removing them needs a dependency check.',
    },
    handler: 'AiOperationsService',
  },
  {
    id: 'clinic.create_external_doctor',
    aliases: ['create_external_doctor'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Add an external doctor record.',
    variables: {
      // `handleCreateExternalDoctorLogic` — a directory record, so the fields
      // *are* the record. The address is split across six params rather than
      // one free-text field; declaring only `street` would silently drop the
      // rest of every address a planner tried to supply.
      name: {
        type: 'string',
        description: 'Doctor name.',
        required: false,
        resolver: 'none',
      },
      specialty: {
        type: 'string',
        description: 'Their specialty.',
        required: false,
        resolver: 'none',
      },
      clinicName: {
        type: 'string',
        description: 'Practice or clinic they work at.',
        required: false,
        resolver: 'none',
      },
      phone: {
        type: 'string',
        description: 'Contact phone number.',
        required: false,
        resolver: 'none',
      },
      email: {
        type: 'string',
        description: 'Contact email address.',
        required: false,
        resolver: 'none',
      },
      fax: {
        type: 'string',
        description: 'Fax number, still used for referrals in some markets.',
        required: false,
        resolver: 'none',
      },
      street: {
        type: 'string',
        description: 'Street address.',
        required: false,
        resolver: 'none',
      },
      unit: {
        type: 'string',
        description: 'Suite or unit number.',
        required: false,
        resolver: 'none',
      },
      city: {
        type: 'string',
        description: 'City.',
        required: false,
        resolver: 'none',
      },
      province: {
        type: 'string',
        description: 'Province or state.',
        required: false,
        resolver: 'none',
      },
      postalCode: {
        type: 'string',
        description: 'Postal or ZIP code.',
        required: false,
        resolver: 'none',
      },
      country: {
        type: 'string',
        description: 'Country.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add Dr Smith as a referrer', 'create an external doctor'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'clinic.update_external_doctor',
      captures: ['doctorId', 'previousValues'],
    },
    handler: 'AiExternalDoctorsService',
  },
  {
    id: 'operations.create_schedule_template',
    aliases: ['create_schedule_template'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Create a reusable schedule template.',
    // §177 (C2/T1) — `prepareCreateScheduleTemplatePlan` reads the name and
    // periods directly and shares `parseTimeWindow` / `parseWeekdaysFromParams`.
    variables: {
      templateName: {
        type: 'string',
        description: 'Name of the template. `name` is accepted as an alias.',
        required: false,
        resolver: 'none',
      },
      name: {
        type: 'string',
        description: 'Alias for `templateName`.',
        required: false,
        resolver: 'none',
      },
      periods: {
        type: 'object[]',
        description:
          'Explicit working periods, when not expressed as a window.',
        required: false,
        resolver: 'none',
      },
      timeFrom: {
        type: 'string',
        description: 'Start of the daily window.',
        required: false,
        resolver: 'none',
      },
      timeTo: {
        type: 'string',
        description: 'End of the daily window.',
        required: false,
        resolver: 'none',
      },
      weekdays: {
        type: 'string[]',
        description: 'Days of the week the window applies to.',
        required: false,
        resolver: 'none',
      },
      applyDays: {
        type: 'string[]',
        description: 'Alias for `weekdays`, read by `parseWeekdaysFromParams`.',
        required: false,
        resolver: 'none',
      },
      // §304 (`e2e-bug.462`): found by following the chain, not by the validator
      // diff — `handleCreateScheduleTemplate` delegates to
      // `prepareCreateScheduleTemplatePlan`, which reads both directly and also
      // calls `resolveServices(services, params)`. The validator never mentions
      // them, so only the chain walk surfaced these two.
      serviceName: {
        type: 'string',
        description: 'Service this template schedules.',
        required: false,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Services this template schedules.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['save this as a template', 'create a schedule template'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'operations.delete_schedule_templates',
      captures: ['templateId'],
    },
    handler: 'AiCommandService',
  },
  {
    id: 'operations.create_service',
    aliases: ['create_service'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Create a bookable service in the catalogue.',
    // §177 (C2/T1) — `parseServiceDraft` reads these, each with an alias pair for
    // name and duration.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Name of the service. `name` is accepted as an alias.',
        required: false,
        resolver: 'none',
      },
      name: {
        type: 'string',
        description: 'Alias for `serviceName`.',
        required: false,
        resolver: 'none',
      },
      durationMinutes: {
        type: 'number',
        description:
          'Length of the service. `duration` is accepted as an alias.',
        required: false,
        resolver: 'none',
      },
      duration: {
        type: 'number',
        description: 'Alias for `durationMinutes`.',
        required: false,
        resolver: 'none',
      },
      price: {
        type: 'number',
        description: 'Price charged.',
        required: false,
        resolver: 'money',
      },
      currency: {
        type: 'string',
        description: 'Currency for the price.',
        required: false,
        resolver: 'none',
      },
      bufferMinutes: {
        type: 'number',
        description: 'Gap left after the service.',
        required: false,
        resolver: 'none',
      },
      description: {
        type: 'string',
        description: 'Customer-facing description.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add a new haircut service', 'create a service'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'Bookings may already reference the service; removing it needs a booking check.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'operations.create_services',
    aliases: ['create_services'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Create several services at once.',
    // §177 slice 16 — **corrected**. Was exempted as `ORCHESTRATION_NO_CONTRACT`
    // on the stated grounds that it "routes through `runOrchestrationIntent`,
    // which takes the raw message as its `intent`". It does not:
    // `ai-command.service.ts` builds `bulkCreateParams` from `params` and calls
    // `handleCreateServices`, which reads three structured fields.
    variables: {
      services: {
        type: 'object[]',
        description:
          'The services to create, as structured rows rather than prose.',
        required: true,
        resolver: 'none',
      },
      categoryName: {
        type: 'string',
        description: 'Category the new services belong to.',
        required: false,
        resolver: 'none',
      },
      currency: {
        type: 'string',
        description: 'Currency for the supplied prices.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add these five services', 'create them all'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many services at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'operations.day_replan',
    aliases: ['day_replan'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Replan a whole day of appointments.',
    variables: {
      // `handleDayReplan`. `_timeZone` is pipeline-injected and deliberately
      // not declared.
      //
      // §303: `dateFrom`/`dateTo` were missing. `handleDayReplan` calls
      // `resolveDateRange(params, prompt, timeZone)`, which reads both at depth
      // 1 — the command's own completion rule already says so
      // (`date || (dateFrom && dateTo)`), and the validator was the only place
      // that admitted it. Found by diffing `ACTION_RULES` against the declared
      // variables (`e2e-bug.462`); the handler *body* writes `dateFrom` onto a
      // downstream object and never reads it, so a body grep says the opposite.
      date: {
        type: 'string',
        description: 'Day to replan, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description:
          'Start of a multi-day replan window, ISO 8601 date. Used with dateTo when no single date is given.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description:
          'End of a multi-day replan window, ISO 8601 date. Used with dateFrom.',
        required: false,
        resolver: 'date',
      },
      allProviders: {
        type: 'boolean',
        description: 'Replan the whole team rather than one provider.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['replan today', 'sort out the day'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many bookings at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'operations.deactivate_employee',
    aliases: ['deactivate_employee'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Deactivate a staff member.',
    variables: {
      // `handleDeactivateEmployeeLogic`. The only input, and still not
      // required: it falls back to `extractEmployeeNameFromPrompt`, which is
      // what makes "Mary has left" work.
      employeeName: {
        type: 'string',
        description:
          'Which team member to deactivate. Falls back to a name found in the message; matched against the active roster.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: [
      'Mary has left',
      'deactivate that employee',
      'Deactivate the employee QA Test Employee',
    ],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Their bookings and assignments were changed on deactivation; reactivating does not restore them.',
    },
    handler: 'AiOperationsService',
  },
  {
    id: 'operations.delete_schedule_block',
    aliases: ['delete_schedule_block'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Delete a schedule block, freeing the time.',
    // §177 (C2/T1) — `resolveEmployees` supplies the provider trio; the day comes
    // from `params.date` (`resolveScheduleDates` reads no params of its own).
    variables: {
      employeeName: {
        type: 'string',
        description: 'Provider whose block is being removed.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Several providers.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Remove the block for every provider.',
        required: false,
        resolver: 'none',
      },
      date: {
        type: 'string',
        description: 'Day the block sits on.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['remove that block', 'delete the block on friday'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'operations.block_schedule',
      captures: ['employeeId', 'previousBlock'],
    },
    handler: 'AiScheduleHandlersService',
  },
  {
    id: 'operations.delete_schedule_templates',
    aliases: ['delete_schedule_templates'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Delete schedule templates.',
    // §177 (C2/T1) — one template or several. `resolveTemplate` takes the name as
    // a string argument rather than reading `params`, so the reads are here.
    variables: {
      templateName: {
        type: 'string',
        description: 'Template to delete.',
        required: false,
        resolver: 'none',
      },
      templateNames: {
        type: 'string[]',
        description: 'Several templates to delete.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['delete that template', 'remove the old templates'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Schedules created from the template are unaffected, but the template itself must be rebuilt by hand.',
    },
    handler: 'AiScheduleHandlersService',
  },
  {
    id: 'business.diagnose_stripe_checkout_failure',
    aliases: ['diagnose_stripe_checkout_failure'],
    domain: 'business',
    surfaces: ['customer', 'public', 'dashboard'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Diagnose why a Stripe checkout failed.',
    variables: {},
    examples: ['why did checkout fail', 'diagnose the payment error'],
    confirm: 'never',
    handler: 'AiBusinessCurrencyService',
  },
  {
    id: 'tour.diagnose_capacity',
    aliases: ['diagnose_tour_capacity'],
    domain: 'tour',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Diagnose why a tour cannot take more bookings.',
    // §202 (C2/T0) — `parseDiagnoseTourCapacityFromPrompt` and the proactive
    // variant read the pax and date pair; the handler reads the checkout flag.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the answer is being asked for.',
        required: false,
        resolver: 'none',
      },
      serviceId: {
        type: 'string',
        description: 'Tour, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Tour, by name.',
        required: false,
        resolver: 'service',
      },
      tourGroupCheckout: {
        type: 'boolean',
        description: 'Whether the ask is part of a group-checkout flow.',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      date: {
        type: 'string',
        description: 'Departure date asked about.',
        required: false,
        resolver: 'date',
      },
      dateKey: {
        type: 'string',
        description: 'Departure date as a day key.',
        required: false,
        resolver: 'date',
      },
      paxCount: {
        type: 'number',
        description: 'How many travellers.',
        required: false,
        resolver: 'none',
      },
      requestedPax: {
        type: 'number',
        description:
          'Travellers requested, when different from the party size.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['why is the tour full', 'diagnose tour capacity'],
    confirm: 'never',
    handler: 'AiTourServiceService',
  },
  {
    id: 'recommendation.dismiss',
    aliases: ['dismiss_recommendations'],
    domain: 'commerce',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'Dismiss product recommendations.',
    // §177 (C2/T1) — the customer-side dismissal; `parseDismissRecommendationsFromPrompt`
    // reads both fields and the chain ends there.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking whose recommendations are dismissed.',
        required: false,
        resolver: 'appointment',
      },
      serviceId: {
        type: 'string',
        description: 'Service whose recommendations are dismissed.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['stop showing me these', 'dismiss the recommendations'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'recommendation.dismiss',
      captures: ['previousState'],
    },
    handler: 'AiRecommendationProductService',
  },
  {
    id: 'operations.duplicate_schedule_template',
    aliases: ['duplicate_schedule_template'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Copy a schedule template.',
    // §177 (C2/T1) — the source template is the whole input; the copy is named by
    // the handler.
    variables: {
      templateName: {
        type: 'string',
        description: 'Template to copy.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['copy that template', 'duplicate the standard week'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'operations.delete_schedule_templates',
      captures: ['templateId'],
    },
    handler: 'AiScheduleHandlersService',
  },
  {
    id: 'compliance.enable_hipaa_mode',
    aliases: ['enable_hipaa_mode'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Turn HIPAA mode on for the business.',
    variables: {
      // `extractEnableHipaaModeFields`. `enabled` is read from params first,
      // then inferred from enable/disable wording in the message — including
      // Armenian and Russian. The description says "turn on", but the command
      // turns it **off** too, which is the direction worth being explicit
      // about on a safeguards toggle.
      enabled: {
        type: 'boolean',
        description:
          'Turn HIPAA safeguards on or off. Falls back to enable/disable wording in the message.',
        required: false,
        resolver: 'none',
      },
      sessionTimeoutMinutes: {
        type: 'number',
        description:
          'Idle timeout enforced under HIPAA mode. Left unchanged when not supplied.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['turn on HIPAA mode', 'enable HIPAA compliance'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'HIPAA mode changes how data is stored and audited; reversing it is a compliance decision.',
    },
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'operations.explain_ai_audit_log',
    aliases: ['explain_ai_audit_log'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the assistant audit log.',
    // §211 (C2/T0) — page size.
    variables: {
      limit: {
        type: 'number',
        description: 'How many log entries to return.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what is in the AI audit log', 'explain the audit trail'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.explain_ai_capabilities',
    aliases: ['explain_ai_capabilities'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Explain what the assistant can do.',
    variables: {},
    examples: ['what can you do', 'explain your capabilities'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'guide.explain_ai_settings',
    aliases: ['explain_ai_settings'],
    domain: 'guide',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the assistant settings.',
    // §190 (C2/T0) — `dispatchMetaProductGuideIntent` reads only the date.
    variables: {
      date: {
        type: 'string',
        description:
          'Day the explanation is scoped to, when the topic is time-bound.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['what are the AI settings', 'explain assistant options'],
    confirm: 'never',
    handler: 'AiProductGuideService',
  },
  {
    id: 'operations.explain_ai_usage_analytics',
    aliases: ['explain_ai_usage_analytics'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how assistant usage is measured.',
    // §211 (C2/T0) — window length.
    variables: {
      days: {
        type: 'number',
        description: 'How many days the analytics cover.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how is AI usage tracked', 'explain usage analytics'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'provider.explain_any_provider_option',
    aliases: ['explain_any_provider_option'],
    domain: 'provider',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain what booking with any available provider means.',
    // §212 (C2/T0) — aspect plus reply locale.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      locale: {
        type: 'string',
        description: 'Locale for the reply.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'what does any provider mean',
      'explain the any specialist option',
    ],
    confirm: 'never',
    handler: 'AiProviderSpecialtyService',
  },
  {
    id: 'guide.explain_app_feature',
    aliases: ['explain_app_feature'],
    domain: 'guide',
    surfaces: ['dashboard', 'customer', 'public', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
      provider: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain a feature of the app.',
    // §190 (C2/T0) — `dispatchProductGuideIntent` reads both.
    variables: {
      topicId: {
        type: 'string',
        description: 'Guide topic being explained.',
        required: false,
        resolver: 'none',
      },
      date: {
        type: 'string',
        description:
          'Day the explanation is scoped to, when the topic is time-bound.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['what does this do', 'explain this feature'],
    confirm: 'never',
    handler: 'AiProductGuideService',
  },
  {
    id: 'business.explain_booking_date_format',
    aliases: ['explain_booking_date_format'],
    domain: 'business',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain the date format used on bookings.',
    variables: {},
    examples: ['what date format do bookings use', 'explain booking dates'],
    confirm: 'never',
    handler: 'AiBusinessDateFormatService',
  },
  {
    id: 'business.explain_booking_languages',
    aliases: ['explain_booking_languages'],
    domain: 'business',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain which languages booking is offered in.',
    variables: {},
    examples: [
      'what languages can customers book in',
      'explain booking languages',
    ],
    confirm: 'never',
    handler: 'AiBusinessLanguagesService',
  },
  {
    id: 'business.explain_currency',
    aliases: ['explain_business_currency'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the currency the business trades in.',
    variables: {},
    examples: [
      'what currency are we in',
      'explain our currency',
      'What currency is my business set to?',
    ],
    confirm: 'never',
    handler: 'AiBusinessCurrencyService',
  },
  {
    id: 'business.explain_date_format',
    aliases: ['explain_business_date_format'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the business date format setting.',
    variables: {},
    examples: ['what is our date format', 'explain our date display'],
    confirm: 'never',
    handler: 'AiBusinessDateFormatService',
  },
  {
    id: 'business.explain_hours_and_location',
    aliases: ['explain_business_hours_and_location'],
    domain: 'business',
    surfaces: ['dashboard', 'customer', 'public'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain the opening hours and where the business is.',
    // §213 (C2/T0) — aspect plus the day asked about.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      weekday: {
        type: 'string',
        description: 'Day of the week asked about.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['when are you open', 'where are you based'],
    confirm: 'never',
    handler: 'AiBusinessHoursLocationService',
  },
  {
    id: 'business.explain_languages',
    aliases: ['explain_business_languages'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the languages the business offers.',
    variables: {},
    examples: ['what languages do we support', 'explain our languages'],
    confirm: 'never',
    handler: 'AiBusinessLanguagesService',
  },
  {
    id: 'business.explain_tax',
    aliases: ['explain_business_tax'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how tax is charged.',
    // §208 (C2/T0) — same worked-example price.
    variables: {
      samplePrice: {
        type: 'number',
        description: 'Price the worked example is calculated from.',
        required: false,
        resolver: 'money',
      },
    },
    examples: ['how does tax work here', 'explain our tax setup'],
    confirm: 'never',
    handler: 'AiBusinessTaxService',
  },
  {
    id: 'business.explain_checkout_currency',
    aliases: ['explain_checkout_currency'],
    domain: 'business',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain the currency shown at checkout.',
    variables: {},
    examples: ['why is checkout in dollars', 'explain the checkout currency'],
    confirm: 'never',
    handler: 'AiBusinessCurrencyService',
  },
  {
    id: 'recommendation.explain_checkout',
    aliases: ['explain_checkout_recommendations'],
    domain: 'commerce',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain the products suggested at checkout.',
    // §212 (C2/T0) — the checkout being explained.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      bookingId: {
        type: 'string',
        description: 'Booking at checkout.',
        required: false,
        resolver: 'appointment',
      },
      productName: {
        type: 'string',
        description: 'Recommended product in question.',
        required: false,
        resolver: 'none',
      },
      serviceId: {
        type: 'string',
        description: 'Service, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Service, by name.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['why is it suggesting this', 'explain checkout recommendations'],
    confirm: 'never',
    handler: 'AiRecommendationProductService',
  },
  {
    id: 'business.explain_checkout_tax',
    aliases: ['explain_checkout_tax'],
    domain: 'business',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain the tax charged at checkout.',
    // §208 (C2/T0) — `parseExplainCheckoutTaxFromPrompt` reads the aspect.
    variables: {
      aspect: {
        type: 'string',
        description:
          'Which part of the tax breakdown is being asked about.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['why is there tax on this', 'explain checkout tax'],
    confirm: 'never',
    handler: 'AiBusinessTaxService',
  },
  {
    id: 'clinic.explain_booking',
    aliases: ['explain_clinic_booking'],
    domain: 'clinic',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain how clinic bookings work.',
    // §214 (C2/T0) — aspect plus the service.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      serviceId: {
        type: 'string',
        description: 'Service, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Service, by name.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['how does clinic booking work', 'explain clinic appointments'],
    confirm: 'never',
    handler: 'AiClinicBookingService',
  },
  {
    id: 'clinic.explain_services',
    aliases: ['explain_clinic_services'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the clinical services offered.',
    // §214 (C2/T0) — the service, and the reply locale.
    variables: {
      serviceId: {
        type: 'string',
        description: 'Service, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Service, by name.',
        required: false,
        resolver: 'service',
      },
      locale: {
        type: 'string',
        description: 'Locale for the reply.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'what clinic services do we offer',
      'explain our clinical services',
      'Explain our clinic services and department counts',
      'Բացատրիր մեր կլինիկական ծառայությունները և բաժինները',
    ],
    confirm: 'never',
    handler: 'AiClinicServiceService',
  },
  {
    id: 'compliance.explain_status',
    aliases: ['explain_compliance_status'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Report the current compliance posture.',
    // §190 (C2/T0) — `aspect` is this cluster's house pattern: the sub-topic the
    // explainer narrows to, read by its `parse*FromPrompt` helper.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of compliance status to explain.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['are we compliant', 'explain our compliance status'],
    confirm: 'never',
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'recommendation.explain_checkout_success',
    aliases: ['explain_consumer_checkout_success'],
    domain: 'commerce',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain what happens after a successful checkout.',
    // §212 (C2/T0) — the completed checkout.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      bookingId: {
        type: 'string',
        description: 'Booking that completed.',
        required: false,
        resolver: 'appointment',
      },
      locale: {
        type: 'string',
        description: 'Locale for the reply.',
        required: false,
        resolver: 'none',
      },
      serviceId: {
        type: 'string',
        description: 'Service, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Service, by name.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['what happens now I have paid', 'explain the success screen'],
    confirm: 'never',
    handler: 'AiRecommendationProductService',
  },
  {
    id: 'business.explain_consumer_checkout_tax',
    aliases: ['explain_consumer_checkout_tax'],
    domain: 'business',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain the tax a customer is charged.',
    // §208 (C2/T0) — the consumer-side twin, same aspect.
    variables: {
      aspect: {
        type: 'string',
        description:
          'Which part of the tax breakdown is being asked about.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['why am I paying tax', 'explain the tax on my booking'],
    confirm: 'never',
    handler: 'AiBusinessTaxService',
  },
  {
    id: 'guide.explain_current_screen',
    aliases: ['explain_current_screen'],
    domain: 'guide',
    surfaces: ['dashboard', 'customer', 'public', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
      provider: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain the screen the user is looking at.',
    // §190 (C2/T0) — `dispatchProductGuideIntent` reads both.
    variables: {
      topicId: {
        type: 'string',
        description: 'Guide topic being explained.',
        required: false,
        resolver: 'none',
      },
      date: {
        type: 'string',
        description:
          'Day the explanation is scoped to, when the topic is time-bound.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['what is this screen', 'explain what I am looking at'],
    confirm: 'never',
    handler: 'AiProductGuideService',
  },
  {
    id: 'compliance.explain_data_rights',
    aliases: ['explain_data_rights'],
    domain: 'compliance',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain what data rights customers have.',
    // §190 (C2/T0) — `aspect` is this cluster's house pattern: the sub-topic the
    // explainer narrows to, read by its `parse*FromPrompt` helper.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which data right to explain.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what rights do customers have', 'explain data rights'],
    confirm: 'never',
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'business.explain_date_input_format',
    aliases: ['explain_date_input_format'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how typed dates are interpreted.',
    variables: {},
    examples: ['how should I type dates', 'explain date input'],
    confirm: 'never',
    handler: 'AiBusinessDateFormatService',
  },
  {
    id: 'guide.explain_empty_catalog',
    aliases: ['explain_empty_catalog'],
    domain: 'guide',
    surfaces: ['dashboard', 'provider', 'customer', 'public'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain what to do when the catalogue is empty.',
    variables: {},
    examples: ['why is my catalogue empty', 'what do I do first'],
    confirm: 'never',
    handler: 'AiProductGuideEmptyStateService',
  },
  {
    id: 'compliance.explain_enterprise_trust',
    aliases: ['explain_enterprise_trust'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the enterprise trust and security posture.',
    // §190 (C2/T0) — `aspect` is this cluster's house pattern: the sub-topic the
    // explainer narrows to, read by its `parse*FromPrompt` helper.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which trust topic to explain.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'what do we tell enterprise buyers',
      'explain our trust posture',
    ],
    confirm: 'never',
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'compliance.explain_gdpr_checklist',
    aliases: ['explain_gdpr_checklist'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the GDPR compliance checklist.',
    // §190 (C2/T0) — `aspect` is this cluster's house pattern: the sub-topic the
    // explainer narrows to, read by its `parse*FromPrompt` helper.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which checklist item to explain.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['show our GDPR checklist', 'are we GDPR ready'],
    confirm: 'never',
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'guest.explain_checkout_fields',
    aliases: ['explain_guest_checkout_fields'],
    domain: 'customer',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain the fields asked for at guest checkout.',
    // §213 (C2/T0) — aspect only.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['why do you need my email', 'explain these checkout fields'],
    confirm: 'never',
    handler: 'AiGuestCheckoutFieldsService',
  },
  {
    id: 'compliance.explain_hipaa_session_timeout',
    aliases: ['explain_hipaa_session_timeout'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the HIPAA session timeout rule.',
    // §190 (C2/T0) — a boolean rather than an aspect: whether the question is
    // about the caller's own logout or the business policy.
    variables: {
      personalLogout: {
        type: 'boolean',
        description:
          'Explain the caller\u2019s own logout rather than the business policy.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['why did it log me out', 'explain the HIPAA timeout'],
    confirm: 'never',
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'compliance.explain_minimum_necessary_phi',
    aliases: ['explain_minimum_necessary_phi_access'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the minimum-necessary rule for PHI access.',
    // §190 (C2/T0) — `aspect` is this cluster's house pattern: the sub-topic the
    // explainer narrows to, read by its `parse*FromPrompt` helper.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which aspect of minimum-necessary access to explain.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['who can see patient data', 'explain minimum necessary access'],
    confirm: 'never',
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'guide.explain_multi_service_payment_return',
    aliases: ['explain_multi_service_payment_return'],
    domain: 'guide',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description:
      'Explain what happens after returning from a multi-service checkout.',
    // §214 (C2/T0) — the pending multi-service checkout being returned to.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      slug: {
        type: 'string',
        description: 'Business slug.',
        required: false,
        resolver: 'none',
      },
      bookingDraftSlug: {
        type: 'string',
        description: 'Slug held on the booking draft.',
        required: false,
        resolver: 'none',
      },
      cartServiceIds: {
        type: 'string[]',
        description: 'Services in the cart.',
        required: false,
        resolver: 'service',
      },
      services: {
        type: 'string[]',
        description: 'Services in the cart (alternate key).',
        required: false,
        resolver: 'service',
      },
      pendingMultiCheckoutPayment: {
        type: 'object',
        description: 'The pending checkout payment.',
        required: false,
        resolver: 'none',
      },
      pendingMultiCheckoutSessionId: {
        type: 'string',
        description: 'Checkout session being returned from.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'I paid but the booking is not confirmed',
      'what happens after paying for a spa day',
    ],
    confirm: 'never',
    handler: 'AiExplainMultiServicePaymentReturnService',
  },
  {
    id: 'business.explain_notification_currency',
    aliases: ['explain_notification_currency'],
    domain: 'business',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain the currency used in notifications.',
    variables: {},
    examples: ['what currency do alerts use', 'explain notification currency'],
    confirm: 'never',
    handler: 'AiBusinessCurrencyService',
  },
  {
    id: 'business.explain_notification_date_format',
    aliases: ['explain_notification_date_format'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the date format used in notifications.',
    variables: {},
    examples: ['what date format do alerts use', 'explain notification dates'],
    confirm: 'never',
    handler: 'AiBusinessDateFormatService',
  },
  {
    id: 'business.explain_package_currency',
    aliases: ['explain_package_currency'],
    domain: 'business',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain the currency package prices are shown in.',
    variables: {},
    examples: ['what currency are packages in', 'explain package currency'],
    confirm: 'never',
    handler: 'AiBusinessCurrencyService',
  },
  {
    id: 'business.explain_package_display_name',
    aliases: ['explain_package_display_name'],
    domain: 'business',
    surfaces: ['public', 'dashboard', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain which package name is shown and why.',
    // §214 (C2/T0) — the package and the locale it is shown in.
    variables: {
      packageId: {
        type: 'string',
        description: 'Package, by id.',
        required: false,
        resolver: 'none',
      },
      packageName: {
        type: 'string',
        description: 'Package, by name.',
        required: false,
        resolver: 'none',
      },
      locale: {
        type: 'string',
        description: 'Locale the name is shown in.',
        required: false,
        resolver: 'none',
      },
      visitorLocale: {
        type: 'string',
        description: 'Visitor locale (alternate key).',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['why is the package called that', 'explain the package name'],
    confirm: 'never',
    handler: 'AiPackageLocalizedNamesService',
  },
  {
    id: 'compliance.explain_phi_encryption',
    aliases: ['explain_phi_encryption_status'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Report how patient data is encrypted.',
    // §190 (C2/T0) — scoped to one field rather than a topic.
    variables: {
      fieldName: {
        type: 'string',
        description: 'PHI field whose encryption status is being explained.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['is patient data encrypted', 'explain PHI encryption'],
    confirm: 'never',
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'provider.explain_professional_profile',
    aliases: ['explain_professional_profile'],
    domain: 'provider',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain what is on a provider professional profile.',
    // §212 (C2/T0) — the provider whose profile is explained.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      employeeId: {
        type: 'string',
        description: 'Provider, by id.',
        required: false,
        resolver: 'employee',
      },
      providerName: {
        type: 'string',
        description: 'Provider, by name.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['what is on their profile', 'explain the professional profile'],
    confirm: 'never',
    handler: 'AiProviderSpecialtyService',
  },
  {
    id: 'business.explain_provider_date_display',
    aliases: ['explain_provider_date_display'],
    domain: 'business',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how dates appear in the provider app.',
    variables: {},
    examples: ['why do dates look like this', 'explain provider date display'],
    confirm: 'never',
    handler: 'AiBusinessDateFormatService',
  },
  {
    id: 'business.explain_provider_payment_currency',
    aliases: ['explain_provider_payment_currency'],
    domain: 'business',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the currency providers are paid in.',
    variables: {},
    examples: ['what currency am I paid in', 'explain provider currency'],
    confirm: 'never',
    handler: 'AiBusinessCurrencyService',
  },
  {
    id: 'compliance.explain_provider_session_timeout',
    aliases: ['explain_provider_session_timeout'],
    domain: 'compliance',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the provider app session timeout.',
    variables: {},
    examples: ['why does the app log me out', 'explain the session timeout'],
    confirm: 'never',
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'provider.explain_specialty',
    aliases: ['explain_provider_specialty'],
    domain: 'provider',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain what a provider specialises in.',
    // §212 (C2/T0) — the provider and the topic asked about.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      providerName: {
        type: 'string',
        description: 'Provider whose specialty is explained.',
        required: false,
        resolver: 'employee',
      },
      specialtyTopic: {
        type: 'string',
        description: 'Specialty topic asked about.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what is Gevorg best at', 'explain their specialty'],
    confirm: 'never',
    handler: 'AiProviderSpecialtyService',
  },
  {
    id: 'recommendation.explain_analytics',
    aliases: ['explain_recommendation_analytics'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how recommendation performance is measured.',
    // §212 (C2/T0) — scoped by product, surface and window.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      productName: {
        type: 'string',
        description: 'Product the analytics cover.',
        required: false,
        resolver: 'none',
      },
      surface: {
        type: 'string',
        description: 'Surface the analytics cover.',
        required: false,
        resolver: 'none',
      },
      daysAhead: {
        type: 'number',
        description: 'How many days the window covers.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'how are recommendations measured',
      'explain recommendation analytics',
    ],
    confirm: 'never',
    handler: 'AiRecommendationProductService',
  },
  {
    id: 'recommendation.explain_setup',
    aliases: ['explain_recommendation_setup'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how to set up product recommendations.',
    // §212 (C2/T0) — what the recommendation is being set up against.
    variables: {
      serviceId: {
        type: 'string',
        description: 'Service, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Service, by name.',
        required: false,
        resolver: 'service',
      },
      categoryId: {
        type: 'string',
        description: 'Category, by id.',
        required: false,
        resolver: 'none',
      },
      categoryName: {
        type: 'string',
        description: 'Category, by name.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'how do I set up recommendations',
      'explain recommendation setup',
    ],
    confirm: 'never',
    handler: 'AiRecommendationProductService',
  },
  {
    id: 'business.explain_reports_currency',
    aliases: ['explain_reports_currency'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the currency used in reports.',
    variables: {},
    examples: ['what currency are reports in', 'explain report currency'],
    confirm: 'never',
    handler: 'AiBusinessCurrencyService',
  },
  {
    id: 'guide.explain_rtl_layout',
    aliases: ['explain_rtl_layout'],
    domain: 'guide',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain right-to-left layout support.',
    // §214 (C2/T0) — the direction and locale in play.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      locale: {
        type: 'string',
        description: 'Locale in play.',
        required: false,
        resolver: 'none',
      },
      dir: {
        type: 'string',
        description: 'Text direction.',
        required: false,
        resolver: 'none',
      },
      documentDirection: {
        type: 'string',
        description: 'Document direction (alternate key).',
        required: false,
        resolver: 'none',
      },
    },
    // Armenian phrasing from live traffic. §86 — examples feed the embedding
    // cache as well as the few-shots, so a command whose users write Armenian
    // needs Armenian here to be retrievable at all.
    examples: [
      'is this app right to left',
      'explain RTL layout',
      'Ինչու է տեքստը աջից',
    ],
    confirm: 'never',
    handler: 'AiExplainRtlLayoutService',
  },
  {
    id: 'business.explain_salon_profile',
    aliases: ['explain_salon_profile'],
    domain: 'business',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain what is on the public salon profile.',
    // §213 (C2/T0) — aspect only.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what does our profile show', 'explain the salon profile'],
    confirm: 'never',
    handler: 'AiBusinessHoursLocationService',
  },
  {
    id: 'guide.explain_slot_no_longer_available',
    aliases: ['explain_slot_no_longer_available'],
    domain: 'guide',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain that a slot has been taken.',
    // §214 (C2/T0) — the slot that was lost.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      serviceId: {
        type: 'string',
        description: 'Service, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Service, by name.',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Day of the lost slot.',
        required: false,
        resolver: 'date',
      },
      bookingDraftDate: {
        type: 'string',
        description: 'Day held on the booking draft.',
        required: false,
        resolver: 'date',
      },
      startTime: {
        type: 'string',
        description: 'Start time of the lost slot.',
        required: false,
        resolver: 'datetime',
      },
      timeSlot: {
        type: 'string',
        description: 'Slot, as a time string.',
        required: false,
        resolver: 'none',
      },
      employeeId: {
        type: 'string',
        description: 'Provider, by id.',
        required: false,
        resolver: 'employee',
      },
      employeeName: {
        type: 'string',
        description: 'Provider, by name.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['that slot has gone', 'why can I not book that time'],
    confirm: 'never',
    handler: 'AiExplainSlotNoLongerAvailableService',
  },
  {
    id: 'business.explain_stacked_tax',
    aliases: ['explain_stacked_tax'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how stacked tax rules combine.',
    // §208 (C2/T0) — the explanation is worked through a sample price.
    variables: {
      samplePrice: {
        type: 'number',
        description: 'Price the worked example is calculated from.',
        required: false,
        resolver: 'money',
      },
    },
    examples: ['why are there two taxes', 'explain stacked tax'],
    confirm: 'never',
    handler: 'AiBusinessTaxService',
  },
  {
    id: 'compliance.explain_strategy_eval',
    aliases: ['explain_strategy_eval'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the recorded compliance strategy evaluation.',
    // §190 (C2/T0) — `aspect` is this cluster's house pattern: the sub-topic the
    // explainer narrows to, read by its `parse*FromPrompt` helper.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the strategy evaluation to explain.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what is our strategy evaluation', 'explain the assessment'],
    confirm: 'never',
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'business.explain_stripe_checkout_currency',
    aliases: ['explain_stripe_checkout_currency'],
    domain: 'business',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain the currency Stripe charges in.',
    variables: {},
    examples: ['what currency does stripe use', 'explain stripe currency'],
    confirm: 'never',
    handler: 'AiBusinessCurrencyService',
  },
  {
    id: 'business.explain_stripe_currency_warning',
    aliases: ['explain_stripe_currency_warning'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain a Stripe currency mismatch warning.',
    variables: {},
    examples: [
      'why is stripe warning about currency',
      'explain that currency warning',
    ],
    confirm: 'never',
    handler: 'AiBusinessCurrencyService',
  },
  {
    id: 'guide.explain_stripe_not_connected',
    aliases: ['explain_stripe_not_connected'],
    domain: 'guide',
    surfaces: ['dashboard', 'customer', 'public'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain what to do when Stripe is not connected.',
    variables: {},
    examples: ['why can I not take payments', 'stripe is not connected'],
    confirm: 'never',
    handler: 'AiProductGuideEmptyStateService',
  },
  {
    id: 'business.explain_stripe_tax_charge',
    aliases: ['explain_stripe_tax_charge'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the tax line Stripe charged.',
    // §208 (C2/T0) — `parseExplainStripeTaxChargeFromPrompt` reads the booking;
    // `resolveBookingForTaxQuery` then looks it up by id or by customer.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking whose tax is being explained.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Customer, used to find the booking when no id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['what is this stripe tax', 'explain the stripe tax charge'],
    confirm: 'never',
    handler: 'AiBusinessTaxService',
  },
  {
    id: 'business.explain_tenant_currency',
    aliases: ['explain_tenant_currency'],
    domain: 'business',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain the tenant level currency setting.',
    variables: {},
    examples: ['what is our tenant currency', 'explain tenant currency'],
    confirm: 'never',
    handler: 'AiBusinessCurrencyService',
  },
  {
    id: 'tour.explain_booking',
    aliases: ['explain_tour_booking'],
    domain: 'tour',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain how tour booking works.',
    // §202 (C2/T0) — `parseExplainTourBookingFromPrompt`.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the answer is being asked for.',
        required: false,
        resolver: 'none',
      },
      serviceId: {
        type: 'string',
        description: 'Tour, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Tour, by name.',
        required: false,
        resolver: 'service',
      },
      tourGroupCheckout: {
        type: 'boolean',
        description: 'Whether the ask is part of a group-checkout flow.',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      bookingFirstAvailable: {
        type: 'boolean',
        description:
          'Whether the ask is for the first available departure.',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
    },
    examples: ['how do tour bookings work', 'explain tour booking'],
    confirm: 'never',
    handler: 'AiTourServiceService',
  },
  {
    id: 'tour.explain_booking_record',
    aliases: ['explain_tour_booking_record'],
    domain: 'tour',
    surfaces: ['dashboard', 'customer', 'public'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain what is recorded on a tour booking.',
    // §202 (C2/T0) — `parseExplainTourBookingRecordFromPrompt` reads the
    // booking and customer; `resolveSessionCustomerId` reads the session.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the answer is being asked for.',
        required: false,
        resolver: 'none',
      },
      serviceName: {
        type: 'string',
        description: 'Tour, by name.',
        required: false,
        resolver: 'service',
      },
      bookingId: {
        type: 'string',
        description: 'Tour booking in question.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description: 'Traveller on the booking.',
        required: false,
        resolver: 'customer',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Customer from the current session.',
        required: false,
        resolver: 'none',
      },
      customerId: {
        type: 'string',
        description: 'Customer the record belongs to.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['what is on that tour booking', 'explain the tour record'],
    confirm: 'never',
    handler: 'AiTourServiceService',
  },
  {
    id: 'tour.explain_calendar_span',
    aliases: ['explain_tour_calendar_span'],
    domain: 'tour',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how a tour spans the calendar.',
    // §202 (C2/T0) — `parseExplainTourCalendarSpanFromPrompt` plus the locale.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the answer is being asked for.',
        required: false,
        resolver: 'none',
      },
      serviceId: {
        type: 'string',
        description: 'Tour, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Tour, by name.',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Date inside the span wanted.',
        required: false,
        resolver: 'date',
      },
      weekStartDate: {
        type: 'string',
        description: 'First day of the span.',
        required: false,
        resolver: 'date',
      },
      locale: {
        type: 'string',
        description: 'Locale for day and month names.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'why does the tour block the whole day',
      'explain the tour span',
      'Ինչու՞ շրջագայությունը երևում է մի քանի օր օրացույցում',
    ],
    confirm: 'never',
    handler: 'AiTourServiceService',
  },
  {
    id: 'tour.explain_day_slots',
    aliases: ['explain_tour_day_slots'],
    domain: 'tour',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain the departure slots on a tour day.',
    // §202 (C2/T0) — `parseExplainTourDaySlotsFromPrompt`.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the answer is being asked for.',
        required: false,
        resolver: 'none',
      },
      serviceId: {
        type: 'string',
        description: 'Tour, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Tour, by name.',
        required: false,
        resolver: 'service',
      },
      tourGroupCheckout: {
        type: 'boolean',
        description: 'Whether the ask is part of a group-checkout flow.',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      bookingFirstAvailable: {
        type: 'boolean',
        description:
          'Whether the ask is for the first available departure.',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      date: {
        type: 'string',
        description: 'Day asked about.',
        required: false,
        resolver: 'date',
      },
      dateKey: {
        type: 'string',
        description: 'Day asked about, as a day key.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['what departures are there', 'explain tour day slots'],
    confirm: 'never',
    handler: 'AiTourServiceService',
  },
  {
    id: 'tour.explain_meeting_point',
    aliases: ['explain_tour_meeting_point'],
    domain: 'tour',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain where a tour meets.',
    // §202 (C2/T0) — `parseExplainTourMeetingPointFromPrompt` reads the booking;
    // the handler falls back from `_timeZone` to `timeZone`.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the answer is being asked for.',
        required: false,
        resolver: 'none',
      },
      serviceName: {
        type: 'string',
        description: 'Tour, by name.',
        required: false,
        resolver: 'service',
      },
      bookingId: {
        type: 'string',
        description: 'Tour booking whose meeting point is wanted.',
        required: false,
        resolver: 'appointment',
      },
      sessionBookingId: {
        type: 'string',
        description: 'Booking the traveller is currently viewing.',
        required: false,
        resolver: 'none',
      },
      timeZone: {
        type: 'string',
        description: 'Time zone for the meeting time.',
        required: false,
        resolver: 'none',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Customer from the current session.',
        required: false,
        resolver: 'none',
      },
      customerId: {
        type: 'string',
        description: 'Customer the record belongs to.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['where does the tour start', 'what is the meeting point'],
    confirm: 'never',
    handler: 'AiTourServiceService',
  },
  {
    id: 'tour.explain_services',
    aliases: ['explain_tour_services'],
    domain: 'tour',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the tours offered.',
    // §202 (C2/T0) — `parseExplainTourServicesFromPrompt`.
    variables: {
      serviceId: {
        type: 'string',
        description: 'Tour, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Tour, by name.',
        required: false,
        resolver: 'service',
      },
      daysAhead: {
        type: 'number',
        description: 'How far ahead to look.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what tours do we run', 'explain our tours'],
    confirm: 'never',
    handler: 'AiTourServiceService',
  },
  {
    id: 'guide.explain_voice_input',
    aliases: ['explain_voice_input'],
    domain: 'guide',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain how to dictate to the assistant.',
    // §214 (C2/T0) — the speech error being explained.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      voiceError: {
        type: 'string',
        description: 'Voice error reported.',
        required: false,
        resolver: 'none',
      },
      voiceErrorCode: {
        type: 'string',
        description: 'Voice error code.',
        required: false,
        resolver: 'none',
      },
      speechErrorCode: {
        type: 'string',
        description: 'Speech recognition error code.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['can I talk to it', 'explain voice input'],
    confirm: 'never',
    handler: 'AiExplainVoiceInputService',
  },
  {
    id: 'guest.explain_why_sign_in',
    aliases: ['explain_why_sign_in'],
    domain: 'customer',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain why signing in is worth it.',
    // §213 (C2/T0) — aspect only.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['why should I sign in', 'what do I get by signing in'],
    confirm: 'never',
    handler: 'AiGuestCheckoutFieldsService',
  },
  {
    id: 'operations.fill_slot_from_waitlist',
    aliases: ['fill_slot_from_waitlist'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Fill a freed slot from the waitlist.',
    variables: {
      // `AiBookingCoreService.handleFillSlotFromWaitlist` — reached through
      // `dispatchMutatingIntent`, not this spec's `AiCommandService`.
      date: {
        type: 'string',
        description: 'Day the freed slot is on.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Time of the freed slot.',
        required: false,
        resolver: 'datetime',
      },
    },
    examples: [
      'fill that slot from the waitlist',
      'give the slot to a waitlister',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The customer has been offered and told about the slot.',
    },
    handler: 'AiBookingCoreService',
  },
  {
    id: 'operations.fill_unused_slots',
    aliases: ['fill_unused_slots'],
    domain: 'operations',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['staff', 'manager', 'owner'],
    },
    risk: 'T3',
    description: 'Offer unused slots to customers.',
    variables: {
      // `handleFillScheduleGaps` -> `parseTimeWindow` + `resolveDateRange` +
      // `resolveEmployees` + `resolveScheduleServicesForEmployee`.
      allProviders: {
        type: 'boolean',
        description:
          'Fill gaps across the whole team rather than one provider.',
        required: false,
        resolver: 'none',
      },
      employeeName: {
        type: 'string',
        description: 'Provider whose gaps are being filled.',
        required: false,
        resolver: 'employee',
      },
      timeFrom: {
        type: 'string',
        description: 'Earliest time to fill from, `HH:MM`.',
        required: false,
        resolver: 'none',
      },
      timeTo: {
        type: 'string',
        description: 'Latest time to fill to, `HH:MM`.',
        required: false,
        resolver: 'none',
      },
      dateFrom: {
        type: 'string',
        description: 'First day affected, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description:
          'Last day affected, ISO 8601 date. Same as `dateFrom` for a single day.',
        required: false,
        resolver: 'date',
      },
      // §304 (`e2e-bug.462`): `handleFillScheduleGaps` calls
      // `resolveDateRange(params, …)` (reads `date`) and
      // `resolveEmployeesVerdict(employees, params)` (reads `employeeNames` via
      // `getRequestedEmployeeNames`). Both were read at depth 1 and undeclared.
      date: {
        type: 'string',
        description: 'Single day to fill gaps on, ISO 8601 date. Alternative to dateFrom/dateTo.',
        required: false,
        resolver: 'date',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Fill gaps for these providers.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['fill my empty slots', 'offer the gaps to someone'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The message has been sent and cannot be unsent.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'guest.fix_checkout_validation_error',
    aliases: ['fix_checkout_validation_error'],
    domain: 'customer',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain how to fix a checkout validation error.',
    // §213 (C2/T0) — the field that failed, and the booking being attempted.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      serviceId: {
        type: 'string',
        description: 'Service on the attempted booking.',
        required: false,
        resolver: 'service',
      },
      employeeId: {
        type: 'string',
        description: 'Provider on the attempted booking.',
        required: false,
        resolver: 'employee',
      },
      packageId: {
        type: 'string',
        description: 'Package on the attempted booking.',
        required: false,
        resolver: 'none',
      },
      startTime: {
        type: 'string',
        description: 'Start time on the attempted booking.',
        required: false,
        resolver: 'datetime',
      },
    },
    examples: ['it says my email is invalid', 'how do I fix this error'],
    confirm: 'never',
    handler: 'AiGuestCheckoutFieldsService',
  },
  {
    id: 'business.get_directions',
    aliases: ['get_directions_to_salon'],
    domain: 'business',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Give directions to the business.',
    // §213 (C2/T0) — aspect only.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how do I get there', 'give me directions'],
    confirm: 'never',
    handler: 'AiBusinessHoursLocationService',
  },
  {
    id: 'operations.get_provider_calendar',
    aliases: ['get_provider_calendar'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Show a provider calendar.',
    // §211 (C2/T0) — `resolveDateRange` + `resolveEmployees`.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      employeeName: {
        type: 'string',
        description: 'Provider, by name.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Providers, by name.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Whether the whole team is in scope.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['show Gevorg calendar', 'what is on their schedule'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.give_ai_feedback',
    aliases: ['give_ai_feedback'],
    domain: 'operations',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Record feedback about an assistant response.',
    variables: {},
    examples: ['that was wrong', 'this answer was unhelpful'],
    confirm: 'never',
    compensation: {
      kind: 'none',
      reason:
        'Feedback is an observation about what happened; retracting it removes the signal miss-mining depends on.',
    },
    handler: 'AiGiveAiFeedbackService',
  },
  {
    id: 'guide.guide_user_flow',
    aliases: ['guide_user_flow'],
    domain: 'guide',
    surfaces: ['dashboard', 'customer', 'public', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
      provider: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Walk the user through how to do something.',
    // §190 (C2/T0) — `dispatchProductGuideIntent` reads both.
    variables: {
      topicId: {
        type: 'string',
        description: 'Guide topic being explained.',
        required: false,
        resolver: 'none',
      },
      date: {
        type: 'string',
        description:
          'Day the explanation is scoped to, when the topic is time-bound.',
        required: false,
        resolver: 'date',
      },
    },
    examples: [
      'how do I do this',
      'walk me through it',
      'How do I buy a package?',
      'Walk me through buying a package step by step',
      'Ինչպե՞ս օգտագործեմ Home tab-ը',
      'Ինչպե՞ս օգտագործեմ Today tab-ը',
    ],
    confirm: 'never',
    handler: 'AiProductGuideService',
  },
  {
    id: 'operations.hide_appointments',
    aliases: ['hide_appointments_from_calendar'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Hide appointments from the calendar view.',
    // §177 (C2/T1) — narrows by provider and day.
    variables: {
      employeeName: {
        type: 'string',
        description: 'Provider to act on.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Several providers.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Apply to every provider instead of naming any.',
        required: false,
        resolver: 'none',
      },
      date: {
        type: 'string',
        description: 'Single day.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of a date range.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of a date range.',
        required: false,
        resolver: 'date',
      },
      // §304 (`e2e-bug.462`): the service filter was read but never declared.
      serviceName: {
        type: 'string',
        description: 'Restrict to appointments for this service.',
        required: false,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Restrict to appointments for these services.',
        required: false,
        resolver: 'service',
      },
      // §305 (`e2e-bug.462`): read one hop down by
      // `resolveCalendarVisibilityStatusFilters(params)`, which the handler
      // calls directly. The first mapping pass reported these as read by
      // nothing — the helper's own name says otherwise.
      statusFilter: {
        type: 'string',
        description: 'Restrict to appointments with this status.',
        required: false,
        resolver: 'none',
      },
      statusFilters: {
        type: 'string[]',
        description: 'Restrict to appointments with any of these statuses.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['hide those appointments', 'take them off my calendar'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'operations.unhide_appointments',
      captures: ['bookingIds'],
    },
    handler: 'AiCommandService',
  },
  {
    id: 'operations.import_services_from_menu',
    aliases: ['import_services_from_menu'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Create services by importing a menu.',
    variables: {
      // `prepareImportServicesFromMenuPlanLogic` -> `extractMenuTextFromParams`
      // + `parseMenuTextToServices`. The menu arrives as text (typed or OCR'd
      // from a photo) or as an already-parsed list.
      menuText: {
        type: 'string',
        description: 'The menu as text, to be parsed into services.',
        required: false,
        resolver: 'none',
      },
      ocrText: {
        type: 'string',
        description:
          'Menu text recognised from a photo; `menuText` is preferred when both are present.',
        required: false,
        resolver: 'none',
      },
      services: {
        type: 'object[]',
        description:
          'Services already parsed out of the menu, skipping the text parse.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['import our price list', 'create services from this menu'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many services at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiOperationsService',
  },
  {
    id: 'operations.invite_staff_member',
    aliases: ['invite_staff_member'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Invite someone to join as staff.',
    variables: {
      // `handleInviteStaffMemberLogic` takes two different paths: a name looks
      // up an existing employee and sends them provider-app access, an address
      // creates a fresh invitation. "Please provide an email address or
      // employeeName" is the `required` field's missing "one of" form, so
      // neither is marked required.
      email: {
        type: 'string',
        description:
          'Address to invite. Falls back to an address found in the message.',
        required: false,
        resolver: 'none',
      },
      employeeName: {
        type: 'string',
        description:
          'Existing team member to send provider-app access to. Used instead of an address; fails if they have no email on file.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['invite Mary to the team', 'send a staff invite'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The message has been sent and cannot be unsent.',
    },
    handler: 'AiOperationsService',
  },
  {
    id: 'recommendation.link_products',
    aliases: ['link_recommended_products'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Link products to be recommended together.',
    // §177 (C2/T1) — four separate refusals: the target needs a service or a
    // category, and the payload needs product names or ids.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service the products are recommended for.',
        required: false,
        resolver: 'service',
      },
      serviceId: {
        type: 'string',
        description: 'Service id, when known.',
        required: false,
        resolver: 'service',
      },
      categoryName: {
        type: 'string',
        description: 'Category scope, as an alternative to a service.',
        required: false,
        resolver: 'none',
      },
      categoryId: {
        type: 'string',
        description: 'Category id, when known.',
        required: false,
        resolver: 'none',
      },
      productNames: {
        type: 'string[]',
        description: 'Products to recommend, by name.',
        required: false,
        resolver: 'none',
      },
      productName: {
        type: 'string',
        description: 'Single product, as an alternative to the list.',
        required: false,
        resolver: 'none',
      },
      productIds: {
        type: 'string[]',
        description: 'Products to recommend, by id.',
        required: false,
        resolver: 'none',
      },
      locationId: {
        type: 'string',
        description: 'Location scope, read by the handler itself.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['recommend these together', 'link those products'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'recommendation.link_products',
      captures: ['previousLinks'],
    },
    handler: 'AiRecommendationProductService',
  },
  {
    id: 'operations.list_bookings',
    aliases: ['list_bookings'],
    domain: 'operations',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'List bookings across the business.',
    // §211 (C2/T0) — `handleListBookings` + `resolveDateRange`.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      customerId: {
        type: 'string',
        description: 'Customer whose bookings are listed.',
        required: false,
        resolver: 'customer',
      },
      customerName: {
        type: 'string',
        description: 'Customer, by name.',
        required: false,
        resolver: 'customer',
      },
      serviceName: {
        type: 'string',
        description: 'Service filter.',
        required: false,
        resolver: 'service',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Provider filter.',
        required: false,
        resolver: 'employee',
      },
      statusFilter: {
        type: 'string',
        description: 'Booking status filter.',
        required: false,
        resolver: 'none',
      },
      timeSlot: {
        type: 'string',
        description: 'Start time filter.',
        required: false,
        resolver: 'none',
      },
      upcomingOnly: {
        type: 'boolean',
        description: 'Only future bookings.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['list our bookings', 'what is booked'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'compliance.list_breach_incidents',
    aliases: ['list_breach_incidents'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'List recorded data breach incidents.',
    // §190 (C2/T0) — `aspect` is this cluster's house pattern: the sub-topic the
    // explainer narrows to, read by its `parse*FromPrompt` helper.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which breach detail to list.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what breaches have we logged', 'list security incidents'],
    confirm: 'never',
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'operations.list_customers',
    aliases: ['list_customers'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'List the customers on record.',
    // §211 (C2/T0) — `handleListCustomersLogic` owns the whole filter set.
    variables: {
      searchTerm: {
        type: 'string',
        description: 'Free-text search over customers.',
        required: false,
        resolver: 'none',
      },
      email: {
        type: 'string',
        description: 'Filter by email.',
        required: false,
        resolver: 'customer',
      },
      phone: {
        type: 'string',
        description: 'Filter by phone.',
        required: false,
        resolver: 'customer',
      },
      segment: {
        type: 'string',
        description: 'Customer segment filter.',
        required: false,
        resolver: 'none',
      },
      tags: {
        type: 'string[]',
        description: 'Tag filter.',
        required: false,
        resolver: 'none',
      },
      isVip: {
        type: 'boolean',
        description: 'Only VIP customers.',
        required: false,
        resolver: 'none',
      },
      bookingStatus: {
        type: 'string',
        description: 'Filter by their booking status.',
        required: false,
        resolver: 'none',
      },
      sortBy: {
        type: 'string',
        description: 'Sort column.',
        required: false,
        resolver: 'none',
      },
      sortOrder: {
        type: 'string',
        description: 'Sort direction.',
        required: false,
        resolver: 'none',
      },
      page: {
        type: 'number',
        description: 'Page of results.',
        required: false,
        resolver: 'none',
      },
      pageSize: {
        type: 'number',
        description: 'Rows per page.',
        required: false,
        resolver: 'none',
      },
      limit: {
        type: 'number',
        description: 'Row cap.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['list our customers', 'who are our clients'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.list_employees',
    aliases: ['list_employees'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'List the staff members on the team.',
    variables: {},
    examples: ['who works here', 'list our employees'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'clinic.list_external_doctors',
    aliases: ['list_external_doctors'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List external doctors on record.',
    // §214 (C2/T0) — paged, searchable directory.
    variables: {
      q: {
        type: 'string',
        description: 'Free-text search over doctors.',
        required: false,
        resolver: 'none',
      },
      activeOnly: {
        type: 'boolean',
        description: 'Only active doctors.',
        required: false,
        resolver: 'none',
      },
      page: {
        type: 'number',
        description: 'Page of results.',
        required: false,
        resolver: 'none',
      },
      pageSize: {
        type: 'number',
        description: 'Rows per page.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['who are our referring doctors', 'list external doctors'],
    confirm: 'never',
    handler: 'AiExternalDoctorsService',
  },
  {
    id: 'provider.list_reviews',
    aliases: ['list_provider_reviews'],
    domain: 'provider',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'List reviews for a provider.',
    // §212 (C2/T0) — paged, scoped to one provider.
    variables: {
      employeeId: {
        type: 'string',
        description: 'Provider, by id.',
        required: false,
        resolver: 'employee',
      },
      employeeName: {
        type: 'string',
        description: 'Provider, by name.',
        required: false,
        resolver: 'employee',
      },
      providerName: {
        type: 'string',
        description: 'Provider, by name (alternate key).',
        required: false,
        resolver: 'employee',
      },
      slug: {
        type: 'string',
        description: 'Business slug the reviews belong to.',
        required: false,
        resolver: 'none',
      },
      page: {
        type: 'number',
        description: 'Page of reviews.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what do reviews say about Gevorg', 'list their reviews'],
    confirm: 'never',
    handler: 'AiProviderSpecialtyService',
  },
  {
    id: 'operations.list_schedule_blocks',
    aliases: ['list_schedule_blocks'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'List blocks placed in schedules.',
    // §211 (C2/T0) — `resolveEmployees`.
    variables: {
      employeeName: {
        type: 'string',
        description: 'Provider, by name.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Providers, by name.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Whether the whole team is in scope.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what time is blocked out', 'list schedule blocks'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.list_schedule_gaps',
    aliases: ['list_schedule_gaps'],
    domain: 'operations',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'List gaps in the schedule.',
    // §211 (C2/T0) — `resolveEmployees`, `resolveDateRange`, `parseTimeWindow`.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      employeeName: {
        type: 'string',
        description: 'Provider, by name.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Providers, by name.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Whether the whole team is in scope.',
        required: false,
        resolver: 'none',
      },
      timeFrom: {
        type: 'string',
        description: 'Start of the time window.',
        required: false,
        resolver: 'none',
      },
      timeTo: {
        type: 'string',
        description: 'End of the time window.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['where are my gaps', 'list schedule gaps'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'compliance.list_sub_processors',
    aliases: ['list_sub_processors'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'List the sub-processors handling customer data.',
    // §190 (C2/T0) — narrowed by GDPR article rather than a generic aspect.
    variables: {
      // §308 (`e2e-bug.462` reverse census): declared as `article`, a string,
      // "GDPR article the sub-processor list is scoped to". Nothing reads that
      // name. `parseListSubProcessorsFromPrompt` reads `params.article28`, a
      // **boolean** — "Show Article 28 processor list" sets it true. Wrong name
      // and wrong type.
      article28: {
        type: 'boolean',
        description: 'Scope the list to Article 28 processors.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['who processes our data', 'list sub processors'],
    confirm: 'never',
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'operations.list_templates',
    aliases: ['list_templates'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'List schedule templates.',
    variables: {},
    examples: ['what templates do we have', 'list schedule templates'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'tour.list_calendar_week',
    aliases: ['list_tour_calendar_week'],
    domain: 'tour',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    // e2e-bug.391 — this description was rewritten to say "this week, next week
    // or a past week", which is *accurate* (the traces cover all three) and
    // still cost nine points: the longer, calendar-heavy text diluted the
    // embedding into `tour.explain_calendar_span`, and Armenian calendar
    // prompts started routing there. Reverted. Being right about the scope and
    // being retrievable are not the same objective.
    description: 'List the tours running this week.',
    // §202 (C2/T0) — `parseListTourCalendarWeekFromPrompt` plus the locale.
    variables: {
      serviceId: {
        type: 'string',
        description: 'Tour, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Tour, by name.',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Date inside the week wanted.',
        required: false,
        resolver: 'date',
      },
      weekStartDate: {
        type: 'string',
        description: 'First day of the week.',
        required: false,
        resolver: 'date',
      },
      employeeId: {
        type: 'string',
        description: 'Guide, by id.',
        required: false,
        resolver: 'employee',
      },
      employeeName: {
        type: 'string',
        description: 'Guide, by name.',
        required: false,
        resolver: 'employee',
      },
      locale: {
        type: 'string',
        description: 'Locale for day and month names.',
        required: false,
        resolver: 'none',
      },
    },
    // 121 of this command's 168 traces are Armenian or Russian. §86.
    examples: [
      'what tours are on this week',
      'list the tour calendar',
      'Այս շաբաթվա էքսկուրսիաները օրացույցում',
      'Այս շաբաթվա տուրերը օրացույցում',
      'Ցույց տուր հաջորդ շաբաթվա էքսկուրսիաները օրացույցում',
      'Покажи туры на этой неделе в календаре',
    ],
    confirm: 'never',
    handler: 'AiTourServiceService',
  },
  {
    id: 'tour.list_upcoming_departures',
    aliases: ['list_upcoming_tour_departures'],
    domain: 'tour',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    // e2e-bug.391 — the sibling command is the calendar view for one week, and
    // the word "departures" alone does not separate them: half this command's
    // confusions say "departures" while meaning the calendar. What separates
    // them is a running forward list with no week in view.
    description:
      'List tour departures coming up, as a running forward schedule with no particular week in view.',
    // §202 (C2/T0) — `parseListUpcomingTourDeparturesFromPrompt`.
    variables: {
      serviceId: {
        type: 'string',
        description: 'Tour, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Tour, by name.',
        required: false,
        resolver: 'service',
      },
      daysAhead: {
        type: 'number',
        description: 'How far ahead to look.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'what tours are departing',
      'list upcoming departures',
      'which tours leave soon',
      'Покажи предстоящие выезды туров',
    ],
    confirm: 'never',
    handler: 'AiTourServiceService',
  },
  {
    id: 'operations.list_waitlist_entries',
    aliases: ['list_waitlist_entries'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'List who is on the waitlist.',
    // §211 (C2/T0) — page size.
    variables: {
      limit: {
        type: 'number',
        description: 'How many entries to return.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['who is waiting', 'list the waitlist'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'business.lookup_booking_tax_metadata',
    aliases: ['lookup_booking_tax_metadata'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Show the tax metadata recorded on a booking.',
    // §208 (C2/T0) — same booking-or-customer pair via the shared query util.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking whose tax is being explained.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Customer, used to find the booking when no id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['what tax data is on that booking', 'look up the tax metadata'],
    confirm: 'never',
    handler: 'AiBusinessTaxService',
  },
  {
    id: 'operations.lookup_customer',
    aliases: ['lookup_customer'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Find a customer record.',
    // §211 (C2/T0) — the client, and the appointment used to disambiguate.
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer being looked up.',
        required: false,
        resolver: 'customer',
      },
      date: {
        type: 'string',
        description: 'Day used to disambiguate.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Start time used to disambiguate.',
        required: false,
        resolver: 'none',
      },
      employeeName: {
        type: 'string',
        description: 'Provider used to disambiguate.',
        required: false,
        resolver: 'employee',
      },
      bookingContext: {
        type: 'object',
        description: 'Booking context carried in from the caller.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['find Gevorg record', 'look up that customer'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.lookup_service_assignment',
    aliases: ['lookup_service_assignment'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Find who is assigned to a service.',
    // §211 (C2/T0) — `enrichDashboardLookupAssignmentParams` adds the service pair.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service, by name.',
        required: false,
        resolver: 'service',
      },
      serviceCategory: {
        type: 'string',
        description: 'Service category, used when no service is named.',
        required: false,
        resolver: 'service',
      },
      assignmentLookup: {
        type: 'string',
        description: 'What is being looked up about the assignment.',
        required: false,
        resolver: 'none',
      },
      employeeName: {
        type: 'string',
        description: 'Provider whose assignment is checked.',
        required: false,
        resolver: 'employee',
      },
      date: {
        type: 'string',
        description: 'Day the assignment applies to.',
        required: false,
        resolver: 'date',
      },
      serviceRank: {
        type: 'string',
        description: 'Rank used to pick between services.',
        required: false,
        resolver: 'none',
      },
      maxPrice: {
        type: 'number',
        description: 'Price ceiling for the service.',
        required: false,
        resolver: 'money',
      },
    },
    examples: ['who does facials', 'look up that service assignment'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.mark_no_shows',
    aliases: ['mark_no_shows'],
    domain: 'operations',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['manager', 'owner'],
      provider: ['staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description: 'Mark appointments as no-shows.',
    variables: {
      // `AiBookingCoreService.findBookingsForMarkNoShows` — the same selector
      // `operations.no_show_recovery` uses, so the same rule applies: the
      // filters are the blast radius. With none of them this marks every past
      // pending/confirmed/in-progress booking in the business as a no-show.
      employeeName: {
        type: 'string',
        description: 'Limit to one provider.',
        required: false,
        resolver: 'employee',
      },
      serviceName: {
        type: 'string',
        description: 'Limit to one service.',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Limit to a single day.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description:
          'Start of a date range. Without `date` or `dateFrom` the window is everything up to now.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of a date range.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Limit to appointments at a particular time.',
        required: false,
        resolver: 'datetime',
      },
      allProviders: {
        type: 'boolean',
        description: 'Widen past the acting provider to the whole team.',
        required: false,
        resolver: 'none',
      },
      allAppointments: {
        type: 'boolean',
        description: 'Drop the date narrowing and take every eligible one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['mark them as no show', 'flag the no shows'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'operations.mark_no_shows',
      captures: ['bookingIds', 'previousStatuses'],
    },
    handler: 'AiBookingCoreService',
  },
  {
    id: 'business.migrate_date_display',
    aliases: ['migrate_dashboard_date_display'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Migrate every dashboard surface to a new date display.',
    variables: {
      // `handleMigrateDashboardDateDisplayLogic`. Falls back to a surface
      // extracted from the message when the param is absent.
      surfaceId: {
        type: 'string',
        description:
          'Which dashboard surface to migrate. Falls back to one named in the message.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'migrate all dates to the new format',
      'roll out the date change',
    ],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many dashboard surfaces at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiBusinessDateFormatService',
  },
  {
    id: 'operations.no_show_recovery',
    aliases: ['no_show_recovery'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Follow up customers who did not attend.',
    variables: {
      // `AiBookingCoreService.findBookingsForMarkNoShows` selects the set; the
      // operations plan then acts on it. Same shape as
      // `operations.bulk_smart_cancel`: the filters *are* the blast radius, so
      // a filter the planner cannot name is a wider sweep, not a doc gap.
      //
      // With no filter at all this matches every past pending/confirmed/
      // in-progress booking in the business.
      employeeName: {
        type: 'string',
        description: 'Limit to one provider.',
        required: false,
        resolver: 'employee',
      },
      serviceName: {
        type: 'string',
        description:
          'Limit to one service. Accepts several separated by commas, "and" or "or".',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Limit to a single day.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description:
          'Start of a date range. Without `date` or `dateFrom` the window is everything up to now.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of a date range.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Limit to appointments at a particular time.',
        required: false,
        resolver: 'datetime',
      },
      allProviders: {
        type: 'boolean',
        description:
          'Widen past the acting provider to the whole team. A widening flag, declared for the same reason as the filters.',
        required: false,
        resolver: 'none',
      },
      allAppointments: {
        type: 'boolean',
        description:
          'Drop the date narrowing and take every eligible past appointment.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['chase the no shows', 'run no show recovery'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The message has been sent and cannot be unsent.',
    },
    handler: 'AiBookingCoreService',
  },
  {
    id: 'business.notify_patient_result_ready',
    aliases: ['notify_patient_result_ready'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Tell a patient their results are ready.',
    // §177 (C2/T1) — read by `parsePatientResultReadyParams`; the sibling helpers
    // (`resolveReleasedResultIdForNotify`, `readBusinessDateFormatSettings`,
    // `readBusinessType`) read none, so the chain terminates there.
    variables: {
      resultId: {
        type: 'string',
        description: 'Released lab result being announced.',
        required: false,
        resolver: 'none',
      },
      bookingId: {
        type: 'string',
        description: 'Booking the result belongs to.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description: 'Patient being notified.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['tell them their results are in', 'notify the patient'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The message has been sent and cannot be unsent.',
    },
    handler: 'AiBusinessDateFormatService',
  },
  {
    id: 'operations.offer_waitlist_slot',
    aliases: ['offer_waitlist_slot'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Offer a slot to someone on the waitlist.',
    // §177 (C2/T1) — `handleOfferWaitlistSlotLogic` reads the slot being offered.
    variables: {
      date: {
        type: 'string',
        description: 'Day of the slot being offered.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Time of the slot being offered.',
        required: false,
        resolver: 'none',
      },
      employeeName: {
        type: 'string',
        description: 'Provider whose slot it is.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['offer this to the waitlist', 'tell them a slot opened'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The message has been sent and cannot be unsent.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'compliance.open_dashboard',
    aliases: ['open_compliance_dashboard'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Open the compliance dashboard.',
    variables: {},
    examples: ['open compliance', 'show the compliance dashboard'],
    confirm: 'never',
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'operations.optimize_schedule',
    aliases: ['optimize_schedule'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['owner'] },
    risk: 'T3',
    description: 'Rearrange bookings to use time better.',
    // §177 slice 16 — **corrected**. Was exempted as passing "nothing beyond the
    // message and the session". It passes `date: params.date` into
    // `runOrchestrationIntent` — which is precisely the criterion that exemption
    // list cited for *declaring* `resolve_conflicts` and `reassign_cancelled`.
    variables: {
      date: {
        type: 'string',
        description:
          'Day to optimise. Passed straight into the orchestration run.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['optimise my schedule', 'tidy up the day'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many bookings at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'operations.pay_at_venue_fallback',
    aliases: ['pay_at_venue_fallback'],
    domain: 'operations',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description: 'Fall back to paying at the venue when card payment fails.',
    variables: {
      // `handlePayAtVenueFallbackLogic` -> `resolveService` +
      // `resolveServiceCashAvailability`. e2e-bug.195 is open on this command:
      // it fails open when service resolution misses, so which service is
      // named decides whether the cash check runs against the right one at
      // all — the declaration is a prerequisite for that fix, not a substitute.
      serviceName: {
        type: 'string',
        description:
          'Service being paid for. Its own settings decide whether cash is accepted.',
        required: false,
        resolver: 'service',
      },
      serviceId: {
        type: 'string',
        description: 'Service by id. Takes precedence over the name.',
        required: false,
        resolver: 'service',
      },
      isActivationPath: {
        type: 'boolean',
        description:
          'Treat this as a first-booking activation flow, which changes the wording of the fallback.',
        required: false,
        resolver: 'none',
      },
      activationPath: {
        type: 'string',
        description: 'Which activation flow the customer is in.',
        required: false,
        resolver: 'none',
      },
      completedBookingCount: {
        type: 'number',
        description:
          'How many bookings the customer has completed, used to pick the activation wording.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['I will just pay there', 'let me pay at the venue instead'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money handling moved to the venue; reversing it is a payment decision.',
    },
    handler: 'AiPayAtVenueFallbackService',
  },
  {
    id: 'operations.payment_sweep',
    aliases: ['payment_sweep'],
    domain: 'operations',
    surfaces: ['dashboard', 'provider'],
    tiers: { dashboard: ['manager', 'owner'], provider: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Chase outstanding payments across bookings.',
    variables: {
      // `AiBookingCoreService.findUnpaidBookingsForSweep` selects, then
      // `applyPaymentSweepFilters` narrows. Blast radius again — this marks
      // bookings **paid** in bulk, so an undeclared filter is money.
      employeeName: {
        type: 'string',
        description: 'Limit to one provider.',
        required: false,
        resolver: 'employee',
      },
      serviceName: {
        type: 'string',
        description: 'Limit to one service.',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Limit to a single day.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of a date range.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of a date range.',
        required: false,
        resolver: 'date',
      },
      excludeWalkIns: {
        type: 'boolean',
        description:
          'Skip bookings with no customer record. Falls back to "except walk-ins" in the message.',
        required: false,
        resolver: 'none',
      },
      statusFilter: {
        type: 'string',
        description:
          'Limit to one booking status. Falls back to "completed" when the message says so and does not also say in-progress.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['chase everyone who owes', 'run a payment sweep'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The message has been sent and cannot be unsent.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'provider.pick_provider_for_service',
    aliases: ['pick_provider_for_service'],
    domain: 'provider',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Choose which provider will perform a service.',
    // §177 (C2/T1) — `parsePickProviderForServiceFromPrompt` reads the provider,
    // service and mode; the handler refuses with `missing: ['providerName']`.
    variables: {
      providerName: {
        type: 'string',
        description: 'Provider the customer wants.',
        required: true,
        resolver: 'employee',
      },
      serviceName: {
        type: 'string',
        description: 'Service they want that provider for.',
        required: false,
        resolver: 'service',
      },
      mode: {
        type: 'string',
        description: 'Which selection behaviour to apply.',
        required: false,
        resolver: 'none',
      },
      providerSameDayMulti: {
        type: 'boolean',
        description: 'Keep the same provider across a multi-service day.',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      slug: {
        type: 'string',
        description:
          'Business slug. A tenant identifier from the URL rather than something the user says; read by `resolveBusinessSlugFromParamsOrId`.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['book me with Gevorg', 'pick a provider for this'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'provider.pick_provider_for_service',
      captures: ['bookingId', 'previousEmployeeId'],
    },
    handler: 'AiProviderSpecialtyService',
  },
  {
    id: 'business.preview_date_format',
    aliases: ['preview_business_date_format'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Preview how dates will look in a chosen format.',
    // §203 (C2/T0) — `parseBusinessDateFormatFromPrompt` reads the pair the
    // preview is rendered for before falling back to the prompt.
    variables: {
      dateFormat: {
        type: 'string',
        description: 'Date format to preview.',
        required: false,
        resolver: 'none',
      },
      timeFormat: {
        type: 'string',
        description: 'Time format to preview.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['show me how that date format looks', 'preview the date format'],
    confirm: 'never',
    handler: 'AiBusinessDateFormatService',
  },
  {
    id: 'business.preview_date_input_parse',
    aliases: ['preview_date_input_parse'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Show how a typed date would be read.',
    // §203 (C2/T0) — `parseDateStringsFromPrompt` reads the strings to parse.
    variables: {
      dateStrings: {
        type: 'string[]',
        description: 'Date strings to try parsing.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what would 03/04 mean', 'preview how that date parses'],
    confirm: 'never',
    handler: 'AiBusinessDateFormatService',
  },
  {
    id: 'business.preview_notification_datetime',
    aliases: ['preview_notification_datetime'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Preview how a date and time will appear in a notification.',
    // §203 (C2/T0) — `resolveNotificationMessageKind` reads the message kind.
    variables: {
      messageKind: {
        type: 'string',
        description: 'Which notification the sample is rendered for.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'how will the reminder look',
      'preview the notification datetime',
    ],
    confirm: 'never',
    handler: 'AiBusinessDateFormatService',
  },
  {
    id: 'business.quote_staff_booking_tax',
    aliases: ['quote_staff_booking_tax'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Quote the tax on a booking a staff member is making.',
    // §208 (C2/T0) — the quote needs a service and a price; both are accepted
    // under two keys each.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service being quoted, by name.',
        required: false,
        resolver: 'service',
      },
      serviceQuery: {
        type: 'string',
        description: 'Service being quoted, as free text.',
        required: false,
        resolver: 'service',
      },
      price: {
        type: 'number',
        description: 'Price to quote tax on.',
        required: false,
        resolver: 'money',
      },
      samplePrice: {
        type: 'number',
        description: 'Price to quote tax on (alternate key).',
        required: false,
        resolver: 'money',
      },
    },
    examples: ['how much tax on this booking', 'quote the tax'],
    confirm: 'never',
    handler: 'AiBusinessTaxService',
  },
  {
    id: 'operations.reassign_cancelled',
    aliases: ['reassign_cancelled'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Reassign appointments freed by a cancellation.',
    variables: {
      // Routes through `runOrchestrationIntent` (`AgentType.CANCELLATION_
      // RECOVERY`), which takes the raw message as its `intent`. `date` is the
      // one structured field the call site passes; `employeeId` beside it is
      // session-injected.
      date: {
        type: 'string',
        description: 'Day to recover cancellations on.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['reassign the cancelled slots', 'fill what was cancelled'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many bookings at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'compliance.report_data_breach',
    aliases: ['report_data_breach'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Record a data breach incident.',
    variables: {
      // `parseReportDataBreachFromPrompt`. The description has a hard
      // 10-character floor — below it the parser returns null and the whole
      // command declines — but it falls back to the message text, so it is not
      // `required` by this backlog's criterion.
      description: {
        type: 'string',
        description:
          'What happened. Falls back to the message; anything under 10 characters is rejected.',
        required: false,
        resolver: 'none',
      },
      affectedCustomerCount: {
        type: 'number',
        description:
          'How many people were affected. Drives the regulator notification deadline, so an omitted count is not a neutral default.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['report a data breach', 'log a security incident'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A breach record starts a regulatory clock; it is an incident log, not a draft.',
    },
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'operations.resolve_conflicts',
    aliases: ['resolve_conflicts'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Resolve double-booked appointments.',
    variables: {
      // `runOrchestrationIntent` with `AgentType.CONFLICT_RESOLUTION`. Same
      // shape as `reassign_cancelled`: the message carries the intent, `date`
      // is the one structured field passed alongside it.
      //
      // These two are why `create_services` and `optimize_schedule` are not
      // simply "orchestration commands can't be declared" — routing through
      // orchestration does not by itself mean there is no param contract.
      date: {
        type: 'string',
        description: 'Day to resolve conflicts on.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['fix the double bookings', 'resolve these conflicts'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many bookings at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'guide.resume_booking_draft',
    aliases: ['resume_booking_draft'],
    domain: 'guide',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Restore a booking the user started and left.',
    // §214 (C2/T0) — the whole draft is carried in params.
    variables: {
      bookingDraft: {
        type: 'object',
        description: 'The saved draft.',
        required: false,
        resolver: 'none',
      },
      bookingDraftServiceId: {
        type: 'string',
        description: 'Service on the draft.',
        required: false,
        resolver: 'service',
      },
      bookingDraftEmployeeId: {
        type: 'string',
        description: 'Provider on the draft.',
        required: false,
        resolver: 'employee',
      },
      bookingDraftDate: {
        type: 'string',
        description: 'Date on the draft.',
        required: false,
        resolver: 'date',
      },
      bookingDraftSlot: {
        type: 'string',
        description: 'Slot on the draft.',
        required: false,
        resolver: 'none',
      },
      bookingDraftSlug: {
        type: 'string',
        description: 'Business slug on the draft.',
        required: false,
        resolver: 'none',
      },
      bookingDraftGuestContact: {
        type: 'object',
        description: 'Guest contact held on the draft.',
        required: false,
        resolver: 'customer',
      },
      bookingDraftUpdatedAt: {
        type: 'string',
        description: 'When the draft was last touched.',
        required: false,
        resolver: 'datetime',
      },
      serviceId: {
        type: 'string',
        description: 'Service, when not taken from the draft.',
        required: false,
        resolver: 'service',
      },
      slug: {
        type: 'string',
        description: 'Business slug, when not taken from the draft.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['pick up where I left off', 'resume my booking'],
    confirm: 'never',
    handler: 'AiResumeBookingDraftService',
  },
  {
    id: 'guide.resume_pending_payment',
    aliases: ['resume_pending_payment'],
    domain: 'guide',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Restore a checkout the user left mid-payment.',
    // §214 (C2/T0) — the pending checkout being resumed.
    variables: {
      pendingCheckoutPayment: {
        type: 'object',
        description: 'The pending payment.',
        required: false,
        resolver: 'none',
      },
      pendingCheckoutSessionId: {
        type: 'string',
        description: 'Checkout session to resume.',
        required: false,
        resolver: 'none',
      },
      pendingSessionId: {
        type: 'string',
        description: 'Session id (alternate key).',
        required: false,
        resolver: 'none',
      },
      pendingCheckoutServiceId: {
        type: 'string',
        description: 'Service on the pending checkout.',
        required: false,
        resolver: 'service',
      },
      pendingCheckoutEmployeeId: {
        type: 'string',
        description: 'Provider on the pending checkout.',
        required: false,
        resolver: 'employee',
      },
      pendingCheckoutStartTime: {
        type: 'string',
        description: 'Start time on the pending checkout.',
        required: false,
        resolver: 'datetime',
      },
    },
    examples: ['continue my payment', 'I closed the app mid checkout'],
    confirm: 'never',
    handler: 'AiResumePendingPaymentService',
  },
  {
    id: 'guide.retry_failed_network_action',
    aliases: ['retry_failed_network_action'],
    domain: 'guide',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    // e2e-bug.391 — confused with `guide.resume_booking_draft`. The difference
    // is that something was attempted and failed, rather than started and
    // abandoned, so the examples now carry a failed attempt.
    description:
      'Retry an action that was attempted and failed, typically on a bad connection.',
    // §214 (C2/T0) — the offline state, both spellings of each field.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      online: {
        type: 'boolean',
        description: 'Whether the device is online.',
        required: false,
        resolver: 'none',
      },
      isOnline: {
        type: 'boolean',
        description: 'Whether the device is online (alternate key).',
        required: false,
        resolver: 'none',
      },
      offlineQueueCount: {
        type: 'number',
        description: 'How many actions are queued.',
        required: false,
        resolver: 'none',
      },
      queuedCount: {
        type: 'number',
        description: 'How many actions are queued (alternate key).',
        required: false,
        resolver: 'none',
      },
      fromCache: {
        type: 'boolean',
        description: 'Whether the last answer came from cache.',
        required: false,
        resolver: 'none',
      },
      offlineFromCache: {
        type: 'boolean',
        description:
          'Whether the last answer came from cache (alternate key).',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'try that again',
      'retry the failed action',
      'that did not go through, try again',
      'my booking failed to save',
    ],
    confirm: 'never',
    handler: 'AiRetryFailedNetworkActionService',
  },
  {
    id: 'operations.revenue_forecast',
    aliases: ['revenue_forecast'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    // e2e-bug.376, second wave (§123): registry fixed, so this can say what it
    // is. It was T1 with a `kind: 'none'` compensation only because a binding
    // passed its whole intent list as `mutateIntents` and conformance —
    // correctly — fails a spec that disagrees with the registry.
    risk: 'T0',
    description: 'Forecast revenue for a coming period.',
    // §214 (C2/T0) — `resolveDateRange(params, prompt, tz)`.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['what will we make next month', 'forecast our revenue'],
    confirm: 'never',
    handler: 'AiOperationsService',
  },
  {
    id: 'compliance.send_breach_notification',
    aliases: ['send_breach_notification'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Notify affected people about a data breach.',
    variables: {
      // `parseSendBreachNotificationFromPrompt` returns null without an
      // incident reference, so this is the one field the command cannot run
      // without — but `extractBreachIncidentRef` also reads it out of the
      // message, so it is optional by the same criterion as
      // `report_data_breach`'s description.
      //
      // Outbound and unrecallable (`compensation: none` — the message has been
      // sent), so pointing at the wrong incident is not correctable.
      incidentRef: {
        type: 'string',
        description:
          'Which recorded breach incident to notify about. Falls back to a reference found in the message; without either, the command declines rather than guessing.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['notify affected customers', 'send the breach notification'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The message has been sent and cannot be unsent.',
    },
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'business.set_service_tax_rate',
    aliases: ['set_service_tax_rate'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Set the tax rate for a service.',
    variables: {
      // `parseSetServiceTaxRateFromPrompt` -> `extractServiceTaxQuery` +
      // `extractServiceTaxRate`. Both halves accept two spellings
      // (`serviceName` | `serviceQuery`, `rate` | `taxRatePercent`); one of
      // each is declared, as on `update_service_prices`.
      //
      // `serviceIds` is the widening form: supply it and the rate is applied
      // to every listed service rather than the one the query matched.
      serviceName: {
        type: 'string',
        description:
          'Service to set the rate on. Falls back to a service named in the message.',
        required: false,
        resolver: 'service',
      },
      taxRatePercent: {
        type: 'number',
        description:
          'Rate as a percentage. Falls back to a rate found in the message.',
        required: false,
        resolver: 'none',
      },
      serviceIds: {
        type: 'string[]',
        description:
          'Apply the rate to several services at once instead of the one matched by name.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['massages are zero rated', 'set the tax on that service'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'business.set_service_tax_rate',
      captures: ['serviceId', 'previousRate'],
    },
    handler: 'AiBusinessTaxService',
  },
  {
    id: 'operations.setup_week_schedule',
    aliases: ['setup_week_schedule'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Set up a whole week of schedules.',
    variables: {
      // `AiScheduleHandlersService.prepareTemplateCascadePlan`.
      templateName: {
        type: 'string',
        description: 'Template to cascade across the week.',
        required: false,
        resolver: 'none',
      },
      allProviders: {
        type: 'boolean',
        description: 'Apply to the whole team.',
        required: false,
        resolver: 'none',
      },
      repeatWeeksCount: {
        type: 'number',
        description: 'How many weeks to repeat the pattern for.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['set up next week', 'build the week schedule'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many schedule entries at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'operations.show_appointments',
    aliases: ['show_appointments'],
    domain: 'operations',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Show appointments for a chosen day or range.',
    // §211 (C2/T0) — same handler as `list_bookings`.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      customerId: {
        type: 'string',
        description: 'Customer whose bookings are listed.',
        required: false,
        resolver: 'customer',
      },
      customerName: {
        type: 'string',
        description: 'Customer, by name.',
        required: false,
        resolver: 'customer',
      },
      serviceName: {
        type: 'string',
        description: 'Service filter.',
        required: false,
        resolver: 'service',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Provider filter.',
        required: false,
        resolver: 'employee',
      },
      statusFilter: {
        type: 'string',
        description: 'Booking status filter.',
        required: false,
        resolver: 'none',
      },
      timeSlot: {
        type: 'string',
        description: 'Start time filter.',
        required: false,
        resolver: 'none',
      },
      upcomingOnly: {
        type: 'boolean',
        description: 'Only future bookings.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['show me today appointments', 'what is on'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.sick_day_replan',
    aliases: ['sick_day_replan'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T3',
    description: 'Replan a day after someone calls in sick.',
    variables: {
      // `prepareSickDayReplanPlanLogic` -> `parseSickEmployeeName` +
      // `resolveDateRange` + `resolveEmployees`. `_timeZone` is
      // pipeline-injected and not declared.
      employeeName: {
        type: 'string',
        description:
          'Provider who is off sick and whose day is being replanned.',
        required: false,
        resolver: 'employee',
      },
      date: {
        type: 'string',
        description: 'Day to replan, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'First day affected, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description:
          'Last day affected, ISO 8601 date. Same as `dateFrom` for a single day.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['Mary is off sick, replan', 'cover the sick day'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many bookings at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiOperationsService',
  },
  {
    id: 'guest.sign_in_with_apple',
    aliases: ['sign_in_with_apple'],
    domain: 'customer',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T1',
    description: 'Sign in using an Apple account.',
    variables: {},
    examples: ['sign in with Apple', 'use my Apple account'],
    confirm: 'never',
    compensation: {
      kind: 'none',
      reason: 'A session was created; signing out is a separate action.',
    },
    handler: 'AiGuestCheckoutFieldsService',
  },
  {
    id: 'guest.sign_in_with_google',
    aliases: ['sign_in_with_google'],
    domain: 'customer',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T1',
    description: 'Sign in using Google.',
    variables: {},
    examples: ['sign in with Google', 'use my Google account'],
    confirm: 'never',
    compensation: {
      kind: 'none',
      reason: 'A session was created; signing out is a separate action.',
    },
    handler: 'AiGuestCheckoutFieldsService',
  },
  {
    id: 'guest.sign_in_with_phone',
    aliases: ['sign_in_with_phone'],
    domain: 'customer',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T1',
    description: 'Sign in using a phone number.',
    variables: {},
    examples: ['sign in with my phone', 'use my number'],
    confirm: 'never',
    compensation: {
      kind: 'none',
      reason: 'A session was created; signing out is a separate action.',
    },
    handler: 'AiGuestCheckoutFieldsService',
  },
  {
    id: 'operations.speak_assistant_reply',
    aliases: ['speak_assistant_reply'],
    domain: 'operations',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Read the assistant reply aloud.',
    variables: {},
    examples: ['read that out', 'say it out loud'],
    confirm: 'never',
    compensation: {
      kind: 'none',
      reason: 'Audio has already played; there is nothing stored to undo.',
    },
    handler: 'AiSpeakAssistantReplyService',
  },
  {
    id: 'operations.staff_service_matrix',
    aliases: ['staff_service_matrix'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Show which staff can perform which services.',
    // §177 (C2/T1) — four levels down: service method \u2192 plan builder \u2192
    // `prepareStaffServiceMatrixPlanLogic`, which is the only thing that reads
    // params. Its own four helpers (`resolveEmployeesBySeniority`,
    // `resolveServicesByCategoryHint`, and the two plan builders) read none, so
    // the chain terminates there.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service the matrix is scoped to.',
        required: false,
        resolver: 'service',
      },
      categoryName: {
        type: 'string',
        description: 'Category hint used to select the services.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['who can do what', 'show the staff service matrix'],
    confirm: 'never',
    compensation: {
      kind: 'none',
      reason:
        'Produces a matrix view; the registry marks it mutating (e2e-bug.376).',
    },
    handler: 'AiOperationsService',
  },
  {
    id: 'provider.submit_review',
    aliases: ['submit_provider_review'],
    domain: 'provider',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Leave a review for a provider.',
    // §177 (C2/T1) — three separate refusals: `providerName`, `rating` and
    // `idToken`. The token is *presented* by the signed-in session, not set by the
    // user — the distinction `e2e-bug.464` draws between credentials a caller
    // already holds and secrets being configured.
    variables: {
      providerName: {
        type: 'string',
        description: 'Provider being reviewed.',
        required: true,
        resolver: 'employee',
      },
      employeeName: {
        type: 'string',
        description: 'Alias for `providerName`.',
        required: false,
        resolver: 'employee',
      },
      employeeId: {
        type: 'string',
        description: 'Provider id, when known.',
        required: false,
        resolver: 'employee',
      },
      rating: {
        type: 'number',
        description: 'Star rating.',
        required: true,
        resolver: 'none',
      },
      comment: {
        type: 'string',
        description: 'Free-text review.',
        required: false,
        resolver: 'none',
      },
      idToken: {
        type: 'string',
        description:
          'Session identity token. Presented, not authored — see `e2e-bug.464`.',
        required: true,
        resolver: 'none',
      },
      slug: {
        type: 'string',
        description:
          'Business slug. A tenant identifier from the URL rather than something the user says; read by `resolveBusinessSlugFromParamsOrId`.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['review Gevorg', 'leave a review for my stylist'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A review may already be visible to other customers and to the provider.',
    },
    handler: 'AiProviderSpecialtyService',
  },
  {
    id: 'provider.submit_review_with_token',
    aliases: ['submit_review_with_token'],
    domain: 'provider',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'Leave a review using a link from a message.',
    // §177 (C2/T1) — the emailed-link variant: `token` stands in for a session,
    // and is likewise presented rather than authored.
    variables: {
      token: {
        type: 'string',
        description:
          'Review token from the emailed link. Presented, not authored.',
        required: false,
        resolver: 'none',
      },
      bookingId: {
        type: 'string',
        description: 'Booking being reviewed.',
        required: false,
        resolver: 'appointment',
      },
      rating: {
        type: 'number',
        description: 'Star rating. The handler refuses without it.',
        required: true,
        resolver: 'none',
      },
      comment: {
        type: 'string',
        description: 'Free-text review.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description: 'Name shown against the review.',
        required: false,
        resolver: 'customer',
      },
      slug: {
        type: 'string',
        description:
          'Business slug. A tenant identifier from the URL rather than something the user says; read by `resolveBusinessSlugFromParamsOrId`.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['review from my link', 'submit my review'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A review may already be visible to other customers and to the provider.',
    },
    handler: 'AiProviderSpecialtyService',
  },
  {
    id: 'operations.summarize_ai_briefing',
    aliases: ['summarize_ai_briefing'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Give the assistant daily briefing.',
    variables: {},
    examples: ['brief me', 'what do I need to know today'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.summarize_ai_settings',
    aliases: ['summarize_ai_settings'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise the assistant settings.',
    variables: {},
    examples: ['what are the AI settings', 'summarise assistant config'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.summarize_ai_weekly_report',
    aliases: ['summarize_ai_weekly_report'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Give the assistant weekly report.',
    variables: {},
    examples: ['weekly report please', 'summarise the week'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.summarize_bookings',
    aliases: ['summarize_bookings'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise bookings over a period.',
    // §211 (C2/T0) — `resolveBookingMetric` + `resolveDateRange`.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      bookingMetric: {
        type: 'string',
        description: 'Which booking metric to report.',
        required: false,
        resolver: 'none',
      },
      statusFilter: {
        type: 'string',
        description: 'Booking status filter.',
        required: false,
        resolver: 'none',
      },
      allTime: {
        type: 'boolean',
        description: 'Ignore the window and count everything.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'how were bookings this month',
      'summarise our bookings',
      'How many appointments today?',
      'How many bookings do I have this month?',
    ],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'business.summarize_customer_tax_paid',
    aliases: ['summarize_customer_tax_paid'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise the tax a customer has paid.',
    // §208 (C2/T0) — scoped to one customer.
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer whose tax total is summarized.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['how much tax has this customer paid', 'summarise their tax'],
    confirm: 'never',
    handler: 'AiBusinessTaxService',
  },
  {
    id: 'operations.summarize_customers',
    aliases: ['summarize_customers'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise the customer base.',
    // §211 (C2/T0) — `resolveCustomerMetric`.
    variables: {
      customerMetric: {
        type: 'string',
        description: 'Which customer metric to rank by.',
        required: false,
        resolver: 'none',
      },
      limit: {
        type: 'number',
        description: 'How many rows to return.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['tell me about our customers', 'summarise our clients'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.summarize_day',
    aliases: ['summarize_day'],
    domain: 'operations',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Summarise what is happening on a given day.',
    // §211 (C2/T0) — reads `date`, then forwards `{ ...params, date }` to both
    // `handleListBookings` and `handleCheckAvailability`, so their fields are
    // reachable through it too (same spread rule as §199).
    variables: {
      date: {
        type: 'string',
        description: 'Day to summarize.',
        required: false,
        resolver: 'date',
      },
      customerId: {
        type: 'string',
        description: 'Customer whose bookings are listed.',
        required: false,
        resolver: 'customer',
      },
      customerName: {
        type: 'string',
        description: 'Customer, by name.',
        required: false,
        resolver: 'customer',
      },
      serviceName: {
        type: 'string',
        description: 'Service filter.',
        required: false,
        resolver: 'service',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Provider filter.',
        required: false,
        resolver: 'employee',
      },
      statusFilter: {
        type: 'string',
        description: 'Booking status filter.',
        required: false,
        resolver: 'none',
      },
      timeSlot: {
        type: 'string',
        description: 'Start time filter.',
        required: false,
        resolver: 'none',
      },
      upcomingOnly: {
        type: 'boolean',
        description: 'Only future bookings.',
        required: false,
        resolver: 'none',
      },
      timeFrom: {
        type: 'string',
        description:
          'Start of the time window, forwarded to the availability check.',
        required: false,
        resolver: 'none',
      },
      timeTo: {
        type: 'string',
        description:
          'End of the time window, forwarded to the availability check.',
        required: false,
        resolver: 'none',
      },
      timeOfDay: {
        type: 'string',
        description:
          'Part of the day, forwarded to the availability check.',
        required: false,
        resolver: 'none',
      },
      dayPart: {
        type: 'string',
        description: 'Part of the day (alternate key).',
        required: false,
        resolver: 'none',
      },
      serviceCategory: {
        type: 'string',
        description:
          'Service category, forwarded to the availability check.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['how does today look', 'summarise my day'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'recommendation.summarize_performance',
    aliases: ['summarize_recommendation_performance'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise how recommendations are performing.',
    // §212 (C2/T0) — same scoping as the analytics command.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the explanation is wanted.',
        required: false,
        resolver: 'none',
      },
      productName: {
        type: 'string',
        description: 'Product summarized.',
        required: false,
        resolver: 'none',
      },
      serviceName: {
        type: 'string',
        description: 'Service the product attaches to.',
        required: false,
        resolver: 'service',
      },
      surface: {
        type: 'string',
        description: 'Surface summarized.',
        required: false,
        resolver: 'none',
      },
      daysAhead: {
        type: 'number',
        description: 'How many days the window covers.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'are recommendations working',
      'summarise recommendation performance',
    ],
    confirm: 'never',
    handler: 'AiRecommendationProductService',
  },
  {
    id: 'business.summarize_revenue_kpis',
    aliases: ['summarize_revenue_kpis'],
    domain: 'business',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise the revenue key figures.',
    // §190 (C2/T0) — the one command in the currency cluster that reads params:
    // `resolveRevenueKpiDateRange` takes an explicit window, falling back to
    // `extractDateRangeFromPrompt`. The other ten are dispatched as
    // `(deps, businessId)` and take nothing.
    variables: {
      from: {
        type: 'string',
        description: 'Start of the reporting window.',
        required: false,
        resolver: 'date',
      },
      to: {
        type: 'string',
        description: 'End of the reporting window.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['how is revenue doing', 'summarise our revenue KPIs'],
    confirm: 'never',
    handler: 'AiBusinessCurrencyService',
  },
  {
    id: 'operations.summarize_staff',
    aliases: ['summarize_staff'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise staff activity.',
    // §211 (C2/T0) — `resolveStaffMetric` + `resolveDateRange`.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      staffMetric: {
        type: 'string',
        description: 'Which staff metric to rank by.',
        required: false,
        resolver: 'none',
      },
      employeeName: {
        type: 'string',
        description: 'Provider to scope to.',
        required: false,
        resolver: 'employee',
      },
      limit: {
        type: 'number',
        description: 'How many rows to return.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how is the team doing', 'summarise our staff'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.summarize_utilization',
    aliases: ['summarize_utilization'],
    domain: 'operations',
    surfaces: ['dashboard', 'provider'],
    tiers: { dashboard: ['manager', 'owner'], provider: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise how fully time is booked.',
    // §211 (C2/T0) — `resolveDateRange` only.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['how busy are we', 'summarise utilisation'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.summarize_waitlist',
    aliases: ['summarize_waitlist'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise the waitlist.',
    // §211 (C2/T0) — day and page size.
    variables: {
      date: {
        type: 'string',
        description: 'Day to summarize.',
        required: false,
        resolver: 'date',
      },
      limit: {
        type: 'number',
        description: 'How many entries.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how long is the waitlist', 'summarise who is waiting'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'provider.switch_provider_same_time',
    aliases: ['switch_provider_same_time'],
    domain: 'provider',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Change provider while keeping the same time.',
    // §177 (C2/T1) — four refusals (`serviceId`, `date`, `timeSlot`, `mode`); the
    // slot comes from `resolveTimeSlot`, which accepts `timeSlot` or `startTime`.
    variables: {
      serviceId: {
        type: 'string',
        description: 'Service of the booking being moved.',
        required: true,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Day of the booking.',
        required: true,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description:
          'Time of the booking. `startTime` is accepted by `resolveTimeSlot`.',
        required: true,
        resolver: 'none',
      },
      startTime: {
        type: 'string',
        description: 'Alias for `timeSlot`.',
        required: false,
        resolver: 'none',
      },
      mode: {
        type: 'string',
        description: 'Which switch behaviour to apply.',
        required: true,
        resolver: 'none',
      },
      providerName: {
        type: 'string',
        description: 'Provider to switch to.',
        required: false,
        resolver: 'employee',
      },
      employeeId: {
        type: 'string',
        description: 'Provider id to switch to.',
        required: false,
        resolver: 'employee',
      },
      excludeEmployeeId: {
        type: 'string',
        description: 'Provider to switch away from.',
        required: false,
        resolver: 'employee',
      },
      slug: {
        type: 'string',
        description:
          'Business slug. A tenant identifier from the URL rather than something the user says; read by `resolveBusinessSlugFromParamsOrId`.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['can I see someone else at the same time', 'switch provider'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'provider.switch_provider_same_time',
      captures: ['bookingId', 'previousEmployeeId'],
    },
    handler: 'AiProviderSpecialtyService',
  },
  {
    id: 'operations.transfer_employee_services',
    aliases: ['transfer_employee_services'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Move services from one staff member to another.',
    variables: {
      // `resolveTransferEmployeeServicesInput` + `resolveScopedEmployeeServices`.
      // Both names are read from params only — no prompt fallback — but
      // neither is `required`: the handler returns "Specify one source
      // provider and one target provider" as a `null` plan rather than a
      // `missing:` payload, and it also rejects an ambiguous *match*, so the
      // failure is not simply "absent".
      fromEmployeeName: {
        type: 'string',
        description: 'Provider the services move away from.',
        required: false,
        resolver: 'employee',
      },
      toEmployeeName: {
        type: 'string',
        description:
          'Provider the services move to. Must resolve to someone other than the source.',
        required: false,
        resolver: 'employee',
      },
      serviceName: {
        type: 'string',
        description:
          'Move a single named service instead of the whole assignment.',
        required: false,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Move several named services.',
        required: false,
        resolver: 'service',
      },
      categoryName: {
        type: 'string',
        description: 'Move everything in one service category.',
        required: false,
        resolver: 'none',
      },
      unassignAllServices: {
        type: 'boolean',
        description:
          'Move the source provider entire assignment. The widest form of this command.',
        required: false,
        resolver: 'none',
      },
      // §307 (`e2e-bug.462`): read by
      // `resolveTransferEmployeeServicesInput` alongside `unassignAllServices`.
      transferFromCategory: {
        type: 'boolean',
        description: 'Move every service in the named category to the target provider.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['move Mary services to Gevorg', 'transfer their services'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Moves assignments in both directions at once; restoring needs both prior sets.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'operations.unassign_employee_services',
    aliases: ['unassign_employee_services'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Remove services from what a staff member can perform.',
    // §177 (C2/T1) — `resolveAssignEmployeeServicesInput` combines
    // `resolveEmployees` (employeeName / employeeNames / allProviders) with
    // `resolveServicesForEmployeeAssignment` (categoryName), plus its own reads.
    variables: {
      employeeName: {
        type: 'string',
        description: 'Provider to act on.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Several providers.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Apply to every provider instead of naming any.',
        required: false,
        resolver: 'none',
      },
      serviceName: {
        type: 'string',
        description: 'Service being assigned.',
        required: false,
        resolver: 'service',
      },
      categoryName: {
        type: 'string',
        description: 'Assign every service in a category.',
        required: false,
        resolver: 'none',
      },
      // §307 (`e2e-bug.462`): `unassignFromCategory`, not `assignFromCategory`.
      // `resolveUnassignEmployeeServicesInput` reads `params.unassignFromCategory`;
      // `assignFromCategory` is read only by `resolveAssignEmployeeServicesInput`,
      // the *sibling* command, and was declared here in error — a declared input
      // no handler reads, which is `e2e-bug.399`'s mistake and the exact mirror
      // of the one `e2e-bug.462` describes.
      unassignFromCategory: {
        type: 'boolean',
        description: 'Remove every service in the named category from this provider.',
        required: false,
        resolver: 'none',
      },
      unassignAllServices: {
        type: 'boolean',
        description: 'Remove every assigned service from this provider.',
        required: false,
        resolver: 'none',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Services to remove from this provider.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['Mary no longer does facials', 'unassign those services'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'operations.assign_employee_services',
      captures: ['employeeId', 'serviceIds'],
    },
    handler: 'AiCommandService',
  },
  {
    id: 'operations.unhide_appointments',
    aliases: ['unhide_appointments_from_calendar'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Show appointments hidden from the calendar.',
    // §177 (C2/T1) — as `hide_appointments_from_calendar`; this one also accepts a
    // range.
    variables: {
      employeeName: {
        type: 'string',
        description: 'Provider to act on.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Several providers.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Apply to every provider instead of naming any.',
        required: false,
        resolver: 'none',
      },
      date: {
        type: 'string',
        description: 'Single day.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of a date range.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of a date range.',
        required: false,
        resolver: 'date',
      },
      // §304 (`e2e-bug.462`): the service filter was read but never declared.
      serviceName: {
        type: 'string',
        description: 'Restrict to appointments for this service.',
        required: false,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Restrict to appointments for these services.',
        required: false,
        resolver: 'service',
      },
      // §305 (`e2e-bug.462`): read one hop down by
      // `resolveCalendarVisibilityStatusFilters(params)`, which the handler
      // calls directly. The first mapping pass reported these as read by
      // nothing — the helper's own name says otherwise.
      statusFilter: {
        type: 'string',
        description: 'Restrict to appointments with this status.',
        required: false,
        resolver: 'none',
      },
      statusFilters: {
        type: 'string[]',
        description: 'Restrict to appointments with any of these statuses.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['show the hidden appointments', 'unhide them'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'operations.hide_appointments',
      captures: ['bookingIds'],
    },
    handler: 'AiCommandService',
  },
  {
    id: 'operations.unknown',
    aliases: ['unknown'],
    domain: 'operations',
    surfaces: ['dashboard', 'provider', 'customer', 'public'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['client', 'staff', 'manager', 'owner'],
      customer: ['client', 'staff', 'manager', 'owner'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description:
      'Fallback when no command matches. Returns a clarification rather than acting.',
    variables: {},
    examples: ['asdfgh', 'something we do not support'],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'operations.update_employee',
    aliases: ['update_employee'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Change a staff member details.',
    variables: {
      // `handleUpdateEmployeeLogic`. Every field falls back to
      // `extractEmployeeUpdateFromPrompt`. With no change field at all the
      // handler asks "What should I change for X?" rather than failing, so
      // requiring any one of them would refuse a prompt it can already answer.
      employeeName: {
        type: 'string',
        description:
          'Which team member to update. Falls back to a name found in the message.',
        required: false,
        resolver: 'employee',
      },
      newName: {
        type: 'string',
        description: 'Rename them to this.',
        required: false,
        resolver: 'none',
      },
      email: {
        type: 'string',
        description: 'New email address.',
        required: false,
        resolver: 'none',
      },
      phone: {
        type: 'string',
        description: 'New phone number.',
        required: false,
        resolver: 'none',
      },
      title: {
        type: 'string',
        description: 'New job title.',
        required: false,
        resolver: 'none',
      },
      serviceNames: {
        type: 'string[]',
        description:
          'Replace the services they are assigned to. Unlike the other fields this one is read from params only — there is no prompt fallback.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['change Mary phone number', 'update that employee'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'operations.update_employee',
      captures: ['employeeId', 'previousValues'],
    },
    handler: 'AiOperationsService',
  },
  {
    id: 'clinic.update_external_doctor',
    aliases: ['update_external_doctor'],
    domain: 'clinic',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Change an external doctor record.',
    variables: {
      // `handleUpdateExternalDoctorLogic` — the create fields plus the two
      // that only make sense on an update: how to find the existing record,
      // and whether it stays in the directory.
      doctorId: {
        type: 'string',
        description: 'Exact record to change. Takes precedence over the name.',
        required: false,
        resolver: 'none',
      },
      doctorName: {
        type: 'string',
        description: 'Record to change, by name.',
        required: false,
        resolver: 'none',
      },
      isActive: {
        type: 'boolean',
        description:
          'Keep the doctor in the referral directory. Set false to retire the record without deleting it.',
        required: false,
        resolver: 'none',
      },
      name: {
        type: 'string',
        description: 'Doctor name.',
        required: false,
        resolver: 'none',
      },
      specialty: {
        type: 'string',
        description: 'Their specialty.',
        required: false,
        resolver: 'none',
      },
      clinicName: {
        type: 'string',
        description: 'Practice or clinic they work at.',
        required: false,
        resolver: 'none',
      },
      phone: {
        type: 'string',
        description: 'Contact phone number.',
        required: false,
        resolver: 'none',
      },
      email: {
        type: 'string',
        description: 'Contact email address.',
        required: false,
        resolver: 'none',
      },
      fax: {
        type: 'string',
        description: 'Fax number, still used for referrals in some markets.',
        required: false,
        resolver: 'none',
      },
      street: {
        type: 'string',
        description: 'Street address.',
        required: false,
        resolver: 'none',
      },
      unit: {
        type: 'string',
        description: 'Suite or unit number.',
        required: false,
        resolver: 'none',
      },
      city: {
        type: 'string',
        description: 'City.',
        required: false,
        resolver: 'none',
      },
      province: {
        type: 'string',
        description: 'Province or state.',
        required: false,
        resolver: 'none',
      },
      postalCode: {
        type: 'string',
        description: 'Postal or ZIP code.',
        required: false,
        resolver: 'none',
      },
      country: {
        type: 'string',
        description: 'Country.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['change Dr Smith details', 'update that doctor'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'clinic.update_external_doctor',
      captures: ['doctorId', 'previousValues'],
    },
    handler: 'AiExternalDoctorsService',
  },
  {
    id: 'operations.update_schedule_template',
    aliases: ['update_schedule_template'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Change a schedule template.',
    // §177 (C2/T1) — identify by name, rename with `newName`.
    variables: {
      templateName: {
        type: 'string',
        description: 'Template to update.',
        required: false,
        resolver: 'none',
      },
      newName: {
        type: 'string',
        description: 'New name for the template.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['change that template', 'update the standard week'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'operations.update_schedule_template',
      captures: ['templateId', 'previousValues'],
    },
    handler: 'AiScheduleHandlersService',
  },
  {
    id: 'operations.update_service_prices',
    aliases: ['update_service_prices'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Change the prices of services.',
    variables: {
      // `prepareUpdateServicePricesPlanLogic` -> `parsePriceAdjustment` +
      // `priceAdjustmentScopeHints`. The names are the ones the handler's own
      // failure message uses: "Specify a percent or dollar amount change and
      // optional category".
      //
      // `amountChange` is also spelled `priceChangeAmount`, `absoluteChange`
      // and `priceDelta`; `percentChange` also `priceChangePercent`. One name
      // each is declared — the `required` field has no "one of" form, and
      // e2e-bug.164 is what happens when the two kinds get confused.
      percentChange: {
        type: 'number',
        description:
          'Percentage to move prices by. Falls back to a percentage found in the message.',
        required: false,
        resolver: 'none',
      },
      amountChange: {
        type: 'number',
        description:
          'Currency amount to move prices by. Takes precedence over a percentage whenever the message uses money units — e2e-bug.164.',
        required: false,
        resolver: 'money',
      },
      serviceName: {
        type: 'string',
        description:
          'Limit the change to one service. Without a scope every service is repriced.',
        required: false,
        resolver: 'service',
      },
      serviceCategory: {
        type: 'string',
        description: 'Limit the change to one category of services.',
        required: false,
        resolver: 'none',
      },
      effectiveFrom: {
        type: 'string',
        description: 'Date the new prices start from.',
        required: false,
        resolver: 'date',
      },
      onlyWithOnlinePayment: {
        type: 'boolean',
        description:
          'Reprice only services that accept online payment, leaving the rest untouched.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['put all prices up 10 percent', 'update our service prices'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Changes many service prices at once; restoring them needs per-row pre-state.',
    },
    handler: 'AiOperationsService',
  },
  {
    id: 'compliance.update_strategy_eval',
    aliases: ['update_strategy_eval'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Update the recorded compliance strategy evaluation.',
    // §177 (C2/T1) — the widest input set in this cluster; three separate
    // refusals name `evalType`, `answers` and `criterionWeights`.
    variables: {
      evalType: {
        type: 'string',
        description: 'Which strategy evaluation is being updated.',
        required: true,
        resolver: 'none',
      },
      answers: {
        type: 'object',
        description: 'Answers supplied for the evaluation.',
        required: false,
        resolver: 'none',
      },
      criterionWeights: {
        type: 'object',
        description: 'Weighting applied to each criterion.',
        required: false,
        resolver: 'none',
      },
      decision: {
        type: 'string',
        description: 'Recorded decision for the evaluation.',
        required: false,
        resolver: 'none',
      },
      directoryOptIn: {
        type: 'boolean',
        description: 'Whether the business opts into the directory.',
        required: false,
        resolver: 'none',
      },
      notes: {
        type: 'string',
        description: 'Free-text notes on the evaluation.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'update our strategy evaluation',
      'revise the compliance assessment',
    ],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'compliance.update_strategy_eval',
      captures: ['previousValues'],
    },
    handler: 'AiBusinessComplianceService',
  },
  {
    id: 'operations.update_team_member_role',
    aliases: ['update_team_member_role'],
    domain: 'operations',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['owner'] },
    risk: 'T2',
    description: 'Change what a team member is allowed to do.',
    variables: {
      // `handleUpdateTeamMemberRoleLogic` — the only command in this slice
      // with genuinely required inputs. It reads params and nothing else: no
      // prompt extraction, no default, no "one of" alternative spelling. Both
      // absences return a `failure` naming the field.
      employeeName: {
        type: 'string',
        description: 'Whose role to change.',
        required: true,
        resolver: 'employee',
      },
      role: {
        type: 'string',
        description:
          'The new role. Anything outside the list comes back as a failure listing the real ones.',
        required: true,
        resolver: 'none',
        enum: ['admin', 'manager', 'staff', 'contributor'],
      },
    },
    examples: ['make Mary a manager', 'change their role'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'operations.update_team_member_role',
      captures: ['employeeId', 'previousRole'],
    },
    handler: 'AiOperationsService',
  },
  {
    id: 'compliance.view_phi_access_audit',
    aliases: ['view_phi_access_audit'],
    domain: 'compliance',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Show who has accessed patient data.',
    // §190 (C2/T0) — the only one in the cluster with a real query shape:
    // `parseViewPhiAccessAuditFromPrompt` reads the field and limit, and
    // `parsePhiAccessAuditDaysBack` adds the window.
    variables: {
      fieldName: {
        type: 'string',
        description: 'Restrict the audit to accesses of one PHI field.',
        required: false,
        resolver: 'none',
      },
      daysBack: {
        type: 'number',
        description: 'How far back the audit reaches.',
        required: false,
        resolver: 'none',
      },
      limit: {
        type: 'number',
        description: 'How many audit rows to return.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['who looked at this patient record', 'show the PHI access log'],
    confirm: 'never',
    handler: 'AiBusinessComplianceService',
  },
] as const;
