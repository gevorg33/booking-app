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

const T1_SPECS = (COMMAND_SPECS as unknown as Spec[]).filter(
  (s) => s.risk === 'T1',
);

const T0_SPECS = (COMMAND_SPECS as unknown as Spec[]).filter(
  (s) => s.risk === 'T0',
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
 * **Emptied §177 slice 16 — both members failed this list's own test.**
 *
 * It exempted `operations.create_services` and `operations.optimize_schedule` on
 * the grounds that both "route through `runOrchestrationIntent`... and pass
 * nothing beyond the message and the session", explicitly contrasting them with
 * `resolve_conflicts` and `reassign_cancelled`, which "both pass `params.date`,
 * so both are declared".
 *
 * Audited one level down, neither claim holds. `create_services` does not reach
 * `runOrchestrationIntent` at all — `ai-command.service.ts` builds
 * `bulkCreateParams` from `params` and calls `handleCreateServices`, which reads
 * `services`, `categoryName` and `currency`. And `optimize_schedule` passes
 * `date: params.date` into the orchestration run, which is the very criterion
 * quoted above for declaring the other two.
 *
 * Both are now declared. The list is kept, empty, because the *idea* is sound —
 * a command that genuinely passes only the raw message has no contract to write
 * down — and a future entry should have to argue against this history.
 */
const ORCHESTRATION_NO_CONTRACT: readonly string[] = [];

/**
 * Commands whose inputs arrive as **prose, not structured params** — §177.
 *
 * A third category, found in T1's payments-config slice and deliberately kept
 * apart from `VERIFIED_NO_INPUT`. Those commands take nothing; these take
 * plenty — they simply read it out of the prompt text instead of `params`.
 * Their handlers touch only `params._prompt`, which is pipeline-injected, so
 * they qualify as exempt by the letter of the rule above, and conflating the two
 * would hide the distinction that matters.
 *
 * **Corrected twice.** §177 slice 16 removed five members; §177 slice 25 removed two
 * more that slice 16's own re-audit had cleared. The rule it wrote — "check the
 * helper, not just the handler body" — was still too shallow.
 * `configure_loyalty_settings` reads its fields three hops down, in
 * `readBooleanParam(params, 'enabled', 'loyaltyEnabled')` and friends;
 * `join_waitlist` reads `employeeName` inside `enrichJoinWaitlistParamsFromPrompt`.
 * **The criterion is: follow the call chain until it terminates.** Stopping at a
 * fixed depth has now produced wrong answers twice, at depth 1 and at depth 2.
 *
 * Note the shape that makes this hard: a helper can *look* like it reads params
 * and not — `parseConfigureNotificationSettingsFromPrompt` calls
 * `parseToggle(segment, {})`, passing an empty object, so its `params.enabled`
 * read touches nothing. Reading the call site, not just the callee, is what
 * separates that from the two real cases above.
 *
 * §177 slice 16's original note follows: five members were removed after re-audit: they read
 * structured params one level down, inside the very `parse*FromPrompt` helper
 * they delegate to. `parseServiceOnlinePaymentConfig` reads `serviceName` /
 * `serviceNames` / `categoryName` / `allServices` / `depositPercent`;
 * `parseCancelModifyWindowHours` reads `cancelModifyWindowHours` — the exact
 * field its `missing` hint names and which an earlier note here wrongly called
 * "a param it never reads". Entry to this list now requires checking the
 * helper, not just the handler body: a handler-level grep under-reports, and it
 * always under-reports toward "takes nothing", which is the answer that hides a
 * command from the backlog.
 *
 * Why it matters: `variables: {}` is the *honest* answer for these, because
 * declaring inputs no handler reads is `e2e-bug.399` — the planner fills a field
 * and the handler ignores it. But it also means **the planner's variable
 * mechanism cannot drive these commands at all**; they work only when the raw
 * prompt survives to the handler. That is an architectural fact worth naming
 * rather than a gap to close inside C2, and it is why each entry records the
 * parser it delegates to.
 */
const PROMPT_PARSED_NO_PARAMS: readonly string[] = [
  'push.configure_notification_settings',
  // `handleEnableNotificationsLogic` — the toggle comes from
  // `resolveNotificationEnabledFromPrompt`; the customer from session state.
  'push.enable_notifications',
  // `handleGiveProviderAiFeedback` — reads `params._prompt` and
  // `context.lastAction`; the feedback text is the prompt itself.
  'provider.give_ai_feedback',
  // §177 slice 30 — a one-line delegation to `handleEnableNotifications`, so it
  // is prompt-parsed for exactly the same reason its target is. Third
  // duplicate-command pair found by this campaign (`e2e-bug.461`).
  'adoption.manage_notification_preferences',
  // §177 slice 32 — the feedback *is* the prompt; `parseGiveAiFeedbackFromPrompt`
  // and both `resolveGiveAiFeedback*` helpers read no params. Note this is the
  // customer-side twin of `provider.give_ai_feedback` above, which reached the
  // same answer by the same route.
  'operations.give_ai_feedback',
];

const EXEMPT = new Set<string>([
  ...VERIFIED_NO_INPUT,
  ...ORCHESTRATION_NO_CONTRACT,
  ...PROMPT_PARSED_NO_PARAMS,
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

/**
 * T1 is now a **rule** — §178.
 *
 * It was a ceiling for thirty-two slices, for the reason the T2/T3 half records
 * above: a rule shipped against 163 undeclared commands fails on day one and
 * gets switched off. The ceiling fell 163 → 0 and is replaced here by the same
 * per-command assertion the high-risk tier uses, because a rule is strictly
 * stronger — a ceiling can be satisfied by declaring something *else*, a named
 * rule cannot.
 *
 * | slice | undeclared |
 * |---|---|
 * | start (§177) | 163 |
 * | `AiScheduleResourcesService` — the 6 resource commands | 157 |
 * | the time-off cluster — request/approve/deny/cancel | 153 |
 * | the clinic questionnaire cluster — create/publish/update | 150 |
 * | `AiPaymentsService` payments-config — 2 declared, 3 prompt-parsed | 145 |
 * | provider exp-3 + client context — block/extend/notify/note | 141 |
 * | onboarding + locations — 3 declared, 2 no-params | 136 |
 * | `AiClinicTestCatalogService` — test types + panels | 130 |
 * | `AiGiftFulfillmentService` — 11 declared, 1 prompt-parsed | 118 |
 * | `AiPushNotificationsService` — 5 declared, 2 prompt-parsed, 4 no-input | 107 |
 * | `AiIntegrationsService` — webhooks, Zapier, Zendesk, channels | 99 |
 * | `AiRetailFinanceService` — inventory products + links | 93 |
 * | `ProviderAiCommandService` — 5 declared, 1 prompt-parsed | 87 |
 * | `AiMarketingGrowthService` — 2 declared, 2 prompt-parsed, 1 no-input | 82 |
 * | `AiProviderExp2Service` — floor-status commands | 77 |
 * | self-service: manage-token + package-visit family (6 of 13) | 71 |
 * | **re-audit**: 5 wrongly-exempted commands declared properly | 71 |
 * | self-service: cart, review, late, problem (7 of 13) | 64 |
 * | `AiCommandService` — schedule, catalog, waitlist | 55 |
 * | `AiScheduleHandlersService` — template CRUD + block delete | 51 |
 * | `AiProviderSpecialtyService` — pick, review, switch | 47 |
 * | `AiCustomerCrmService` — gift-card requests + locale | 44 |
 * | `AiBookingDepthService` — resource assign + package visits | 41 |
 * | `AiClinicLabBookingService` — order-driven lab bookings | 38 |
 * | `AiBusinessComplianceService` — consent, HIPAA, strategy | 35 |
 * | **re-audit 2**: 2 more wrongly-exempted commands declared | 35 |
 * | `AiBusinessDateFormatService` — date/time formats + result notify | 32 |
 * | `AiGuestCheckoutFieldsService` — sign-in trio, all session-only | 29 |
 * | `AiRecommendationProductService` — configure, link, dismiss | 26 |
 * | clinic tasks + operations pairs | 22 |
 * | intake drafts + referral/template pairs | 18 |
 * | adoption pair + payments/schedule/profile singles | 13 |
 * | the `configure_*` singles — languages, clinic, tour, packages | 8 |
 * | the last singles — 4 declared, 3 exempt | 1 |
 * | `confirm_booking_from_push`, once §178 gave it an executor | **0** |
 *
 * **Nine of the twenty-five exemptions written during this campaign were wrong**,
 * found across three self-audits. Every one hid a command from the backlog, and
 * the error direction was never random: a handler-body grep under-reports toward
 * "takes nothing", which is the answer that removes a command from the count.
 * That is why the entry criterion below is what it is.
 */
/**
 * T1 commands whose handler receives no user-supplied input — §177, §178.
 *
 * Kept separate from `VERIFIED_NO_INPUT`, which is pinned by its own test and
 * scoped to the T2/T3 rule; appending T1 members there would have edited around
 * a guard rather than respecting it. Two shapes qualify, and each entry records
 * which:
 *
 * - **no `params` argument at all** — `onboarding.complete`,
 *   `onboarding.skip_schedule`, `marketing.regenerate_app_install_qr`;
 * - **only client- or session-injected keys** — the push trio reads `lastPush` /
 *   `isOnline` / `queuedCount` and the session `userId`; the sign-in trio and
 *   `provider.enable_push_notifications` read only session identity and platform;
 *   `operations.speak_assistant_reply` reads the previous turn, which the client
 *   carries and no utterance can fill.
 *
 * Entry requires following the call chain **until it terminates**, not to a fixed
 * depth: this campaign produced wrong exemptions at depth 1 and at depth 2, and
 * one command (`business.update_profile`) reads its fields through dynamic
 * `params[field]` access that no `params.x` grep finds at any depth.
 */
const T1_VERIFIED_NO_INPUT: readonly string[] = [
  'onboarding.complete',
  'onboarding.skip_schedule',
  'push.dismiss_push',
  'push.retry_offline_action',
  'push.test_push',
  'push.mark_all_read',
  'marketing.regenerate_app_install_qr',
  'guest.sign_in_with_apple',
  'guest.sign_in_with_google',
  'guest.sign_in_with_phone',
  'operations.speak_assistant_reply',
  'provider.enable_push_notifications',
];

const T1_EXEMPT = new Set<string>([...EXEMPT, ...T1_VERIFIED_NO_INPUT]);

const T1_UNDECLARED = T1_SPECS.filter(
  (s) => Object.keys(s.variables ?? {}).length === 0 && !T1_EXEMPT.has(s.id),
);

/**
 * T0 was a **ceiling**, and is now a **rule** — §190 opened it, §214 cleared it,
 * §215 converted it. The table below is kept as the record of how it came down.
 *
 * Measured 2026-08-17 at the start: **367 of 369 T0 specs declared no variables**,
 * across 57 handlers. Same ratchet-then-rule shape the other two tiers used, for
 * the same reason: a rule against 367 undeclared commands fails on day one.
 *
 * **Final: 369 T0 commands, 271 declared, 98 exempt (26.6%).** The floor came in
 * well above T1's 15%, exactly as the note below predicted.
 *
 * **The stakes are genuinely lower here and it is worth saying so.** T0 is the
 * read-only tier. An undeclared input on a mutate is `e2e-bug.410` — a user asked
 * for a code they already typed, or a command that books the wrong customer. An
 * undeclared filter on a list command is a worse answer, not a wrong action. This
 * is the tier where the cost of *over*-declaring — `e2e-bug.399`, the planner
 * refusing prompts for fields no handler reads — is closest to the cost of
 * under-declaring.
 *
 * **Expect a high floor.** T1 exempted 25 of 163 (15%). T0 is dominated by
 * `explain_*` and `list_*` commands, many of which genuinely take nothing: "explain
 * how gift cards work" has no parameters. The floor is discovered by reading, not
 * assumed, but it will not be near zero. **It was 26.6%** — see the rule below,
 * which now guards that number against quietly climbing.
 *
 * | slice | undeclared |
 * |---|---|
 * | start (§190) | 367 |
 * | `AiBusinessCurrencyService` — 1 declared, 10 no-input | 356 |
 * | `AiProductGuideService` — all 12 read `topicId` / `date` | 344 |
 * | `AiPaymentsService` — quotes + gift cards (8 of 24) | 336 |
 * | `AiPaymentsService` — the other 16: 14 declared, 2 no-input | 320 |
 * | `AiBusinessComplianceService` — 11 declared, 2 no-input | 307 |
 * | `AiScheduleResourcesService` — 10 declared, 1 no-input | 296 |
 * | `PublicBookingAssistantService` — 6 declared, 4 no-input | 286 |
 * | `AiCustomerCrmService` — 12 declared, 7 session-only | 267 |
 * | `AiMarketingGrowthService` — 3 declared, 12 no-input | 252 |
 * | `AiSelfServiceBookingService` — 7 declared, 3 no-input (10 of 29) | 242 |
 * | `AiSelfServiceBookingService` — 7 declared, 3 no-input (20 of 29) | 232 |
 * | `AiSelfServiceBookingService` — 8 declared, 1 no-input (29 of 29) | 223 |
 * | `AiConsumerAdoptionService` — 9 declared, 4 session-only | 210 |
 * | `AiGiftFulfillmentService` — 7 declared, 3 no-input | 200 |
 * | `AiTourServiceService` — 9 declared, 0 no-input | 191 |
 * | `AiBusinessDateFormatService` — 3 declared, 6 no-input | 182 |
 * | `AiRetailFinanceService` — 8 declared, 1 prompt-only | 173 |
 * | `AiPushNotificationsService` — 7 declared, 2 no-input | 164 |
 * | `AiProviderExp2Service` — 6 declared, 3 no-input | 155 |
 * | `AiIntegrationsService` — 4 declared, 4 no-input | 147 |
 * | `AiBusinessTaxService` — 8 declared, 0 no-input | 139 |
 * | `AiConsumerClinicTestResultsService` — 7 declared, 0 no-input | 132 |
 * | `ProviderAiCommandService` — 16 declared, 12 no-input | 104 |
 * | `AiCommandService` — 20 declared, 7 no-input | 77 |
 * | four small services — 17 declared, 0 no-input | 60 |
 * | eight small services — 22 declared, 5 no-input | 33 |
 * | the last 26 services — 27 declared, 6 no-input | **0** |
 */

/**
 * T0 commands that take no user input — §190.
 *
 * The read-only tier's dominant shape: an explainer dispatched as
 * `(deps, businessId)` with no `params` argument at all. Ten of the eleven
 * business-currency commands are exactly that. Same entry criterion as the other
 * tiers — follow the call chain until it terminates — but here the common answer
 * is genuinely "nothing", and `variables: {}` is the correct declaration rather
 * than a gap.
 */
const T0_VERIFIED_NO_INPUT: readonly string[] = [
  // `AiBusinessCurrencyService` — all dispatched `(deps, businessId)`.
  'business.explain_currency',
  'business.explain_checkout_currency',
  'business.explain_notification_currency',
  'business.explain_package_currency',
  'business.explain_provider_payment_currency',
  'business.explain_reports_currency',
  'business.explain_stripe_checkout_currency',
  'business.explain_stripe_currency_warning',
  'business.explain_tenant_currency',
  'business.diagnose_stripe_checkout_failure',
  // §190 slice 4 — `handleExplainAmountDueNowLogic` reads only `params._prompt`
  // and calls nothing: the explanation is derived from business settings, and
  // there is no scope, service or window to pass in.
  'payment.explain_amount_due_now',
  // Likewise: `handleExplainPublicBookingCheckoutLogic` reads `_prompt` and calls
  // `readBusinessGiftCardSettings` / `resolvePublicPaymentSettings`, both of which
  // read business settings rather than params. The explanation is entirely a
  // function of how the business is configured.
  'payment.explain_public_booking_checkout',
  // §190 slice 5 — `handleExplainProviderSessionTimeoutLogic` takes no `params`
  // argument at all, and `open_compliance_dashboard`'s parser reads none: the
  // panel it opens comes from `parseComplianceDashboardPanel` on the prompt text.
  'compliance.explain_provider_session_timeout',
  'compliance.open_dashboard',
  // §190 slice 6 — `handleListSchedulingResourcesLogic` takes `params` and reads
  // nothing from it: the list is every resource the business has.
  'schedule.list_scheduling_resources',
  // §190 slice 7 — `PublicBookingAssistantService` handlers that take no
  // `params` argument at all: `handleBookingHelp`, `handleBusinessInfo`,
  // `handleGetIntakeFlowStatus`, `handleListPublicPromotions`. Verified by
  // signature, not by grep — three of their siblings *do* take params and pass
  // them through without dereferencing, which reads identically to a grep.
  'booking.help',
  'booking.business_info',
  'booking.get_intake_flow_status',
  'booking.list_public_promotions',
  // §190 slice 8 — the `my_*` half of `AiCustomerCrmService`. Each takes the
  // customer from `resolveSessionCustomerId` and reads nothing else; the
  // staff-side siblings on the same service look identical to a grep but pass
  // `params` to `resolveCustomer`, so these were separated by reading, not
  // pattern.
  'customer.my_appointments',
  'customer.my_gift_cards',
  'customer.my_profile',
  'customer.my_subscriptions',
  'customer.gift_card_redemption_history',
  'customer.discover_packages',
  'customer.discover_gift_card_products',
  // §190 slice 9 — `AiMarketingGrowthService`. Ten verified **by signature**:
  // none of these handlers takes a `params` argument. Two more take one and read
  // only session/pipeline keys — `explain_loyalty_points` (`_prompt`, and a
  // parser that reads nothing) and `loyalty_points_balance` (`sessionCustomerId`,
  // which scopes the balance to whoever is asking).
  'marketing.explain_plan_entitlements',
  'marketing.explain_plan_limits',
  'marketing.explain_app_install',
  'marketing.how_to_download_app',
  'marketing.list_inactive_customers',
  'marketing.open_billing_settings',
  'marketing.suggest_upgrade',
  'marketing.summarize_automation_performance',
  'marketing.summarize_loyalty_program',
  'marketing.switch_to_consumer_app',
  'marketing.explain_loyalty_points',
  'marketing.loyalty_points_balance',
  // §190 slice 10 — self-service commands whose chains terminate without a
  // user-supplied field. `explain_deposit_forfeiture` reads only business
  // payment settings; `check_waitlist_status`'s parser reads nothing and the
  // customer comes from the session; `check_multi_service_availability`
  // enriches entirely from the prompt.
  'booking.explain_deposit_forfeiture',
  'booking.check_waitlist_status',
  'booking.check_multi_service_availability',
  // §190 slice 11 — chains that terminate with no user-supplied field.
  // `explain_manage_booking_context` reads `_prompt` and resolves only the
  // business slug; the other two delegate to parsers that read nothing and take
  // their customer from the session.
  'booking.explain_manage_booking_context',
  'booking.explain_post_visit_review_prompt',
  'booking.explain_subscription_vs_one_time',
  // §199 slice 12 — the last self-service command that reads nothing.
  // `handleListMyAppointmentsLogic` calls only `resolveBusinessSlug`
  // (`(deps, businessId)`, no params) and `resolveSessionCustomerId`, the
  // same session-only shape already exempted for `check_waitlist_status`.
  'booking.list_my_appointments',
  // §200 slice 13 — `AiConsumerAdoptionService`'s four session-only reads.
  // Each resolves the customer via `resolveSessionCustomerId` and the business
  // via `resolveBusinessSlug` (`(deps, businessId)`), then calls a deps method.
  // The other nine in the service all read params and are now declared.
  'adoption.explain_my_notifications',
  'adoption.explain_rewards_wallet',
  'adoption.refer_a_friend',
  'adoption.share_salon_link',
  // §201 slice 14 — `AiGiftFulfillmentService`. The first two are the
  // cleanest shape in the tier: dispatched `(deps, businessId)` with no
  // `params` argument at all. The third takes params but reads only the
  // session customer before calling deps.
  'commerce.delivery_queue',
  'commerce.gift_card_creation_queue',
  'commerce.order_status_notifications',
  // §203 slice 16 — `AiBusinessDateFormatService`. Six of nine are dispatched
  // with no `params` argument at all: the answer is a pure function of the
  // business's own date settings, read via `readBusinessDateFormatSettings`.
  // Only the three `preview_*` commands take something to preview.
  'business.audit_date_surfaces',
  'business.explain_booking_date_format',
  'business.explain_date_format',
  'business.explain_date_input_format',
  'business.explain_notification_date_format',
  'business.explain_provider_date_display',
  // §204 slice 17 — `commerce.list_refunds` takes its window from the prompt
  // only. Both `resolveFullDateRange` call sites in the file pass a synthetic
  // `{ _timeZone }` object rather than `params`, so the canonical resolver's
  // `date`/`dateFrom`/`dateTo` reads touch nothing here.
  'commerce.list_refunds',
  // §205 slice 18 — both dispatched with no `params` argument: the list and
  // the new-booking action guide are the same answer for every caller.
  'push.list_notifications',
  'push.new_booking_actions',
  // §206 slice 19 — `AiProviderExp2Service`. `explain_request_review_flow`
  // takes no arguments at all; the other two are `(deps, businessId, userId)`
  // and answer from the signed-in provider's own team and till.
  'provider.explain_request_review_flow',
  'provider.list_team_unpaid_today',
  'provider.team_floor_status',
  // §207 slice 20 — `AiIntegrationsService`. Three are `(deps, businessId)`;
  // `explain_support_inbox` takes `_params` — underscore-prefixed, so the
  // signature itself records that the argument is deliberately unread.
  'integration.explain_support_inbox',
  'integration.list_health',
  'integration.list_webhooks',
  'integration.list_zapier_triggers',
  // §210 slice 23 — `ProviderAiCommandService`. Twelve of its 28 dispatch
  // without `params` at all: six are `this.handleX()` with no arguments,
  // three are `(businessId, userId[, access])`, and three take
  // `(prompt, locale)` where the locale comes from session context.
  'provider.explain_accessibility_settings',
  'provider.explain_block_vs_time_off',
  'provider.explain_booking_status_badge',
  'provider.explain_calendar_utilization_bands',
  'provider.explain_context',
  'provider.explain_dashboard_only_action',
  'provider.explain_floor_status',
  'provider.explain_offline_suggestions',
  'provider.explain_reassign_limit',
  'provider.explain_time_off_approval',
  'provider.show_profile',
  'provider.team_whos_next',
  // §211 slice 24 — `AiCommandService`. Four are `(businessId)` meta-ops reads;
  // `explain_ai_capabilities` adds only the membership role, which comes from
  // dispatch context. `list_templates` and `list_employees` are handed the
  // catalog rather than params. `unknown` is the no-match fallback sentinel —
  // its whole contract is to return a clarification without acting.
  'operations.explain_ai_capabilities',
  'operations.list_employees',
  'operations.list_templates',
  'operations.summarize_ai_briefing',
  'operations.summarize_ai_settings',
  'operations.summarize_ai_weekly_report',
  'operations.unknown',
  // §213 slice 26 — the three empty-state guides take `(deps, ctx)`, where ctx
  // is a guide context rather than params; the two provider clinic lists are
  // `(deps, businessId, userId)` and answer from the signed-in provider's queue.
  'clinic.list_lab_results_queue',
  'clinic.list_tasks',
  'guide.explain_empty_catalog',
  'guide.explain_stripe_not_connected',
  'provider.explain_visibility_block',
  // §214 slice 27 — the last six. Four are `(deps, businessId)`;
  // `list_my_time_off_requests` is `(deps, businessId, employeeId)`; and
  // `explain_booking_languages` takes a `visitorLocale` argument that the
  // dashboard caller fills from `session.locale`, not from params.
  'business.dashboard_overview',
  'business.explain_booking_languages',
  'business.explain_languages',
  'onboarding.explain_status',
  'onboarding.recommend_catalog',
  'schedule.list_my_time_off_requests',
  // §309 — `handleListPackagesLogic(deps, businessId)` takes no `params`
  // argument at all. It previously declared `includeInactive`, which nothing
  // could read; found by the `e2e-bug.462` reverse census.
  'catalog.list_packages',
];

const T0_EXEMPT = new Set<string>([...T1_EXEMPT, ...T0_VERIFIED_NO_INPUT]);

const T0_UNDECLARED = T0_SPECS.filter(
  (s) => Object.keys(s.variables ?? {}).length === 0 && !T0_EXEMPT.has(s.id),
);

describe('C2 conformance rule — T0 commands declare what they take (e2e-bug.418, §215)', () => {
  it('every T0 spec declares at least one variable, or is a named exemption', () => {
    // The rule, replacing the ratchet the tier was cleared with (§190 → §214,
    // 367 → 0 over fifteen slices). Named rather than counted, for the reason
    // T1's rule gives: a count can be satisfied by declaring something else, a
    // name cannot. A new T0 command now fails this until it either declares its
    // inputs or is added to `T0_VERIFIED_NO_INPUT` below — and that list is
    // pinned by value, so the exemption is a reviewed edit rather than a way to
    // keep a number at zero.
    expect(T0_UNDECLARED.map((s) => s.id)).toEqual([]);
  });

  it('the T0 no-input exemptions are pinned by name', () => {
    // Pinned by value like the other lists. The two `payment.*` entries are the
    // exception the `business.*` prefix check used to assume away: an explainer
    // whose answer is a pure function of business settings can live in any
    // domain, not just the currency one.
    expect([...T0_VERIFIED_NO_INPUT]).toEqual([
      'business.explain_currency',
      'business.explain_checkout_currency',
      'business.explain_notification_currency',
      'business.explain_package_currency',
      'business.explain_provider_payment_currency',
      'business.explain_reports_currency',
      'business.explain_stripe_checkout_currency',
      'business.explain_stripe_currency_warning',
      'business.explain_tenant_currency',
      'business.diagnose_stripe_checkout_failure',
      'payment.explain_amount_due_now',
      'payment.explain_public_booking_checkout',
      'compliance.explain_provider_session_timeout',
      'compliance.open_dashboard',
      'schedule.list_scheduling_resources',
      'booking.help',
      'booking.business_info',
      'booking.get_intake_flow_status',
      'booking.list_public_promotions',
      'customer.my_appointments',
      'customer.my_gift_cards',
      'customer.my_profile',
      'customer.my_subscriptions',
      'customer.gift_card_redemption_history',
      'customer.discover_packages',
      'customer.discover_gift_card_products',
      'marketing.explain_plan_entitlements',
      'marketing.explain_plan_limits',
      'marketing.explain_app_install',
      'marketing.how_to_download_app',
      'marketing.list_inactive_customers',
      'marketing.open_billing_settings',
      'marketing.suggest_upgrade',
      'marketing.summarize_automation_performance',
      'marketing.summarize_loyalty_program',
      'marketing.switch_to_consumer_app',
      'marketing.explain_loyalty_points',
      'marketing.loyalty_points_balance',
      'booking.explain_deposit_forfeiture',
      'booking.check_waitlist_status',
      'booking.check_multi_service_availability',
      'booking.explain_manage_booking_context',
      'booking.explain_post_visit_review_prompt',
      'booking.explain_subscription_vs_one_time',
      'booking.list_my_appointments',
      'adoption.explain_my_notifications',
      'adoption.explain_rewards_wallet',
      'adoption.refer_a_friend',
      'adoption.share_salon_link',
      'commerce.delivery_queue',
      'commerce.gift_card_creation_queue',
      'commerce.order_status_notifications',
      'business.audit_date_surfaces',
      'business.explain_booking_date_format',
      'business.explain_date_format',
      'business.explain_date_input_format',
      'business.explain_notification_date_format',
      'business.explain_provider_date_display',
      'commerce.list_refunds',
      'push.list_notifications',
      'push.new_booking_actions',
      'provider.explain_request_review_flow',
      'provider.list_team_unpaid_today',
      'provider.team_floor_status',
      'integration.explain_support_inbox',
      'integration.list_health',
      'integration.list_webhooks',
      'integration.list_zapier_triggers',
      'provider.explain_accessibility_settings',
      'provider.explain_block_vs_time_off',
      'provider.explain_booking_status_badge',
      'provider.explain_calendar_utilization_bands',
      'provider.explain_context',
      'provider.explain_dashboard_only_action',
      'provider.explain_floor_status',
      'provider.explain_offline_suggestions',
      'provider.explain_reassign_limit',
      'provider.explain_time_off_approval',
      'provider.show_profile',
      'provider.team_whos_next',
      'operations.explain_ai_capabilities',
      'operations.list_employees',
      'operations.list_templates',
      'operations.summarize_ai_briefing',
      'operations.summarize_ai_settings',
      'operations.summarize_ai_weekly_report',
      'operations.unknown',
      'clinic.list_lab_results_queue',
      'clinic.list_tasks',
      'guide.explain_empty_catalog',
      'guide.explain_stripe_not_connected',
      'provider.explain_visibility_block',
      'business.dashboard_overview',
      'business.explain_booking_languages',
      'business.explain_languages',
      'onboarding.explain_status',
      'onboarding.recommend_catalog',
      'schedule.list_my_time_off_requests',
      'catalog.list_packages',
    ]);
  });

  it('still has a T0 population to measure', () => {
    // A renamed tier must not let this file pass by measuring an empty set.
    // 369 at §214; the floor is deliberately close, so deleting the tier is loud.
    expect(T0_SPECS.length).toBeGreaterThan(350);
  });

  it('the exemption list is a floor, not a hiding place', () => {
    // 98 of 369 (26.6%) at §214. T1's floor was 15%. If this climbs, commands
    // are being exempted rather than read — the failure mode §190 warned about
    // and `e2e-bug.399` names.
    expect(T0_VERIFIED_NO_INPUT.length).toBeLessThanOrEqual(105);
  });
});

describe('C2 — orchestration-set flags are named, not discovered (§220)', () => {
  /**
   * A class of declared variable that no user can supply.
   *
   * `resultsThenRebook`, `tourGroupCheckout`, `completeIntakeAndBook` and the
   * rest are written `true` by a compound recipe in `ai-*-compound.util.ts` to
   * tell a step which multi-step flow it is part of. They are inputs — the
   * handler reads them off `params`, so C2 is right to declare them — but they
   * are inputs *from the orchestrator*, and nothing in a `CommandSpec`
   * distinguishes them from a field the user typed.
   *
   * That mattered because declared optionals are rendered into the **LLM
   * planner prompt** (`ai-command-spec.derive.ts` → `optionalVariables` →
   * `ai-command-plan.prompt.ts:146`), so the planner was told it might set
   * `tourGroupCheckout (boolean)` on a standalone command.
   *
   * **Resolved 2026-08-20 (`e2e-bug.485`, option 1):** `CommandVariableSpec`
   * gained `source: 'orchestrator'`, and `ai-command-spec.derive.ts:162`
   * filters those out of `optionalVariables`, so they no longer reach the
   * planner. All 16 declarations below carry the marker — asserted, because the
   * filter only protects what is marked, and an orchestration flag added
   * without it silently rejoins the prompt with nothing failing.
   *
   * The list is pinned by value so a new one cannot join the set silently: a
   * flag added here is a decision that it belongs in a spec at all.
   */
  const ORCHESTRATION_SET_FLAGS: ReadonlyArray<readonly [string, string]> = [
    ['appointment.book_public', 'bookingFirstAvailable'],
    ['appointment.create', 'bookingFirstAvailable'],
    ['appointment.reschedule', 'bookingFirstAvailable'],
    ['booking.book_package', 'bookingFirstAvailable'],
    ['booking.complete_intake_and_book', 'bookingFirstAvailable'],
    ['booking.complete_intake_and_book', 'completeIntakeAndBook'],
    ['booking.get_manage_link', 'guestLookup'],
    ['clinic.book_lab_collection', 'bookingFirstAvailable'],
    ['clinic.explain_result_status', 'resultsThenRebook'],
    ['customer.explain_my_subscription', 'subscriptionFirstVisit'],
    ['provider.pick_provider_for_service', 'providerSameDayMulti'],
    ['tour.diagnose_capacity', 'tourGroupCheckout'],
    ['tour.explain_booking', 'bookingFirstAvailable'],
    ['tour.explain_booking', 'tourGroupCheckout'],
    ['tour.explain_day_slots', 'bookingFirstAvailable'],
    ['tour.explain_day_slots', 'tourGroupCheckout'],
  ];

  const FLAG_NAMES = new Set(ORCHESTRATION_SET_FLAGS.map(([, name]) => name));

  it('the declared set is exactly the pinned list', () => {
    const found: Array<readonly [string, string]> = [];
    for (const spec of COMMAND_SPECS as unknown as Spec[]) {
      for (const name of Object.keys(spec.variables ?? {})) {
        if (FLAG_NAMES.has(name)) found.push([spec.id, name] as const);
      }
    }
    expect(found.sort()).toEqual([...ORCHESTRATION_SET_FLAGS].sort());
  });

  it('every one is marked `source: orchestrator`, which is what keeps it out of the prompt', () => {
    // The by-name pin above says *which* flags exist; this says the mechanism
    // that hides them is actually applied to each. Without it the pin would
    // still pass while a flag leaked back into the planner prompt — the exact
    // condition `e2e-bug.485` was filed about.
    const unmarked = ORCHESTRATION_SET_FLAGS.filter(([id, name]) => {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === id,
      );
      const variable = (spec?.variables ?? {})[name] as
        | { source?: string }
        | undefined;
      return variable?.source !== 'orchestrator';
    }).map(([id, name]) => `${id}:${name}`);

    expect(unmarked).toEqual([]);
  });

  it('none of them is required, because no user can supply one', () => {
    // The guard that keeps this a documentation problem rather than an
    // `e2e-bug.399` one: a required orchestration flag would make the planner
    // ask the user to confirm they are inside a compound they cannot see.
    for (const [id, name] of ORCHESTRATION_SET_FLAGS) {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === id,
      );
      expect(spec).toBeDefined();
      const variable = (spec!.variables ?? {})[name] as
        | { required?: boolean }
        | undefined;
      expect(variable).toBeDefined();
      expect(variable!.required ?? false).toBe(false);
    }
  });
});

describe('C2 conformance rule — T1 commands declare what they take (e2e-bug.418, §178)', () => {
  it('every T1 spec declares at least one variable, or is a named exemption', () => {
    // The rule, at last. Named rather than counted: a count can be satisfied by
    // declaring something else, a name cannot.
    expect(T1_UNDECLARED.map((s) => s.id)).toEqual([]);
  });

  it('still has a T1 population to measure', () => {
    // A renamed tier must not let this file pass by measuring an empty set.
    expect(T1_SPECS.length).toBeGreaterThan(150);
  });

  it('the T1 no-params exemptions are pinned by name', () => {
    expect([...T1_VERIFIED_NO_INPUT]).toEqual([
      'onboarding.complete',
      'onboarding.skip_schedule',
      'push.dismiss_push',
      'push.retry_offline_action',
      'push.test_push',
      'push.mark_all_read',
      'marketing.regenerate_app_install_qr',
      'guest.sign_in_with_apple',
      'guest.sign_in_with_google',
      'guest.sign_in_with_phone',
      'operations.speak_assistant_reply',
      'provider.enable_push_notifications',
    ]);
  });
});

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
      (s) =>
        s.handler === 'AiPaymentsService' &&
        (s.risk === 'T2' || s.risk === 'T3'),
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
      const spec = (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === id,
      );
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
      const spec = (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === id,
      );
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
    for (const filter of [
      'employeeName',
      'serviceName',
      'date',
      'statusFilter',
    ]) {
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
      const spec = (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === id,
      );
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

  it('no AiCommandService T2/T3 spec is left bare (§177 slice 16)', () => {
    const own = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        s.handler === 'AiCommandService' &&
        (s.risk === 'T2' || s.risk === 'T3'),
    );
    expect(own.length).toBeGreaterThanOrEqual(11);
    const bare = own
      .filter((s) => Object.keys(s.variables ?? {}).length === 0)
      .map((s) => s.id)
      .sort();
    // Was `['operations.create_services', 'operations.optimize_schedule']`.
    // §177 slice 16 audited both and found each failed the exemption's own
    // criterion, so both are now declared and the set is empty.
    expect(bare).toEqual([]);
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
      const spec = (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === id,
      )!;
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
      (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === 'customer.merge',
      )!.variables ?? {},
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
      const spec = (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === id,
      )!;
      const bookingId = (spec.variables ?? {}).bookingId as {
        description?: string;
      };
      expect(bookingId).toBeDefined();
      expect(bookingId.description).toMatch(/group|visit/i);
    }
  });

  it('the integrations slice stays declared', () => {
    // §224 — the slice, not the class name. `configure_openai_integration`
    // moved to `AiOpenaiIntegrationService` when its `handler` was corrected
    // (it named a service that neither served it nor delegated to the one that
    // did); it is still an integrations command and still has to stay
    // declared. Keying this on one class name made a *naming* fix look like a
    // coverage regression.
    const INTEGRATION_HANDLERS = [
      'AiIntegrationsService',
      'AiOpenaiIntegrationService',
    ];
    const integrations = (COMMAND_SPECS as unknown as Spec[]).filter(
      (s) =>
        INTEGRATION_HANDLERS.includes(s.handler ?? '') &&
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
        if (
          /(?:^|[a-z])(?:apiKey|secret|password|token|clientSecret|privateKey)$/i.test(
            name,
          )
        ) {
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

  it('the orchestration exemption is empty, and staying empty is the point', () => {
    // Both original members were removed in §177 slice 16 after audit. The list
    // survives so a future entry has to argue against that history rather than
    // rediscover it.
    expect([...ORCHESTRATION_NO_CONTRACT]).toEqual([]);
  });

  it('every orchestration-exempt command really declares nothing', () => {
    // If one of them ever gains a declaration, it is no longer exempt and the
    // list must shrink — otherwise the exemption hides a live command.
    for (const id of ORCHESTRATION_NO_CONTRACT) {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === id,
      );
      expect(spec).toBeDefined();
      expect(Object.keys(spec!.variables ?? {})).toEqual([]);
    }
  });

  it('every verified-no-input command really declares nothing', () => {
    // The list is an exemption, so it must not drift into a place to hide a
    // command that later gained inputs.
    for (const id of VERIFIED_NO_INPUT) {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === id,
      );
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
    for (const id of [
      'operations.day_replan',
      'operations.fill_unused_slots',
    ]) {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === id,
      )!;
      expect(Object.keys(spec.variables ?? {})).not.toContain('_timeZone');
    }
  });

  it('the two genuinely-required payment inputs stay required', () => {
    // Both handlers return `missing: [...]` with no fallback, so these are the
    // only two in the slice where `required: true` is honest. e2e-bug.399 is
    // what happens when that judgement goes the other way.
    const required = (id: string) => {
      const spec = (COMMAND_SPECS as unknown as Spec[]).find(
        (s) => s.id === id,
      )!;
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
