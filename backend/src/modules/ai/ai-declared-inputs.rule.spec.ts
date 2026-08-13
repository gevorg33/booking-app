/**
 * tech-debt C2 / e2e-bug.418 — how many high-risk commands still say they take
 * nothing.
 *
 * **41** of 696 specs declared any variables; **655 declared none**, and 297 of
 * those mutate. `CommandSpec` is described throughout the roadmap as the single
 * source of truth for what a command takes, and for 94% of the registry it says
 * "nothing".
 *
 * That is not cosmetic. `e2e-bug.410` is the shape it produces: `claim_referral_code`
 * declared `variables: {}` while its handler read `params.referralCode`, and 96
 * users were asked for a code they had just typed. And `e2e-bug.399` is the
 * mirror — `appointment.reschedule` declared variables **no handler reads**, so
 * the planner refused every prompt for two commands.
 *
 * ## The rule, at last
 *
 * C2's last checkbox was *"add a conformance rule that a mutating spec must
 * declare at least one variable, **once the backlog is cleared**"*. For twenty
 * slices this file was a **ratchet** instead — a ceiling that could only fall —
 * because the rule shipped against 134 undeclared commands would have failed on
 * day one and been switched off, which is worse than not having it.
 *
 * The backlog is now cleared for T2/T3, so this is the rule. Every T2 or T3
 * spec must declare at least one variable unless it appears in one of the two
 * exemption lists below, each of which names its members and says why.
 *
 * A rule is strictly stronger than the ceiling it replaces. The ceiling could
 * be satisfied by declaring *something else* — drive one command to zero
 * variables and another from zero to one, and the count is unchanged. The rule
 * cannot be traded off that way: every command answers for itself.
 *
 * ## `variables: {}` means two different things
 *
 * The count C2 works from — and this file's first three slices worked from —
 * treats every empty `variables` as a gap. It is not. Some commands read no
 * user-supplied parameter at all, and for those `variables: {}` is **correct**:
 * "apply the default schedule" takes nothing because there is nothing to take.
 *
 * Counting them as undeclared overstates the backlog and makes the ceiling
 * unreachable — driving it to zero would mean inventing inputs, which is
 * `e2e-bug.399` again.
 *
 * `VERIFIED_NO_INPUT` separates them. Two shapes qualify, both checkable by
 * reading the signature and body rather than by assertion:
 *
 * 1. **no `params` argument** —
 *    `handleApplyOnboardingScheduleLogic(deps, businessId, userId)`;
 * 2. **`params` present but only pipeline-injected keys read** — `_prompt`,
 *    `_timeZone`, `conversationHistory`. `handleApplyTourPlaybookLogic` parses
 *    everything it needs out of the message text;
 *    `handleBulkStripDisabledLocaleTranslationsLogic` reads nothing at all —
 *    its scope is "every disabled locale", which takes no argument.
 */
import { COMMAND_SPECS } from './ai-command-spec.registry.js';

type Spec = (typeof COMMAND_SPECS)[number] & {
  risk?: string;
  variables?: Record<string, unknown>;
};

const HIGH_RISK = (COMMAND_SPECS as unknown as Spec[]).filter(
  (s) => s.risk === 'T2' || s.risk === 'T3',
);

/**
 * Commands whose handler takes no `params` argument, verified by reading the
 * signature. `variables: {}` is the right answer for these, so they are not
 * part of the backlog.
 *
 * Append only with the signature quoted in the commit that adds it — an
 * unverified entry here silently shrinks the number this file exists to hold.
 */
const VERIFIED_NO_INPUT: readonly string[] = [
  // Shape 1 — no `params` argument.
  'onboarding.apply_schedule',
  'onboarding.apply_playbook',
  'agent.undo_latest_task',
  // Shape 2 — `params` present, only pipeline-injected keys read.
  'clinic.apply_playbook',
  'tour.apply_playbook',
  'booking.reschedule_package_lines',
  'business.bulk_strip_disabled_locales',
  // `handleBookWithCashLogic(deps, businessId, _params)` — the parameter is
  // named `_params` and never read. The command is a payment-method choice:
  // it checks that the business accepts cash and puts `paymentMethod: 'cash'`
  // into the session. What is being booked is already in the cart.
  'booking.book_with_cash',
  // `handleTriggerReengagementLogic(deps, businessId)` — shape 1 again. The
  // campaign's audience is "customers who have lapsed", computed from the
  // business's own data; there is no segment to pass in.
  'marketing.trigger_reengagement',
  // `handlePrivacyExportLogic` reads `_prompt` and `sessionCustomerId` only.
  // "Export my data" is fully specified by who is asking — there is no scope,
  // format or range to pass.
  'customer.privacy_export',
];

/**
 * The second exemption: commands with nothing to declare because the call site
 * passes no structured field at all.
 *
 * Both route through `runOrchestrationIntent`, which takes the raw message as
 * its `intent`. That alone is **not** grounds for exemption —
 * `operations.resolve_conflicts` and `operations.reassign_cancelled` route the
 * same way and both pass `params.date`, so both are declared. These two pass
 * nothing beyond the message and the session, so there is no contract to write
 * down rather than a contract left unwritten.
 *
 * If either ever gains a structured field, it must be declared and removed from
 * here — the assertion below names them, so adding a third has to argue.
 */
const ORCHESTRATION_NO_CONTRACT: readonly string[] = [
  'operations.create_services',
  'operations.optimize_schedule',
];

const EXEMPT = new Set<string>([
  ...VERIFIED_NO_INPUT,
  ...ORCHESTRATION_NO_CONTRACT,
]);

/**
 * How the backlog was cleared, 2026-08-11, twenty slices: 134 → 0.
 *
 * | slice | undeclared |
 * |---|---|
 * | start | 134 |
 * | `AiPaymentsService` — 12 T2 money commands | 122 |
 * | the schedule-rewriting T3s — 6 bulk commands | 116 |
 * | the remaining traceable `operations` T3s — 4 | 112 |
 * | onboarding + agent-ops T3s | 107 |
 * | the last traceable T3s | 99 |
 * | `AiRetailFinanceService` — 11 | 88 |
 * | `AiSelfServiceBookingService` | 81 |
 * | `AiOperationsService` — 7 | 74 |
 * | `AiCommandService` — 9 of 11 | 65 |
 * | `AiMarketingGrowthService` | 58 |
 * | `AiBusinessComplianceService` — 6 | 52 |
 * | `AiCustomerCrmService` | 47 |
 * | `AiBookingDepthService` — 6 | 41 |
 * | `AiIntegrationsService` — 6 | 35 |
 * | `AiPatientClinicalMutationsService` — 5 | 30 |
 * | `AiClinicTestResultService` — 4 | 26 |
 * | gift fulfilment + tax + agent ops — 8 | 18 |
 * | currency + external doctors + provider retail — 6 | 12 |
 * | the nine single-command handlers | 3 |
 * | `update_my_profile`, once e2e-bug.441 let it be declared | **0** |
 */
const UNDECLARED = HIGH_RISK.filter(
  (s) => Object.keys(s.variables ?? {}).length === 0 && !EXEMPT.has(s.id),
);

describe('C2 conformance rule — high-risk commands declare what they take (e2e-bug.418)', () => {
  it('every T2/T3 spec declares at least one variable, or is a named exemption', () => {
    // C2's conformance rule. Named rather than counted: a count can be
    // satisfied by declaring something else, a name cannot.
    expect(UNDECLARED.map((s) => s.id)).toEqual([]);
  });

  it('still has a high-risk population to measure', () => {
    // If the risk tiers were renamed this file would silently pass by
    // measuring an empty set.
    expect(HIGH_RISK.length).toBeGreaterThan(100);
  });

  it('the payments slice stays declared', () => {
    // Named individually rather than counted: the ceiling alone cannot tell a
    // revert here from progress elsewhere.
    const payments = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) => s.handler === 'AiPaymentsService' && (s.risk === 'T2' || s.risk === 'T3'),
    );
    expect(payments.length).toBe(12);
    const bare = payments
      .filter((s) => Object.keys(s.variables ?? {}).length === 0)
      .map((s) => s.id);
    expect(bare).toEqual([]);
  });

  it('the schedule-rewriting T3s stay declared', () => {
    // The six traced in the second slice. Named for the same reason as the
    // payments slice: a ceiling cannot tell a revert here from progress
    // elsewhere.
    const slice = [
      'schedule.swap_schedules',
      'schedule.rebalance_capacity',
      'schedule.holiday_mode',
      'operations.clear_schedule',
      'operations.day_replan',
      'operations.fill_unused_slots',
    ];
    const bare = slice.filter((id) => {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === id);
      expect(spec).toBeDefined();
      return Object.keys(spec!.variables ?? {}).length === 0;
    });
    expect(bare).toEqual([]);
  });

  it('the retail-finance slice stays declared', () => {
    const retail = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        s.handler === 'AiRetailFinanceService' &&
        (s.risk === 'T2' || s.risk === 'T3'),
    );
    expect(retail.length).toBe(11);
    const bare = retail
      .filter((s) => Object.keys(s.variables ?? {}).length === 0)
      .map((s) => s.id);
    expect(bare).toEqual([]);
  });

  it('the operations T3 slice stays declared', () => {
    const slice = [
      'operations.apply_and_fill',
      'operations.sick_day_replan',
      'operations.bulk_smart_cancel',
      'operations.import_services_from_menu',
    ];
    const bare = slice.filter((id) => {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === id);
      expect(spec).toBeDefined();
      return Object.keys(spec!.variables ?? {}).length === 0;
    });
    expect(bare).toEqual([]);
  });

  it('bulk_smart_cancel declares every filter, because the filters are the blast radius', () => {
    // T3 and destructive: it cancels whatever the filters match. A filter the
    // planner cannot name is one it cannot narrow, so an undeclared filter is
    // not a documentation gap here — it is a wider cancellation.
    const spec = (COMMAND_SPECS as unknown as Spec[]).find(
      (s) => s.id === 'operations.bulk_smart_cancel',
    )!;
    const names = Object.keys(spec.variables ?? {});
    for (const filter of ['employeeName', 'serviceName', 'date', 'statusFilter']) {
      expect(names).toContain(filter);
    }
  });

  it('the self-service booking slice stays declared', () => {
    const slice = [
      'booking.book_multi_service',
      'booking.book_package',
      'booking.book_with_gift_card',
      'booking.use_subscription_credit',
      'booking.select_subscription_plan',
      'booking.cancel_my_subscription',
    ];
    const bare = slice.filter((id) => {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === id);
      expect(spec).toBeDefined();
      return Object.keys(spec!.variables ?? {}).length === 0;
    });
    expect(bare).toEqual([]);
  });

  it('declares nothing on the self-service slice that its handlers cannot use', () => {
    // The e2e-bug.399 direction, twice over.
    //
    // `serviceIds` / `cartServiceIds` on `book_multi_service` and `packageId`
    // on `book_package` are read, but they are ids that arrive from the
    // session cart — a planner asked for one can only guess a UUID.
    //
    // `lines` is read by both, and only for presence: `!params.blockStartTime
    // && !params.lines` picks which reply to send. Declaring it would invite a
    // planner to build a structure nothing downstream consumes.
    const names = (id: string) =>
      Object.keys(
        (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === id)!
          .variables ?? {},
      );
    for (const forbidden of ['serviceIds', 'cartServiceIds', 'lines']) {
      expect(names('booking.book_multi_service')).not.toContain(forbidden);
    }
    for (const forbidden of ['packageId', 'lines']) {
      expect(names('booking.book_package')).not.toContain(forbidden);
    }
  });

  it('requires nothing on the self-service slice, because every handler has a fallback', () => {
    // Each of the six either defaults (the sole active subscription, the first
    // plan, the session cart) or returns a clarification naming the real
    // options. `required: true` anywhere here would turn an answerable prompt
    // into a refusal — e2e-bug.399 exactly.
    const selfService = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        s.handler === 'AiSelfServiceBookingService' &&
        (s.risk === 'T2' || s.risk === 'T3'),
    );
    const required = selfService.flatMap((s) =>
      Object.entries(s.variables ?? {})
        .filter(([, v]) => (v as { required?: boolean }).required)
        .map(([name]) => `${s.id}.${name}`),
    );
    expect(required).toEqual([]);
  });

  it('the operations staff/pricing slice stays declared', () => {
    const operations = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        s.handler === 'AiOperationsService' &&
        (s.risk === 'T2' || s.risk === 'T3'),
    );
    // The handler is now fully declared. `create_services` and
    // `optimize_schedule` carry the `operations` domain but not this handler —
    // their spec says `AiCommandService`, which is where `runOrchestrationIntent`
    // lives, and is why they have no param contract to read.
    expect(operations.length).toBeGreaterThanOrEqual(7);
    const bare = operations
      .filter((s) => Object.keys(s.variables ?? {}).length === 0)
      .map((s) => s.id);
    expect(bare).toEqual([]);
  });

  it('update_team_member_role requires both of its inputs, because it has no fallback', () => {
    // The only command outside payments where `required: true` is honest: it
    // reads params and nothing else — no prompt extraction, no default, no
    // alternative spelling. Both absences return a failure naming the field.
    const spec = (COMMAND_SPECS as unknown as Spec[]).find(
      (s) => s.id === 'operations.update_team_member_role',
    )!;
    const required = Object.entries(spec.variables ?? {})
      .filter(([, v]) => (v as { required?: boolean }).required)
      .map(([name]) => name)
      .sort();
    expect(required).toEqual(['employeeName', 'role']);

    // The role list is closed — an undeclared enum invites a planner to invent
    // a role the handler will reject.
    const role = (spec.variables ?? {}).role as { enum?: string[] };
    expect(role.enum).toEqual(['admin', 'manager', 'staff', 'contributor']);
  });

  it('no_show_recovery declares every filter, because the filters are the blast radius', () => {
    // Same argument as `bulk_smart_cancel`, and the same shape: with no filter
    // this matches every past pending/confirmed/in-progress booking in the
    // business. The two widening flags count as filters here — `allProviders`
    // and `allAppointments` make the sweep bigger, not smaller.
    const spec = (COMMAND_SPECS as unknown as Spec[]).find(
      (s) => s.id === 'operations.no_show_recovery',
    )!;
    const names = Object.keys(spec.variables ?? {});
    for (const filter of [
      'employeeName',
      'serviceName',
      'date',
      'dateFrom',
      'dateTo',
      'allProviders',
      'allAppointments',
    ]) {
      expect(names).toContain(filter);
    }
    // Pipeline-injected, on the same grounds as the schedule slice.
    expect(names).not.toContain('_timeZone');
  });

  it('update_service_prices declares one spelling per change kind', () => {
    // The handler accepts `amountChange` | `priceChangeAmount` |
    // `absoluteChange` | `priceDelta`, and `percentChange` |
    // `priceChangePercent`. Declaring all six would suggest they compose;
    // they do not, and e2e-bug.164 is what confusing the two kinds costs.
    const spec = (COMMAND_SPECS as unknown as Spec[]).find(
      (s) => s.id === 'operations.update_service_prices',
    )!;
    const names = Object.keys(spec.variables ?? {});
    expect(names).toContain('percentChange');
    expect(names).toContain('amountChange');
    for (const alias of [
      'priceChangeAmount',
      'absoluteChange',
      'priceDelta',
      'priceChangePercent',
    ]) {
      expect(names).not.toContain(alias);
    }
  });

  it('only the two orchestration T3s are left in AiCommandService', () => {
    const own = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        s.handler === 'AiCommandService' && (s.risk === 'T2' || s.risk === 'T3'),
    );
    expect(own.length).toBeGreaterThanOrEqual(11);
    const bare = own
      .filter((s) => Object.keys(s.variables ?? {}).length === 0)
      .map((s) => s.id)
      .sort();
    expect(bare).toEqual([
      'operations.create_services',
      'operations.optimize_schedule',
    ]);
  });

  it('the two orchestration-routed commands that DO have a contract keep it', () => {
    // `resolve_conflicts` and `reassign_cancelled` also go through
    // `runOrchestrationIntent`, and both pass `params.date` alongside the raw
    // message. So "routes through orchestration" is not by itself a reason a
    // command cannot be declared — `create_services` and `optimize_schedule`
    // are blocked because they pass no structured field at all, which is a
    // narrower claim than the earlier slices made.
    for (const id of [
      'operations.resolve_conflicts',
      'operations.reassign_cancelled',
    ]) {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === id)!;
      expect(Object.keys(spec.variables ?? {})).toEqual(['date']);
    }
  });

  it('the bulk booking-status commands declare every filter', () => {
    // `mark_no_shows` marks bookings no-show and `payment_sweep` marks them
    // paid, both in bulk and both selected by filters alone. Same argument as
    // `bulk_smart_cancel` and `no_show_recovery`.
    for (const id of ['operations.mark_no_shows', 'operations.payment_sweep']) {
      const names = Object.keys(
        (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === id)!
          .variables ?? {},
      );
      for (const filter of [
        'employeeName',
        'serviceName',
        'date',
        'dateFrom',
        'dateTo',
      ]) {
        expect(names).toContain(filter);
      }
      expect(names).not.toContain('_timeZone');
    }
  });

  it('the marketing-growth slice stays declared', () => {
    const marketing = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        s.handler === 'AiMarketingGrowthService' &&
        (s.risk === 'T2' || s.risk === 'T3'),
    );
    expect(marketing.length).toBeGreaterThanOrEqual(7);
    const bare = marketing
      .filter((s) => Object.keys(s.variables ?? {}).length === 0)
      .map((s) => s.id);
    // `trigger_reengagement` is exempt, not undeclared.
    expect(bare).toEqual(['marketing.trigger_reengagement']);
  });

  it('confirm_billing_checkout requires its session id', () => {
    // The fifth required variable in the backlog, on the payments-slice
    // criterion: `missing: ['sessionId']` with no fallback. Stripe returns the
    // id in the redirect URL, so there is nothing to infer it from.
    const spec = (COMMAND_SPECS as unknown as Spec[]).find(
      (s) => s.id === 'marketing.confirm_billing_checkout',
    )!;
    const required = Object.entries(spec.variables ?? {})
      .filter(([, v]) => (v as { required?: boolean }).required)
      .map(([name]) => name);
    expect(required).toEqual(['sessionId']);
  });

  it('configure_stripe_connect declares nothing the parser overwrites', () => {
    // `mode` and `country` are produced by
    // `parseConfigureStripeConnectFromPrompt` from the message and never read
    // back off params — declaring them is the e2e-bug.399 direction.
    const names = Object.keys(
      (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === 'marketing.configure_stripe_connect',
      )!.variables ?? {},
    );
    expect(names).toEqual(['startOnboarding']);
  });

  it('the compliance slice stays declared', () => {
    const compliance = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        s.handler === 'AiBusinessComplianceService' &&
        (s.risk === 'T2' || s.risk === 'T3'),
    );
    expect(compliance.length).toBeGreaterThanOrEqual(6);
    const bare = compliance
      .filter((s) => Object.keys(s.variables ?? {}).length === 0)
      .map((s) => s.id);
    expect(bare).toEqual([]);
  });

  it('admin_delete_customer_data names its target two ways', () => {
    // GDPR erasure with `compensation: none` — it calls
    // `customerPrivacyService.deleteCustomerData` with no preview step. The
    // name match is fuzzy (`resolveCustomerByName`), so `customerId` is the
    // only way to be certain which person is erased. Declaring only the field
    // the failure message mentions would leave the precise one invisible.
    const names = Object.keys(
      (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === 'compliance.admin_delete_customer_data',
      )!.variables ?? {},
    );
    expect(names).toContain('customerName');
    expect(names).toContain('customerId');
  });

  it('configure_privacy_retention names each retention clock separately', () => {
    // The handler reports `missing: ['retention', 'cookieBanner']` — groups,
    // not fields. Declaring only those two would leave a planner to phrase
    // "keep data for 3 years" and let `detectRetentionField` guess which of
    // four clocks to shorten.
    const names = Object.keys(
      (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === 'compliance.configure_privacy_retention',
      )!.variables ?? {},
    );
    for (const field of [
      'bookingHistoryDays',
      'customerPiiDays',
      'aiCommandLogsDays',
      'auditLogsDays',
    ]) {
      expect(names).toContain(field);
    }
    expect(names).not.toContain('retention');
    expect(names).not.toContain('cookieBanner');
  });

  it('the customer-CRM slice stays declared', () => {
    const crm = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        s.handler === 'AiCustomerCrmService' &&
        (s.risk === 'T2' || s.risk === 'T3'),
    );
    expect(crm.length).toBeGreaterThanOrEqual(6);
    // Exempt commands are not part of the backlog, so they are excluded here
    // the same way `UNDECLARED` excludes them.
    const bare = crm
      .filter(
        (s) =>
          Object.keys(s.variables ?? {}).length === 0 &&
          !VERIFIED_NO_INPUT.includes(s.id),
      )
      .map((s) => s.id)
      .sort();
    // `update_my_profile` was the last one here; e2e-bug.441 is fixed and it
    // is declared, so the handler is clear.
    expect(bare).toEqual([]);
  });

  it('privacy_delete declares the confirm gate itself', () => {
    // The two-step gate is the only input, and an undeclared gate is one a
    // planner cannot see. e2e-bug.200 is open on this command's preview step.
    const names = Object.keys(
      (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === 'customer.privacy_delete',
      )!.variables ?? {},
    );
    expect(names).toEqual(['confirm']);
  });

  it('customer.merge names which record survives', () => {
    // Merging is not symmetric: the primary survives, the secondary is
    // retired. Declaring only "the two customers" would leave the direction
    // to chance on an irreversible command.
    const names = Object.keys(
      (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === 'customer.merge')!
        .variables ?? {},
    );
    for (const field of [
      'primaryCustomerName',
      'secondaryCustomerName',
      'primaryCustomerId',
      'secondaryCustomerId',
    ]) {
      expect(names).toContain(field);
    }
  });

  it('the booking-depth slice stays declared', () => {
    const depth = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        s.handler === 'AiBookingDepthService' &&
        (s.risk === 'T2' || s.risk === 'T3'),
    );
    expect(depth.length).toBeGreaterThanOrEqual(6);
    const bare = depth
      .filter(
        (s) =>
          Object.keys(s.variables ?? {}).length === 0 &&
          !VERIFIED_NO_INPUT.includes(s.id),
      )
      .map((s) => s.id);
    expect(bare).toEqual([]);
  });

  it('the multi-service group commands say the whole group moves', () => {
    // `bookingId` here is any one line of the visit, and the handler expands
    // it to the group. A planner reading "bookingId" without the description
    // would reasonably expect one appointment to change.
    for (const id of [
      'booking.cancel_multi_service_group',
      'booking.reschedule_multi_service_group',
    ]) {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === id)!;
      const bookingId = (spec.variables ?? {}).bookingId as {
        description?: string;
      };
      expect(bookingId).toBeDefined();
      expect(bookingId.description).toMatch(/group|visit/i);
    }
  });

  it('the integrations slice stays declared', () => {
    const integrations = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        s.handler === 'AiIntegrationsService' &&
        (s.risk === 'T2' || s.risk === 'T3'),
    );
    expect(integrations.length).toBeGreaterThanOrEqual(6);
    const bare = integrations
      .filter(
        (s) =>
          Object.keys(s.variables ?? {}).length === 0 &&
          !VERIFIED_NO_INPUT.includes(s.id),
      )
      .map((s) => s.id);
    expect(bare).toEqual([]);
  });

  it('never declares a credential as a planner variable', () => {
    // `configure_openai_integration`'s handler reads `params.apiKey`, so a
    // read-the-handler sweep would offer it. It stays undeclared on purpose:
    // declaring a secret advertises that it belongs in a structured command
    // parameter, which then travels through classification, plan validation,
    // the confirmation payload and trace persistence.
    //
    // e2e-bug.442 is why this is not merely a preference — the raw key
    // currently survives `sanitizeCommandDetailsForClient` under `patch`.
    const spec = (COMMAND_SPECS as unknown as Spec[]).find(
      (s) => s.id === 'integration.configure_openai',
    )!;
    expect(Object.keys(spec.variables ?? {})).toEqual(['usePlatformDefault']);

    // The rule, not just the instance: no T2/T3 spec anywhere may declare a
    // variable whose name reads as a secret.
    const offenders: string[] = [];
    for (const s of HIGH_RISK) {
      for (const name of Object.keys(s.variables ?? {})) {
        if (/(?:^|[a-z])(?:apiKey|secret|password|token|clientSecret|privateKey)$/i.test(name)) {
          offenders.push(`${s.id}.${name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the clinical-mutations slice stays declared', () => {
    const clinical = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        s.handler === 'AiPatientClinicalMutationsService' &&
        (s.risk === 'T2' || s.risk === 'T3'),
    );
    expect(clinical.length).toBeGreaterThanOrEqual(5);
    const bare = clinical
      .filter(
        (s) =>
          Object.keys(s.variables ?? {}).length === 0 &&
          !VERIFIED_NO_INPUT.includes(s.id),
      )
      .map((s) => s.id);
    expect(bare).toEqual([]);
  });

  it('every clinical mutation offers an exact patient identifier', () => {
    // All five resolve the patient through `resolvePatientClinicalCustomer`,
    // which falls back to a *substring* name match. On a clinical record that
    // is the difference between amending one patient's chart and amending
    // someone else's, so `customerId` must always be reachable — declaring
    // only the field the clarification message leads with would hide it.
    const clinical = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        s.handler === 'AiPatientClinicalMutationsService' &&
        (s.risk === 'T2' || s.risk === 'T3'),
    );
    const missing = clinical
      .filter((s) => !Object.keys(s.variables ?? {}).includes('customerId'))
      .map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it('the clinic test-result slice stays declared', () => {
    const lab = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        s.handler === 'AiClinicTestResultService' &&
        (s.risk === 'T2' || s.risk === 'T3'),
    );
    expect(lab.length).toBeGreaterThanOrEqual(4);
    const bare = lab
      .filter(
        (s) =>
          Object.keys(s.variables ?? {}).length === 0 &&
          !VERIFIED_NO_INPUT.includes(s.id),
      )
      .map((s) => s.id);
    expect(bare).toEqual([]);
  });

  it('both patient-disclosure commands declare what is disclosed and to whom', () => {
    // `release_patient_document` and `release_test_result` are the two points
    // where clinical data becomes visible to the patient. Each needs a way to
    // name the *thing* released as well as the person — declaring only the
    // patient would leave the scope of a release implicit.
    const doc = Object.keys(
      (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === 'clinical.release_patient_document',
      )!.variables ?? {},
    );
    expect(doc).toContain('documentId');
    expect(doc).toContain('customerId');

    const result = Object.keys(
      (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === 'clinic.release_test_result',
      )!.variables ?? {},
    );
    expect(result).toContain('resultId');
    expect(result).toContain('customerName');
  });

  it('the three small handlers stay declared', () => {
    // Batched because each has only three T2/T3 commands; named individually
    // so a revert in one is not masked by the other two.
    for (const handler of [
      'AiGiftFulfillmentService',
      'AiBusinessTaxService',
      'AiAgentOpsService',
    ]) {
      const slice = (COMMAND_SPECS as unknown as Spec[]).filter(
        (s) => s.handler === handler && (s.risk === 'T2' || s.risk === 'T3'),
      );
      expect(slice.length).toBeGreaterThanOrEqual(3);
      const bare = slice
        .filter(
          (s) =>
            Object.keys(s.variables ?? {}).length === 0 &&
            !VERIFIED_NO_INPUT.includes(s.id),
        )
        .map((s) => s.id);
      expect(bare).toEqual([]);
    }
  });

  it('enums cover the values the handler accepts, not the ones the description names', () => {
    // `resolve_gift_card_change_request` is described as "approve or reject"
    // and the handler takes a third value, `needs_info`, which returns the
    // request to the customer. An enum copied from the description would make
    // that branch unreachable through the planner.
    const spec = (COMMAND_SPECS as unknown as Spec[]).find(
      (s) => s.id === 'commerce.resolve_gift_card_change_request',
    )!;
    const resolution = (spec.variables ?? {}).resolution as { enum?: string[] };
    expect(resolution.enum).toEqual(['approve', 'deny', 'needs_info']);
  });

  it('the three two-command handlers stay declared', () => {
    for (const handler of [
      'AiBusinessCurrencyService',
      'AiExternalDoctorsService',
      'AiProviderExp3Service',
    ]) {
      const slice = (COMMAND_SPECS as unknown as Spec[]).filter(
        (s) => s.handler === handler && (s.risk === 'T2' || s.risk === 'T3'),
      );
      expect(slice.length).toBeGreaterThanOrEqual(2);
      const bare = slice
        .filter(
          (s) =>
            Object.keys(s.variables ?? {}).length === 0 &&
            !VERIFIED_NO_INPUT.includes(s.id),
        )
        .map((s) => s.id);
      expect(bare).toEqual([]);
    }
  });

  it('the external-doctor record declares every address part', () => {
    // The address is six separate params, not one free-text field. Declaring
    // `street` alone would silently drop the rest of any address a planner
    // supplied — the failure would look like a partial save, not an error.
    for (const id of [
      'clinic.create_external_doctor',
      'clinic.update_external_doctor',
    ]) {
      const names = Object.keys(
        (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === id)!
          .variables ?? {},
      );
      for (const part of [
        'street',
        'unit',
        'city',
        'province',
        'postalCode',
        'country',
      ]) {
        expect(names).toContain(part);
      }
    }
  });

  it('the provider retail commands do not declare a booking they resolve from session', () => {
    // `resolveProviderBooking` finds the provider's own active booking from
    // `sessionEmployeeId`. Declaring a `bookingId` would invite a planner to
    // name someone else's booking on a command that changes what a client
    // pays — the session scope is the authorisation.
    for (const id of [
      'provider.add_retail_to_booking',
      'provider.remove_retail_from_booking',
    ]) {
      const names = Object.keys(
        (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === id)!
          .variables ?? {},
      );
      expect(names).toContain('productName');
      expect(names).not.toContain('bookingId');
      expect(names).not.toContain('sessionEmployeeId');
    }
  });

  it('keeps the orchestration exemption named, so it cannot grow quietly', () => {
    // The twin of the `VERIFIED_NO_INPUT` assertion below. These two lists are
    // the rule's only escape hatch, so both are pinned by value — a third
    // entry has to be added here deliberately and argued for.
    expect([...ORCHESTRATION_NO_CONTRACT].sort()).toEqual([
      'operations.create_services',
      'operations.optimize_schedule',
    ]);
  });

  it('every orchestration-exempt command really declares nothing', () => {
    // If one of them ever gains a declaration, it is no longer exempt and the
    // list must shrink — otherwise the exemption hides a live command.
    for (const id of ORCHESTRATION_NO_CONTRACT) {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === id);
      expect(spec).toBeDefined();
      expect(Object.keys(spec!.variables ?? {})).toEqual([]);
    }
  });

  it('every verified-no-input command really declares nothing', () => {
    // The list is an exemption, so it must not drift into a place to hide a
    // command that later gained inputs.
    for (const id of VERIFIED_NO_INPUT) {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === id);
      expect(spec).toBeDefined();
      expect(Object.keys(spec!.variables ?? {})).toEqual([]);
    }
  });

  it('keeps the no-input exemption named, so it cannot grow quietly', () => {
    expect([...VERIFIED_NO_INPUT].sort()).toEqual([
      'agent.undo_latest_task',
      'booking.book_with_cash',
      'booking.reschedule_package_lines',
      'business.bulk_strip_disabled_locales',
      'clinic.apply_playbook',
      'customer.privacy_export',
      'marketing.trigger_reengagement',
      'onboarding.apply_playbook',
      'onboarding.apply_schedule',
      'tour.apply_playbook',
    ]);
  });

  it('the T3 bulk tier is fully declared apart from the two exemptions', () => {
    // 25 T3 commands at the start; every one either declares its inputs or is
    // named in `ORCHESTRATION_NO_CONTRACT`.
    // Seven of the 25 are exempt — six via `VERIFIED_NO_INPUT` (playbook and
    // bulk commands that genuinely take nothing) and the two orchestration
    // ones. Everything else declares.
    const t3 = HIGH_RISK.filter((s) => s.risk === 'T3');
    expect(t3.length).toBeGreaterThanOrEqual(20);
    const t3Bare = t3
      .filter(
        (s) => Object.keys(s.variables ?? {}).length === 0 && !EXEMPT.has(s.id),
      )
      .map((s) => s.id);
    expect(t3Bare).toEqual([]);
  });

  it('declares no schedule variable the plan builders do not read', () => {
    // `_timeZone` is injected by the pipeline and read by `resolveDateRange`
    // and `handleDayReplan` — but it is not something a planner supplies, and
    // declaring it would invite one to guess a zone. Same judgement as
    // `sessionCustomerId` on the payments slice.
    for (const id of ['operations.day_replan', 'operations.fill_unused_slots']) {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === id)!;
      expect(Object.keys(spec.variables ?? {})).not.toContain('_timeZone');
    }
  });

  it('the two genuinely-required payment inputs stay required', () => {
    // Both handlers return `missing: [...]` with no fallback, so these are the
    // only two in the slice where `required: true` is honest. e2e-bug.399 is
    // what happens when that judgement goes the other way.
    const required = (id: string) => {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find((s) => s.id === id)!;
      return Object.entries(spec.variables ?? {})
        .filter(([, v]) => (v as { required?: boolean }).required)
        .map(([name]) => name);
    };
    expect(required('payment.collect_cash_confirm')).toEqual(['bookingId']);
    expect(required('payment.purchase_subscription_checkout')).toEqual([
      'planId',
    ]);
  });

  it('declares no variable the payments handlers do not read', () => {
    // The e2e-bug.399 direction. `cardType` and `deliveryMethod` are hardcoded
    // inside `handleBuyGiftCardLogic` rather than read from params, and a regex
    // sweep did offer them — they are absent because the handler was read.
    const buy = (COMMAND_SPECS as unknown as Spec[]).find(
      (s) => s.id === 'payment.buy_gift_card',
    )!;
    const names = Object.keys(buy.variables ?? {});
    expect(names).not.toContain('cardType');
    expect(names).not.toContain('deliveryMethod');

    // Session-injected values are not planner inputs either — asking a planner
    // for a customer id it cannot know is e2e-bug.399's deadlock.
    const payOnline = (COMMAND_SPECS as unknown as Spec[]).find(
      (s) => s.id === 'payment.pay_online',
    )!;
    expect(Object.keys(payOnline.variables ?? {})).not.toContain(
      'sessionCustomerId',
    );
  });
});
