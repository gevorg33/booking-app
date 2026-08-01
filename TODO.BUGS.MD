# TODO.BUGS — full bug inventory from TODO.md

All unique `(e2e|api)-bug.N` IDs mentioned in [`TODO.md`](./TODO.md), tagged **Open** or **Fixed**.

| | Count |
|---|---:|
| Total unique IDs | 250 |
| **Open** | 122 |
| **Fixed** | 128 |
| With dedicated `##` write-up | 149 |
| Mention-only (no `##` section) | 86 |

### Classification rules

1. Dedicated `##` section with **Fix direction** → **Open**
2. Dedicated `##` section with completed Fix/Verification → **Fixed**
3. Prose/checklist clearly says Fixed / RESOLVED → **Fixed**
4. Otherwise → **Open** (conservative; includes unclear mention-only IDs)

_(mention-only)_ = referenced in TODO.md but no `## e2e-bug.N` heading. Re-verify before closing.

---

## Open

- [ ] Track remaining **122** open bugs below (net: closed e2e-bug.307; opened **334**, **335**)

### Provider-surface rescue gaps — never wired despite existing logic (1 open + 9 fixed)

- [x] `e2e-bug.240` **[Fixed]** — `mark_visit_in_progress` unreachable (registry gate dropped rescue); registered + detection hardened; live `qa-e2e-bug-240.mjs` 16/16 (2026-07-31) — [`TODO.md` e2e-bug.240](./TODO.md#e2e-bug240--mark_visit_in_progress-completely-unreachable--no-rescue-call-no-registry-entry--fixed)
- [x] `e2e-bug.241` **[Fixed]** — `mark_multi_service_step_done` unreachable (registry gate); per-leg before visit-complete; live `qa-e2e-bug-241.mjs` 17/17 (2026-07-31) — residual **e2e-bug.264** — [`TODO.md` e2e-bug.241](./TODO.md#e2e-bug241--mark_multi_service_step_done-completely-unreachable--no-rescue-call-no-registry-entry--fixed)
- [x] `e2e-bug.242` **[Fixed]** — `confirm_pending_booking` unreachable (registry + customerName extract + push no-steal); live `qa-e2e-bug-242.mjs` 18/18 (2026-07-31) — [`TODO.md` e2e-bug.242](./TODO.md#e2e-bug242--confirm_pending_booking-completely-unreachable--no-rescue-call-no-registry-entry--fixed)
- [x] `e2e-bug.243` **[Fixed]** — `give_provider_ai_feedback` unreachable (registry + Not-helpful-down + lastAction); live `qa-e2e-bug-243.mjs` 16/16 (2026-07-31) — residual **e2e-bug.265** (Fixed; **280**/ **281**) — [`TODO.md` e2e-bug.243](./TODO.md#e2e-bug243--give_provider_ai_feedback-completely-unreachable--no-rescue-call-no-registry-entry--fixed)
- [x] `e2e-bug.244` **[Fixed]** — visit-status explainers unreachable (registry + Exp2 no-steal for floor/checked-in meaning); live `qa-e2e-bug-244.mjs` 18/18 (2026-07-31) — [`TODO.md` e2e-bug.244](./TODO.md#e2e-bug244--visit-status-explainers-explain_floor_status-explain_booking_status_badge-completely-unreachable--fixed)
- [x] `e2e-bug.245` **[Fixed]** — calendar-scheduling explainers unreachable (registry + rescue before Exp2/Exp3); live `qa-e2e-bug-245.mjs` 16/16 (2026-07-31) — [`TODO.md` e2e-bug.245](./TODO.md#e2e-bug245--calendar-scheduling-explainers-explain_block_vs_time_off-explain_calendar_utilization_bands-completely-unreachable--fixed)
- [x] `e2e-bug.246` **[Fixed]** — assistant UX explainers unreachable (registry + rescue before Exp2/Exp3); live `qa-e2e-bug-246.mjs` 15/15 (2026-07-31) — [`TODO.md` e2e-bug.246](./TODO.md#e2e-bug246--assistant-ux-explainers-explain_accessibility_settings-explain_offline_suggestions-completely-unreachable--fixed)
- [x] `e2e-bug.247` **[Fixed]** — dashboard-handoff explainers unreachable (registry + post-heuristic lock + intake/my_stats no-steal); live `qa-e2e-bug-247.mjs` 16/16 (2026-07-31) — residual **e2e-bug.266** — [`TODO.md` e2e-bug.247](./TODO.md#e2e-bug247--dashboard-handoff-explainers-explain_dashboard_only_action-explain_reassign_limit-explain_time_off_approval-completely-unreachable--fixed)
- [x] `e2e-bug.248` **[Fixed]** — move+nearest free time → `reschedule_booking` (soonest detector + rescue order + orchestration action hint); live `qa-e2e-bug-248.mjs` 15/15 (2026-07-31) — residuals **e2e-bug.267** (Fixed; **284**), **e2e-bug.268** (Fixed; **285**/ **286**) — [`TODO.md` e2e-bug.248](./TODO.md#e2e-bug248--move-appointment--nearest-free-time-reschedule-with-flexible-time-phrasing-misclassified-to-find_soonest_appointment-instead-of-reschedule_booking--fixed)
- [x] `e2e-bug.249` **[Fixed]** — check+book nearest stays `create_booking` (blocked public `book_appointment` steal); live `qa-e2e-bug-249.mjs` 13/13 (2026-07-31) — residual **e2e-bug.269** (Fixed; **287**) — [`TODO.md` e2e-bug.249](./TODO.md#e2e-bug249--nearest-slot-booking-disambiguation-resolves-to-book_appointment-where-the-test-suite-expects-create_booking--fixed)
- [x] `e2e-bug.250` **[Fixed]** — `list_tour_calendar_week` no longer stores prompt fragment as `serviceName` (plausibility guard + session prefer details); live `qa-e2e-bug-250.mjs` 12/12 (2026-07-31) — residual **e2e-bug.270** (later **Fixed**) — [`TODO.md` e2e-bug.250](./TODO.md#e2e-bug250--list_tour_calendar_week-misparses-a-trailing-prompt-fragment-i-have-this-week-as-servicename--fixed)
- [x] `e2e-bug.251` **[Fixed]** — "catalog category" create no longer stolen by `import_services_from_menu`; live `qa-e2e-bug-251.mjs` 11/11 (2026-07-31) — residual **e2e-bug.271** (later **Fixed**) — [`TODO.md` e2e-bug.251](./TODO.md#e2e-bug251--add-a-new-catalog-category-named-x-misroutes-to-import_services_from_menu-instead-of-create_service_category--fixed)
- [x] `e2e-bug.252` **[Fixed]** — owner alert "a customer reschedules" (-s) + no misclass_to_reschedule steal; live `qa-e2e-bug-252.mjs` 13/13 (2026-07-31) — [`TODO.md` e2e-bug.252](./TODO.md#e2e-bug252--owner-alert-toggle-alert-me-whenever-a-customer-reschedules-fails-on-the--s-verb-form-that-works-for-cancels--fixed)
- [x] `e2e-bug.253` **[Fixed]** — Account booking-card / `ConsumerBookingActions` CTAs → native `ConsumerActionButton`; live `qa-e2e-bug-253.mjs` 7/7 (2026-07-31) — residual **e2e-bug.272** (Fixed; **313**/ **314**) — [`TODO.md` e2e-bug.253](./TODO.md#e2e-bug253--account-booking-card--consumerbookingedctions-still-use-ionbutton-hosts--fixed)
- [x] `e2e-bug.254` **[Fixed]** — Face Pilling bookable again (roll-forward assigned provider hours); live `qa-e2e-bug-254.mjs` 7/7 (2026-07-31) — residual **e2e-bug.273** (Fixed; **315**) — [`TODO.md` e2e-bug.254](./TODO.md#e2e-bug254--face-pilling-onlinefull-prepay-but-zero-bookable-datesslots--fixed)
- [x] `e2e-bug.255` **[Fixed]** — provider `ready_now` / `running_late` visit-status FOR UPDATE claim + idempotent no re-notify; live `qa-e2e-bug-255.mjs` 11/11 (2026-07-31) — [`TODO.md` e2e-bug.255](./TODO.md#e2e-bug255--provider-ready_now--running_late-visit-status-updates-are-not-serialized-e2e-bug74-sibling--fixed)
- [x] `e2e-bug.256` **[Fixed]** — `Use code GCM-… at checkout` stolen by `promo_code_help` (e2e-bug.83 residual; GCM/GCB/GCS now excluded from promo help) — [`TODO.md` e2e-bug.256](./TODO.md#e2e-bug256--use-code-gcm--at-checkout-stolen-by-promo_code_help-e2e-bug83-residual--fixed)
- [x] `e2e-bug.257` **[Fixed]** — privacy_delete turn-2 `"yes"` with pending context was `unknown` (confirm rescue not wired on customer surface; pending now in sessionContext) — [`TODO.md` e2e-bug.257](./TODO.md#e2e-bug257--privacy_delete-turn-2-yes-failed-without-history-pending-not-wired-on-customer-surface--fixed)
- [x] `e2e-bug.258` **[Fixed]** — short Armenian `"Ինչպես ամրագրել"` → `booking_help` (confirm steal narrowed + hy/ru rescue); live `qa-e2e-bug-258.mjs` 11/11 (2026-07-31) — residuals **e2e-bug.274**, **e2e-bug.275** — [`TODO.md` e2e-bug.258](./TODO.md#e2e-bug258--short-armenian-how-to-book-misroutes-to-confirm_my_booking_details--fixed)
- [x] `e2e-bug.259` **[Fixed]** — hy/ru clarify + `Still stuck?` handoff localized via `messages.ts` `t()`; live `qa-e2e-bug-259.mjs` 8/8 (2026-07-31) — residuals **e2e-bug.276**, **e2e-bug.277** — [`TODO.md` e2e-bug.259](./TODO.md#e2e-bug259--hy-locale-english-clarifystatus--still-stuck-handoff-alongside-clean-guides--fixed)
- [x] `e2e-bug.274` **[Fixed]** — `confirm_my_booking_details` anon clarify localized under `locale:hy|ru` (e2e-bug.259 pass); live covered in `qa-e2e-bug-259.mjs` — [`TODO.md` e2e-bug.274](./TODO.md#e2e-bug274--confirm_my_booking_details-clarify-stays-english-under-localehy--fixed)
- [x] `e2e-bug.275` **[Fixed]** — hy/ru `booking_help` step titles humanized from body (no `Քայլ 1/3: Քայլ 1`); live `qa-e2e-bug-275.mjs` 15/15 (2026-08-01) — residuals **e2e-bug.277** (reconfirmed), **e2e-bug.294** (Fixed; **316**) — [`TODO.md` e2e-bug.275](./TODO.md#e2e-bug275--hyru-booking_help-summary-collapses-to-placeholder-step-labels--fixed)
- [x] `e2e-bug.276` **[Fixed]** — Home-tab tour reclaims from `explain_home_screen_widget` / `compare_services`; widget clarify localized; live `qa-e2e-bug-276.mjs` 12/12 (2026-08-01) — residual **e2e-bug.295** (Fixed; **317**) — [`TODO.md` e2e-bug.276](./TODO.md#e2e-bug276--explain_home_screen_widget-english-clarify-under-localehy-steals-home-tab-tour--fixed)
- [x] `e2e-bug.277` **[Fixed]** — public `booking_help` preserves `guide` / localized `supportHandoff` via convert round-trip; live `qa-e2e-bug-277.mjs` 11/11 (2026-08-01) — [`TODO.md` e2e-bug.277](./TODO.md#e2e-bug277--public-booking_help-returns-progress-summary-but-omits-guide--supporthandoff--fixed)
- [x] `e2e-bug.294` **[Fixed]** — hy/ru `booking_help` shortTitles + humanize locale splits; live `qa-e2e-bug-294.mjs` 15/15 (2026-08-01) — residual **e2e-bug.316** (Fixed; **330**/ **331**) — [`TODO.md` e2e-bug.294](./TODO.md#e2e-bug294--hyru-booking_help-humanized-step-titles-stay-body-length-vs-short-en--fixed)
- [x] `e2e-bug.316` **[Fixed]** — high-traffic guide playbooks `shortTitleKey` + stepNTitle (booking-flow/packages/professionals/services/checkout); live `qa-e2e-bug-316.mjs` 33/33 (2026-08-01) — residuals **e2e-bug.330**, **e2e-bug.331** — [`TODO.md` e2e-bug.316](./TODO.md#e2e-bug316--other-guide-playbooks-lack-shorttitlekey-e2e-bug294-residual--fixed)
- [ ] `e2e-bug.330` **[Open]** — remaining ~41 guide playbooks lack `shortTitleKey` (e2e-bug.316 residual) — [`TODO.md` e2e-bug.330](./TODO.md#e2e-bug330--remaining-guide-playbooks-lack-shorttitlekey-e2e-bug316-residual--open)
- [ ] `e2e-bug.331` **[Open]** — page-help on `/book/services`|`/book/checkout` misroutes away from screen playbook (e2e-bug.316 residual) — [`TODO.md` e2e-bug.331](./TODO.md#e2e-bug331--page-help-on-bookservicesbookcheckout-misroutes-away-from-screen-playbook-e2e-bug316-residual--open)
- [x] `e2e-bug.295` **[Fixed]** — add-next-home-screen → `explain_home_screen_widget` (classified adoption + detector guards); live `qa-e2e-bug-295.mjs` 14/14 (2026-08-01) — residual **e2e-bug.317** — [`TODO.md` e2e-bug.295](./TODO.md#e2e-bug295--publiccustomer-add-next-appointment-to-home-screen-stolen-by-list_my_upcoming_appointments--fixed)
- [ ] `e2e-bug.317` **[Open]** — `explain_home_screen_widget` success summaries stay English under hy/ru (e2e-bug.295 residual) — [`TODO.md` e2e-bug.317](./TODO.md#e2e-bug317--explain_home_screen_widget-success-summaries-stay-english-under-hyru-e2e-bug295-residual--open)
- [x] `e2e-bug.260` **[Fixed]** — `recommend_specialists` trailing time window stripped from serviceName; live `qa-e2e-bug-260.mjs` 11/11 (2026-07-31) — residuals **e2e-bug.278** (Fixed), **e2e-bug.279** (Fixed), **e2e-bug.296** (Fixed; **318**/ **319**), **e2e-bug.297** (Fixed; **320**/ **321**), **e2e-bug.298** (Fixed; **322**/ **323**) — [`TODO.md` e2e-bug.260](./TODO.md#e2e-bug260--recommend_specialists-treats-trailing-time-window-as-service-name--fixed)
- [x] `e2e-bug.278` **[Fixed]** — recommend + day-part stays on `recommend_specialists`; live `qa-e2e-bug-278.mjs` 12/12 (2026-08-01) — residual **e2e-bug.296** (Fixed; **318**/ **319**) — [`TODO.md` e2e-bug.278](./TODO.md#e2e-bug278--recommend--day-part-misroutes-to-availability-intents--fixed)
- [x] `e2e-bug.296` **[Fixed]** — recommend someone + tonight/this evening keeps same-day window (TZ normalize + day-part prompt + dateless windows); live `qa-e2e-bug-296.mjs` 16/16 (2026-08-01) — residuals **e2e-bug.318**, **e2e-bug.319** — [`TODO.md` e2e-bug.296](./TODO.md#e2e-bug296--recommend-someone--tonightthis-evening-drops-day-part-filter-14-day-fallback--fixed)
- [ ] `e2e-bug.318` **[Open]** — evening/tonight `recommend_specialists` lists afternoon slots (<17:00) (e2e-bug.296 residual) — [`TODO.md` e2e-bug.318](./TODO.md#e2e-bug318--eveningtonight-recommend_specialists-lists-afternoon-slots-1700--open)
- [ ] `e2e-bug.319` **[Open]** — `recommend someone … later today` service scrub → `"massage later"` (e2e-bug.296 residual) — [`TODO.md` e2e-bug.319](./TODO.md#e2e-bug319--recommend-someone--later-today-service-scrub-becomes-massage-later--open)
- [x] `e2e-bug.279` **[Fixed]** — bare `facial` → Face Pilling / Face Plasma / facemassage synonym group; live `qa-e2e-bug-279.mjs` 12/12 (2026-08-01) — residuals **e2e-bug.297** (Fixed; **320**/ **321**), **e2e-bug.298** (Fixed; **322**/ **323**) — [`TODO.md` e2e-bug.279](./TODO.md#e2e-bug279--bare-facial-category-misses-face-pilling--facemassage-catalog-synonyms--fixed)
- [x] `e2e-bug.297` **[Fixed]** — short `show me facials` keeps face family (synonym multi-match guard); live `qa-e2e-bug-297.mjs` 12/12 (2026-08-01) — residuals **e2e-bug.320**, **e2e-bug.321** — [`TODO.md` e2e-bug.297](./TODO.md#e2e-bug297--short-show-me-facials-collapses-to-face-pilling-only--fixed)
- [ ] `e2e-bug.320` **[Open]** — short `show me massage` collapses to Deep tissue massage only (e2e-bug.297 residual) — [`TODO.md` e2e-bug.320](./TODO.md#e2e-bug320--short-show-me-massage-collapses-to-deep-tissue-massage-only--open)
- [ ] `e2e-bug.321` **[Open]** — `list massage services` returns Men's cut / Women's cut (e2e-bug.297 residual) — [`TODO.md` e2e-bug.321](./TODO.md#e2e-bug321--list-massage-services-returns-mens-cut--womens-cut--open)
- [x] `e2e-bug.298` **[Fixed]** — bare `trim`/`styling` → hairstyle via haircut synonym group; live `qa-e2e-bug-298.mjs` 12/12 (2026-08-01) — residuals **e2e-bug.322**, **e2e-bug.323** — [`TODO.md` e2e-bug.298](./TODO.md#e2e-bug298--bare-trim-still-misses-hairstyle-catalog-synonym--fixed)
- [ ] `e2e-bug.322` **[Open]** — `list trim services` header stays "Our trim service types" (e2e-bug.298 residual) — [`TODO.md` e2e-bug.322](./TODO.md#e2e-bug322--list-trim-services-header-stays-our-trim-service-types--open)
- [ ] `e2e-bug.323` **[Open]** — bare "a cut" prefers hairstyle over Men's/Women's cut (e2e-bug.298 residual) — [`TODO.md` e2e-bug.323](./TODO.md#e2e-bug323--bare-a-cut-recommends-hairstyle-over-menswomens-cut--open)
- [x] `e2e-bug.261` **[Fixed]** — public `/assistant` accepted forged `context.customerId` (dto.context overwrote JWT); inbound sanitize + auth-last merge; live covered in `qa-e2e-bug-96.mjs` — [`TODO.md` e2e-bug.261](./TODO.md#e2e-bug261--forged-contextcustomerid-bypassed-confirm_my_booking_details-idor-guard--fixed)
- [x] `e2e-bug.262` **[Fixed]** — public slots omit employee-overlap-blocked startTimes via `validateBookingWindow` overlap gate; live `qa-e2e-bug-262.mjs` 7/7 (2026-07-31) — [`TODO.md` e2e-bug.262](./TODO.md#e2e-bug262--public-slots-list-times-already-blocked-by-employee-booking-overlap--fixed)
- [x] `e2e-bug.263` **[Fixed]** — visit-status aliases clarify on multi-match (no day-wide bulk); live `qa-e2e-bug-263.mjs` 9/9 (2026-07-31) — [`TODO.md` e2e-bug.263](./TODO.md#e2e-bug263--provider-mark_visit_in_progress--mark_visit_complete-without-bookingid-or-customername-bulk-mutates-every-matching-day-appointment--fixed)
- [x] `e2e-bug.264` **[Fixed]** — `mark_multi_service_step_done` resolves `customerName` → unique multi-service group (multi-group clarify; prompt leg over LLM); live `qa-e2e-bug-264.mjs` 7/7 (2026-07-31) — [`TODO.md` e2e-bug.264](./TODO.md#e2e-bug264--mark_multi_service_step_done-documents-customername-but-never-resolves-it-bookingid-only--fixed)
- [x] `e2e-bug.265` **[Fixed]** — customer/public `give_ai_feedback` rates `"Not helpful"` as down (negatives-first + lookbehind); live `qa-e2e-bug-265.mjs` 19/19 (2026-07-31) — residuals **e2e-bug.280** (Fixed), **e2e-bug.281** (Fixed) — [`TODO.md` e2e-bug.265](./TODO.md#e2e-bug265--customerpublic-give_ai_feedback-rates-not-helpful-as-thumbs-up--fixed)
- [x] `e2e-bug.280` **[Fixed]** — short public feedback cues rescue from unknown-phase (not assistant.unknown); live `qa-e2e-bug-280.mjs` 22/22 (2026-08-01) — residuals **e2e-bug.281** (Fixed), **e2e-bug.293** (Fixed) — [`TODO.md` e2e-bug.280](./TODO.md#e2e-bug280--public-give_ai_feedback-short-prompts-return-unknown-before-rescue-can-run--fixed)
- [x] `e2e-bug.281` **[Fixed]** — public `give_ai_feedback` forwards chip/label details; live `qa-e2e-bug-281.mjs` 13/13 (2026-08-01) — residual **e2e-bug.299** (Fixed) — [`TODO.md` e2e-bug.281](./TODO.md#e2e-bug281--public-give-ai-feedback-response-strips-showreasonchips--aspect--labels--fixed)
- [x] `e2e-bug.293` **[Fixed]** — `"Thumbs up"` / `"Thumbs down"` / emoji rate correctly; live `qa-e2e-bug-293.mjs` 18/18 (2026-08-01) — residual **e2e-bug.300** (Fixed) — [`TODO.md` e2e-bug.293](./TODO.md#e2e-bug293--public-thumbs-up--thumbs-down--give_ai_feedback-clarify-without-rating--fixed)
- [x] `e2e-bug.299` **[Fixed]** — public `give_ai_feedback` chip/summary labels localize under `locale:hy|ru`; live `qa-e2e-bug-299.mjs` 22/22 (2026-08-01) — residuals **e2e-bug.324**, **e2e-bug.325** — [`TODO.md` e2e-bug.299](./TODO.md#e2e-bug299--public-give-ai-feedback-chipsummary-labels-stay-english-under-localehyru--fixed)
- [ ] `e2e-bug.324` **[Open]** — HY native `"Օգտակար չէ"` stays `unknown` (e2e-bug.299 residual) — [`TODO.md` e2e-bug.324](./TODO.md#e2e-bug324--hy-native-օգտակար-չէ-stays-unknown-not-give_ai_feedback--open)
- [ ] `e2e-bug.325` **[Open]** — provider `give_provider_ai_feedback` chip/summary labels stay English under `locale:hy|ru` (e2e-bug.299 residual) — [`TODO.md` e2e-bug.325](./TODO.md#e2e-bug325--provider-give_provider_ai_feedback-chipsummary-labels-stay-english-under-localehyru--open)
- [x] `e2e-bug.300` **[Fixed]** — public `+1` / `-1` rate as `give_ai_feedback`; live `qa-e2e-bug-300.mjs` 20/20 (2026-08-01) — residual **e2e-bug.326** — [`TODO.md` e2e-bug.300](./TODO.md#e2e-bug300--public-1--1-stay-unknown-not-thumbs-feedback--fixed)
- [ ] `e2e-bug.326` **[Open]** — public `"+1 thanks"` / `"thanks +1"` stay `unknown` (e2e-bug.300 residual) — [`TODO.md` e2e-bug.326](./TODO.md#e2e-bug326--public-1-thanks--thanks-1-stay-unknown--open)
- [x] `e2e-bug.266` **[Fixed]** — provider `my_stats` Armenian `նչ`+`եմ` false-positives removed (phrase match + guide no-steal); live `qa-e2e-bug-266.mjs` 16/16 (2026-07-31) — residuals **e2e-bug.282** (Fixed), **e2e-bug.283** (Fixed), **e2e-bug.301** (Fixed), **e2e-bug.302** (Fixed), **e2e-bug.303** (Fixed; **328**) — [`TODO.md` e2e-bug.266](./TODO.md#e2e-bug266--provider-my-stats-armenian-substring-heuristic-նչեմ-false-positives-on-unrelated-faq-prompts--fixed)
- [x] `e2e-bug.282` **[Fixed]** — HY/RU call-client FAQ → `explain_dashboard_only_action`; live `qa-e2e-bug-282.mjs` 13/13 (2026-08-01) — residual **e2e-bug.301** (Fixed) — [`TODO.md` e2e-bug.282](./TODO.md#e2e-bug282--hy-ինչու-չեմ-կարող-զանգահարել-հաճախորդին--summarize_client-not-dashboard-handoff--fixed)
- [x] `e2e-bug.283` **[Fixed]** — product-guide no-steal for my_stats / HY how-am-I; live `qa-e2e-bug-283.mjs` 12/12 (2026-08-01) — residuals **e2e-bug.302** (Fixed), **e2e-bug.303** (Fixed; **328**) — [`TODO.md` e2e-bug.283](./TODO.md#e2e-bug283--rescueproductguideintent-still-steals-my_stats-for-hy-ինչպե՞ս-եմ--fixed)
- [x] `e2e-bug.301` **[Fixed]** — `explain_dashboard_only_action` summaries localize for HY/RU; live `qa-e2e-bug-301.mjs` 12/12 (2026-08-01) — residual **e2e-bug.327** — [`TODO.md` e2e-bug.301](./TODO.md#e2e-bug301--explain_dashboard_only_action-summaries-stay-english-for-hyru-prompts--fixed)
- [ ] `e2e-bug.327` **[Open]** — `explain_reassign_limit` / `explain_time_off_approval` summaries stay English for HY/RU (e2e-bug.301 residual) — [`TODO.md` e2e-bug.327](./TODO.md#e2e-bug327--explain_reassign_limit--explain_time_off_approval-summaries-stay-english-for-hyru--open)
- [x] `e2e-bug.302` **[Fixed]** — HY/RU Home|Today tab → `provider-today-calendar` + localized miss clarify; live `qa-e2e-bug-302.mjs` 10/10 (2026-08-01) — [`TODO.md` e2e-bug.302](./TODO.md#e2e-bug302--hy-ինչպե՞ս-օգտագործեմ-home-tab-ը--guide_user_flow-but-topic-miss--en-fallback--fixed)
- [x] `e2e-bug.303` **[Fixed]** — first-person how-am-I → Your/mine (beats classifier team); live `qa-e2e-bug-303.mjs` 12/12 (2026-08-01) — residual **e2e-bug.328** — [`TODO.md` e2e-bug.303](./TODO.md#e2e-bug303--provider-how-am-i--my_stats-sometimes-returns-team-stats-instead-of-your-stats--fixed)
- [ ] `e2e-bug.328` **[Open]** — `my_stats` Your/Team stats summaries stay English for HY/RU (e2e-bug.303 residual) — [`TODO.md` e2e-bug.328](./TODO.md#e2e-bug328--my_stats-yourteam-stats-summaries-stay-english-for-hyru--open)
- [x] `e2e-bug.267` **[Fixed]** — semicolon / then-put-it move+nearest stays single `reschedule_booking` (`isSingleRescheduleNearestContinuationPrompt`); live `qa-e2e-bug-267.mjs` 10/10 (2026-07-31) — residual **e2e-bug.284** (Fixed; **304**/ **305**) — [`TODO.md` e2e-bug.267](./TODO.md#e2e-bug267--semicolon-move--put-it--nearest-free-time-decomposes-to-compound-instead-of-single-reschedule_booking--fixed)
- [x] `e2e-bug.284` **[Fixed]** — move+then-book → `reschedule_booking`→`create_booking` golden; live `qa-e2e-bug-284.mjs` 8/8 (2026-08-01) — residuals **e2e-bug.304** (Fixed; **329**), **e2e-bug.305** (Fixed) — [`TODO.md` e2e-bug.284](./TODO.md#e2e-bug284--move--then-book-a-second--collapses-to-create_booking-only-drops-reschedule-step--fixed)
- [x] `e2e-bug.304` **[Fixed]** — mid-step clarify keeps compound resume + `action=compound_intent`; live `qa-e2e-bug-304.mjs` 6/6 (2026-08-01) — residual **e2e-bug.329** — [`TODO.md` e2e-bug.304](./TODO.md#e2e-bug304--compound-mid-step-clarify-discards-prior-validated-plans-reschedulecreate--fixed)
- [x] `e2e-bug.305` **[Fixed]** — compound clarify top-level `action` is `compound_intent`; live `qa-e2e-bug-305.mjs` 7/7 (2026-08-01) — [`TODO.md` e2e-bug.305](./TODO.md#e2e-bug305--compound-clarify-top-level-action-is-current-step-not-compound_intent--fixed)
- [ ] `e2e-bug.329` **[Open]** — compound resume follow-up with empty prior plans still skips/fails reschedule leg (e2e-bug.304 residual) — [`TODO.md` e2e-bug.329](./TODO.md#e2e-bug329--compound-resume-follow-up-with-empty-prior-plans-still-skipsfails-reschedule-leg--open)
- [x] `e2e-bug.268` **[Fixed]** — first-available create/reschedule clamps start day ≥ today; live `qa-e2e-bug-268.mjs` 9/9 (2026-07-31) — residuals **e2e-bug.285** (Fixed; **306**), **e2e-bug.286** (Fixed; **332**/ **333**) — [`TODO.md` e2e-bug.268](./TODO.md#e2e-bug268--dashboard-first-available-bookingreschedule-can-land-on-past-calendar-days--fixed)
- [x] `e2e-bug.285` **[Fixed]** — AI success/plan dates unambiguous; live `qa-e2e-bug-285.mjs` 7/7 (2026-08-01) — residual **e2e-bug.306** (Fixed) — [`TODO.md` e2e-bug.285](./TODO.md#e2e-bug285--ai-success-summaries-misread-ddmm-01082026-as-us-january-8--march-8--fixed)
- [x] `e2e-bug.306` **[Fixed]** — no-slot / availability failure dates use `formatDateForAiLabel`; live `qa-e2e-bug-306.mjs` 8/8 (2026-08-01) — [`TODO.md` e2e-bug.306](./TODO.md#e2e-bug306--nearest-slot--reschedule-no-open-slot-messages-still-use-ddmm-slash-02082026--fixed)
- [x] `e2e-bug.286` **[Fixed]** — "Create a booking for the first available…" stays `create_booking` (not `create_employee`); live `qa-e2e-bug-286.mjs` 15/15 (2026-08-01) — residuals **e2e-bug.332**, **e2e-bug.333** — [`TODO.md` e2e-bug.286](./TODO.md#e2e-bug286--create-a-booking-for-the-first-available-stolen-by-create_employee--fixed)
- [ ] `e2e-bug.332` **[Open]** — create_booking "is not free at … on DD/MM/YYYY" still uses slash dates (e2e-bug.286 residual) — [`TODO.md` e2e-bug.332](./TODO.md#e2e-bug332--create_booking-is-not-free-at--on-ddmmyyyy-still-uses-slash-dates-e2e-bug286-residual--open)
- [ ] `e2e-bug.333` **[Open]** — short first-available "Create a booking…" without any-provider may skip BFA scan (e2e-bug.286 residual) — [`TODO.md` e2e-bug.333](./TODO.md#e2e-bug333--short-first-available-create-a-booking-without-any-provider-may-skip-bfa-scan-e2e-bug286-residual--open)
- [x] `e2e-bug.269` **[Fixed]** — anybody-open-schedule check+book detection restored (indefinite exclusion); live `qa-e2e-bug-269.mjs` 11/11 (2026-07-31) — residual **e2e-bug.287** (Fixed; **307**) — [`TODO.md` e2e-bug.269](./TODO.md#e2e-bug269--checkbook-fixture-anybody-open-schedule-no-longer-matches-ischeckprovidersforserviceprompt--fixed)
- [x] `e2e-bug.287` **[Fixed]** — dashboard check-only anybody-open → `check_providers_for_service` (registry + rescue order); live `qa-e2e-bug-287.mjs` 18/18 (2026-08-01) — residual **e2e-bug.307** (Fixed; **334**/ **335**) — [`TODO.md` e2e-bug.287](./TODO.md#e2e-bug287--dashboard-check-only-is-anybody-open-routes-to-check_availability-not-check_providers_for_service--fixed)
- [x] `e2e-bug.307` **[Fixed]** — public `"is anybody open…"` stays availability (not `add_booking_to_calendar`); live `qa-e2e-bug-307.mjs` 17/17 (2026-08-01) — residuals **e2e-bug.334**, **e2e-bug.335** — [`TODO.md` e2e-bug.307](./TODO.md#e2e-bug307--public-is-anybody-open-stolen-by-add_booking_to_calendar--fixed)
- [ ] `e2e-bug.334` **[Open]** — public `"is anyone free…"` → `explain_provider_availability` looks up specialist `"anyone"` (e2e-bug.307 residual) — [`TODO.md` e2e-bug.334](./TODO.md#e2e-bug334--public-is-anyone-free-stolen-by-explain_provider_availability-e2e-bug307-residual--open)
- [ ] `e2e-bug.335` **[Open]** — public `"is anybody open…"` returns `check_providers_for_service` not `check_availability` (e2e-bug.307 residual) — [`TODO.md` e2e-bug.335](./TODO.md#e2e-bug335--public-is-anybody-open-returns-check_providers_for_service-not-check_availability-e2e-bug307-residual--open)
- [x] `e2e-bug.270` **[Fixed]** — `list_tour_calendar_week` no longer crashes on week-phrase `weekStartDate` (ISO normalize + buildWeekDateKeys fallback); live `qa-e2e-bug-270.mjs` 17/17 (2026-07-31) — residuals **e2e-bug.288** (Fixed; **308** Fixed), **e2e-bug.289** (Fixed; **309**/ **310**) — [`TODO.md` e2e-bug.270](./TODO.md#e2e-bug270--list_tour_calendar_week-crashes-with-invalid-time-value-on-some-week-phrasing-variants--fixed)
- [x] `e2e-bug.288` **[Fixed]** — next/last week tour lists → `list_tour_calendar_week` (not upcoming clarify); live `qa-e2e-bug-288.mjs` 17/17 (2026-08-01) — residual **e2e-bug.308** (Fixed) — [`TODO.md` e2e-bug.288](./TODO.md#e2e-bug288--any-tours-next-week--tour-bookings-last-week-misroute-to-list_upcoming_tour_departures-clarify--fixed)
- [x] `e2e-bug.308` **[Fixed]** — tour calendar week empty summaries use `formatDateForAiLabel` (no DD/MM slash); live covered in `qa-e2e-bug-289.mjs` (2026-08-01) — [`TODO.md` e2e-bug.308](./TODO.md#e2e-bug308--list_tour_calendar_week-empty-summaries-use-ddmm-slash-for-thislast-week--fixed)
- [x] `e2e-bug.289` **[Fixed]** — HY/RU `list_tour_calendar_week` summaries localized + skip enrich; live `qa-e2e-bug-289.mjs` 16/16 (2026-08-01) — residuals **e2e-bug.309** (Fixed; **336**), **e2e-bug.310** (Fixed) — [`TODO.md` e2e-bug.289](./TODO.md#e2e-bug289--hy-list_tour_calendar_week-success-summary-stays-english--fixed)
- [x] `e2e-bug.309` **[Fixed]** — RU next/last-week calendar tours → `list_tour_calendar_week` (not upcoming clarify; span exclusion + week anchors); live `qa-e2e-bug-309.mjs` 19/19 (2026-08-01) — residual **e2e-bug.336** — [`TODO.md` e2e-bug.309](./TODO.md#e2e-bug309--ru-туры-на-следующей-неделе-в-календаре-misroutes-to-upcoming-departures-clarify--fixed)
- [x] `e2e-bug.310` **[Fixed]** — HY անցած/նախորդ/անցյալ/վերջին շաբաթ last-week anchors deterministic; live `qa-e2e-bug-310.mjs` 18/18 (2026-08-01) — [`TODO.md` e2e-bug.310](./TODO.md#e2e-bug310--hy-անցած-շաբաթվա-էքսկուրսիաները-flaky-week-anchor-this-week-vs-last-week--fixed)
- [ ] `e2e-bug.336` **[Open]** — `explain_tour_calendar_span` empty summaries still use DD/MM slash dates (e2e-bug.309 residual) — [`TODO.md` e2e-bug.336](./TODO.md#e2e-bug336--explain_tour_calendar_span-empty-summaries-still-use-ddmm-slash-dates-e2e-bug309-residual--open)
- [x] `e2e-bug.271` **[Fixed]** — voice `named X … please` keeps full `categoryName` (prompt reconcile + politeness strip); live `qa-e2e-bug-271.mjs` 14/14 (2026-07-31) — residuals **e2e-bug.290** (Fixed), **e2e-bug.291** (Fixed; **311**), **e2e-bug.292** (Fixed; **312**) — [`TODO.md` e2e-bug.271](./TODO.md#e2e-bug271--create_service_category-voice-phrasing-drops-trailing-name-tokens-before-please--fixed)
- [x] `e2e-bug.290` **[Fixed]** — trailing `kindly`/`cheers`/`appreciate it` stripped from categoryName; live `qa-e2e-bug-290.mjs` 17/17 (2026-08-01) — residuals **e2e-bug.291** (Fixed; **311**), **e2e-bug.292** (Fixed; **312**) — [`TODO.md` e2e-bug.290](./TODO.md#e2e-bug290--trailing-kindly-absorbed-into-create_service_category-name--fixed)
- [x] `e2e-bug.291` **[Fixed]** — HY catalog-category create → `create_service_category` (clinic `որ`/`կատեգորիա` false-positive + HY detect); live `qa-e2e-bug-291.mjs` 16/16 (2026-08-01) — residual **e2e-bug.311** (Fixed; **337**) — [`TODO.md` e2e-bug.291](./TODO.md#e2e-bug291--hy-catalog-category-create--explain_clinic_services--fixed)
- [x] `e2e-bug.311` **[Fixed]** — HY/RU `explain_clinic_services` empty summaries localized + skip enrich; live `qa-e2e-bug-311.mjs` 17/17 (2026-08-01) — residual **e2e-bug.337** — [`TODO.md` e2e-bug.311](./TODO.md#e2e-bug311--hy-explain_clinic_services-empty-summary-stays-english-on-some-prompts--fixed)
- [ ] `e2e-bug.337` **[Open]** — HY `Բացատրի՛ր մեր կլինիկական ծառայությունները` → `explain_business_hours_and_location` (e2e-bug.311 residual) — [`TODO.md` e2e-bug.337](./TODO.md#e2e-bug337--hy-բացատրիր-կլինիկական-ծառայությունները-stolen-by-explain_business_hours_and_location-e2e-bug311-residual--open)
- [x] `e2e-bug.292` **[Fixed]** — RU catalog-category create → `create_service_category` (not bulk confirm; Color ≠ create_employee); live `qa-e2e-bug-292.mjs` 15/15 (2026-08-01) — residual **e2e-bug.312** — [`TODO.md` e2e-bug.292](./TODO.md#e2e-bug292--ru-catalog-category-create--bulk_create_catalog-confirm--fixed)
- [ ] `e2e-bug.312` **[Open]** — RU `create_service_category` success summary sometimes stays English (e2e-bug.292 residual) — [`TODO.md` e2e-bug.312](./TODO.md#e2e-bug312--ru-create_service_category-success-summary-sometimes-stays-english--open)
- [x] `e2e-bug.272` **[Fixed]** — package/multi-service visit CTAs → native `ConsumerActionButton`; live `qa-e2e-bug-272.mjs` 9/9 (2026-08-01) — residuals **e2e-bug.313**, **e2e-bug.314** — [`TODO.md` e2e-bug.272](./TODO.md#e2e-bug272--consumerpackagevisitactions--consumermultiservicevisitactions-still-use-ionbutton-hosts--fixed)
- [ ] `e2e-bug.313` **[Open]** — package/multi reschedule panel shows disabled Confirm when no slots (e2e-bug.272 residual) — [`TODO.md` e2e-bug.313](./TODO.md#e2e-bug313--package--multi-service-reschedule-panel-shows-confirm-when-no-slots--open)
- [ ] `e2e-bug.314` **[Open]** — Account `ConsumerSubscriptionsSection` CTAs still `IonButton` (e2e-bug.272 residual) — [`TODO.md` e2e-bug.314](./TODO.md#e2e-bug314--account-consumersubscriptionssection-ctas-still-use-ionbutton-hosts--open)
- [x] `e2e-bug.273` **[Fixed]** — public bookable-dates/slots GET uses ephemeral projection (no schedule persist); live `qa-e2e-bug-273.mjs` 8/8 (2026-08-01) — residual **e2e-bug.315** — [`TODO.md` e2e-bug.273](./TODO.md#e2e-bug273--public-bookable-datesslots-get-persists-schedule-roll-forward-e2e-bug254-residual--fixed)
- [ ] `e2e-bug.315` **[Open]** — booking POST auto-materializes assigned-provider hour roll-forward (e2e-bug.273 residual) — [`TODO.md` e2e-bug.315](./TODO.md#e2e-bug315--booking-post-auto-materializes-assigned-provider-hour-roll-forward--open)

### Public web — AI residuals (recent) (13)

- [x] `e2e-bug.226` **[Fixed]** — `list_services` treats “you offer” from “what services do you offer?” as a service filter — [`TODO.md` L3795](./TODO.md#L3795)
- [x] `e2e-bug.227` **[Fixed]** — `explain_business_hours_and_location` reports close time 19:00 vs public hours 18:00 — [`TODO.md` L3815](./TODO.md#L3815)
- [x] `e2e-bug.229` **[Fixed]** — `pay_online` with named service wipes checkout session `serviceId` (e2e-bug.88 residual) — [`TODO.md` L3846](./TODO.md#L3846)
- [x] `e2e-bug.230` **[Fixed]** — e2e-bug.79 residual: “subscription or just pay per visit” → `confirm_my_booking_details` — [`TODO.md` L3879](./TODO.md#L3879)
- [x] `e2e-bug.231` **[Fixed]** — `check_gift_card_balance` by code still unreachable (sibling steals) — [`TODO.md` L4138](./TODO.md#L4138)
- [x] `e2e-bug.232` **[Fixed]** — `claim_referral_code` stolen by `apply_promo_code_checkout` (e2e-bug.83 residual) — [`TODO.md` L3918](./TODO.md#L3918)
- [x] `e2e-bug.233` **[Fixed]** — web home widget steers loyalty prompts into `guide_user_flow` — [`TODO.md` L3943](./TODO.md#L3943)
- [x] `e2e-bug.234` **[Fixed]** — manage-page AI ignores URL-threaded `manageToken` for guest reschedule/cancel — [`TODO.md` L3970](./TODO.md#L3970)
- [x] `e2e-bug.235` **[Fixed]** — waitlist confirm still says “with Gevorg with Gevorg” (e2e-bug.112 residual) — [`TODO.md` L3996](./TODO.md#L3996)
- [x] `e2e-bug.236` **[Fixed]** — `report_booking_problem` natural phrasing stolen by `confirm_my_booking_details` — [`TODO.md` L4020](./TODO.md#L4020)
- [x] `e2e-bug.237` **[Fixed]** — dated cancel+rebook (“…rebook for next Friday”) still fails lookup / misroutes (e2e-bug.89/114 residual) — [`TODO.md` L4049](./TODO.md#L4049)
- [x] `e2e-bug.238` **[Fixed]** — budget/flex compound treats “soonest” as a service name in `list_services` — [`TODO.md` L4078](./TODO.md#L4078)
- [x] `e2e-bug.239` **[Fixed]** — `action:error` fallback summary not localized (en-only for hy/ru) — [`TODO.md` L4102](./TODO.md#L4102)

### Public web — UI / assistant chrome (20)

- [x] `e2e-bug.207` **[Fixed]** — public booking home omits hours and service-category teaser (checklist landing content lives only on `/profile` / later steps) — [`TODO.md` L3592](./TODO.md#L3592)
- [x] `e2e-bug.208` **[Fixed]** — `/book/[slug]/services` is not a full-catalog browse (hard redirect + slot filter; no category filter UI) — [`TODO.md` L3605](./TODO.md#L3605)
- [x] `e2e-bug.209` **[Fixed]** — services list never surfaces prepayment/deposit (API fields unused in UI) — [`TODO.md` L3613](./TODO.md#L3613)
- [x] `e2e-bug.210` **[Fixed]** — provider `/reviews` page omits aggregate rating summary — [`TODO.md` L3621](./TODO.md#L3621)
- [x] `e2e-bug.211` **[Fixed]** — dedicated provider reviews route is undiscoverable when all reviews fit on profile page 1 — [`TODO.md` L3629](./TODO.md#L3629)
- [x] `e2e-bug.212` **[Fixed]** — public checkout defaults WhatsApp reminders ON, blocking guest book without a phone — [`TODO.md` L3637](./TODO.md#L3637)
- [x] `e2e-bug.213` **[Fixed]** — multi-service quote returns `subtotal`/`amountDue` 0 for pay-at-visit carts (UI Total $0) — [`TODO.md` L3640](./TODO.md#L3640)
- [x] `e2e-bug.214` **[Fixed]** — package checkout quote/`Total` show US$0.00 for a $344 package (pay-at-visit lines) — [`TODO.md` L3653](./TODO.md#L3653)
- [x] `e2e-bug.215` **[Fixed]** — account “Leave a review” links to provider profile instead of the post-visit review flow — [`TODO.md` L3754](./TODO.md#L3754)
- [x] `e2e-bug.216` **[Fixed]** — guest manage cancel success shows misleading “Your booking is confirmed” toast — [`TODO.md` L3782](./TODO.md#L3782)
- [x] `e2e-bug.217` **[Fixed]** — `suggest-lines` fails for Swedish+Neck while `suggest-block` succeeds — [`TODO.md` L3804](./TODO.md#L3804)
- [x] `e2e-bug.218` **[Fixed]** — salon JWT on another business's `/public/{slug}/me/*` can read PII and DELETE the home-tenant customer — [`TODO.md` L3685](./TODO.md#L3685)
- [x] `e2e-bug.219` **[Fixed]** — guide/assistant summaries keep an English `Step N of M:` prefix in hy/ru — [`TODO.md` L3860](./TODO.md#L3860)
- [x] `e2e-bug.220` **[Fixed]** — mobile assistant FAB overlaps sticky bottom CTAs — [`TODO.md` L3888](./TODO.md#L3888)
- [x] `e2e-bug.221` **[Fixed]** — web booking has no “running late” self-service (consumer-app only) — [`TODO.md` L3900](./TODO.md#L3900)
- [x] `e2e-bug.222` **[Fixed]** — pay-at-visit (`prepayment_mode:none`) checkout UI still offers “Pay online” — [`TODO.md` L3913](./TODO.md#L3913)
- [x] `e2e-bug.223` **[Fixed]** — public booking assistant POST shows “Created successfully.” toast — [`TODO.md` L3750](./TODO.md#L3750)
- [x] `e2e-bug.224` **[Fixed]** — public web `followNavigate` missing consumer-style path mapping (packages/login/home → 404) — [`TODO.md` L3940](./TODO.md#L3940)
- [x] `e2e-bug.225` **[Fixed]** — web booking assistant never auto-navigates on booking-verb + checkout — [`TODO.md` L3958](./TODO.md#L3958)
- [x] `e2e-bug.228` **[Fixed]** — `suggest_package_block` checkout navigate drops package on public web — [`TODO.md` L4012](./TODO.md#L4012)

### Public/customer AI intents & compounds (18)

- [x] `e2e-bug.189` **[Fixed]** — `list_providers` ("Who are your providers / specialists?") misroutes to `check_providers_for_service` and asks which service to check — [`TODO.md` L3433](./TODO.md#L3433)
- [x] `e2e-bug.190` **[Fixed]** — `check_availability` is unreachable as a live single-intent on `/public/:slug/assistant` — [`TODO.md` L3451](./TODO.md#L3451)
- [x] `e2e-bug.191` **[Fixed]** — `business_info` ("Tell me about this business / salon info") misroutes to `explain_provider_specialty` — [`TODO.md` L3463](./TODO.md#L3463)
- [x] `e2e-bug.192` **[Fixed]** — `book_appointment` natural-language book prompts never create a booking (→ `unknown` or `check_providers_for_service`) — [`TODO.md` L3477](./TODO.md#L3477)
- [x] `e2e-bug.193` **[Fixed]** — `list_services` classifies correctly but fails entity resolution on "What services do you offer?" — [`TODO.md` L3497](./TODO.md#L3497)
- [x] `e2e-bug.194` **[Fixed]** — `explain_provider_availability` returns a generic clarify despite named provider + service + relative day — [`TODO.md` L3513](./TODO.md#L3513)
- [x] `e2e-bug.195` **[Fixed]** — `booking_help` ("How do I book an appointment step by step?") misroutes to `explain_app_feature` Home guide — [`TODO.md` L3526](./TODO.md#L3526)
- [x] `e2e-bug.196` **[Fixed]** — 7 of 14 `PUBLIC_ONLY_ASSISTANT_ACTIONS` are dead on compound / `executeDeterministicIntent` path — [`TODO.md` L3540](./TODO.md#L3540)
- [x] `e2e-bug.197` **[Fixed]** — customer JWT from Business A is accepted on `/public/{BusinessB}/assistant`, so account intents run under a cross-tenant (businessId, customerId) mismatch — [`TODO.md` L3497](./TODO.md#L3497)
- [x] `e2e-bug.198` **[Fixed]** — `customer_clinic_compound` always dies on step 2 (`notify_when_results_ready`) even when the prompt already says "notify me when results are ready" — [`TODO.md` L3571](./TODO.md#L3571)
- [x] `e2e-bug.199` **[Fixed]** — budget / flexible-availability compound fixtures say "haircut" but live salon catalog only has `hairstyle` (exact-match abort) — [`TODO.md` L3593](./TODO.md#L3593)
- [x] `e2e-bug.200` **[Fixed]** — `customer_flexible_availability_budget_compound` drops `serviceName` / loses compound for several valid OR+budget+book phrasings — [`TODO.md` L3606](./TODO.md#L3606)
- [x] `e2e-bug.201` **[Fixed]** — `intake_lab_book_pay` always dies on step 1 because `complete_intake_and_book` rejects prompts that contain a payment cue — [`TODO.md` L3617](./TODO.md#L3617)
- [x] `e2e-bug.202` **[Fixed]** — `book_lab_collection_nearest` reports full compound success for a nonexistent lab panel (no abort, no booking) — [`TODO.md` L3627](./TODO.md#L3627)
- [x] `e2e-bug.203` **[Fixed]** — `guest_book_and_manage` / `guest_pay_cash_manage` stolen by `explain_guest_checkout_fields` when a service is named — [`TODO.md` L3640](./TODO.md#L3640)
- [x] `e2e-bug.204` **[Fixed]** — `public_assistant_compound` is unreachable on live `/public/:slug/assistant` (public-only recipe + customer surface) — [`TODO.md` L3653](./TODO.md#L3653)
- [ ] `e2e-bug.205` **[Open]** — `tour_group_checkout` / `book_tour_nearest_departure` glue capacity/date cue text into `serviceName` and still report compound success — [`TODO.md` L3581](./TODO.md#L3581)
- [ ] `e2e-bug.206` **[Open]** — incomplete tour group prompt (`Wine tour for 6 next Saturday` without capacity gate) → opaque `security_blocked` — [`TODO.md` L3589](./TODO.md#L3589)

### Other e2e (headed / late) (6)

- [ ] `e2e-bug.166` **[Open]** — locale hydration mismatch on the booking confirmation page (found via user-reported Next.js dev overlay) — [`TODO.md` L3110](./TODO.md#L3110)
- [ ] `e2e-bug.167` **[Open]** — no dashboard AI action exists to report refunds at all, confirmed with unusually strong ground truth: a real refund issued minutes earlier in this exact session is completely invis _(mention-only)_ — [`TODO.md` L3137](./TODO.md#L3137)
- [ ] `e2e-bug.172` **[Open]** — `AcceptInvitePage` doesn't establish (or clear) a session, so a newly-invited employee can silently land in whoever was previously logged in on that device — [`TODO.md` L3234](./TODO.md#L3234)
- [ ] `e2e-bug.174` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L3287](./TODO.md#L3287)
- [ ] `e2e-bug.178` **[Open]** — investigated a suspected 6th e2e-bug.3 instance (false alarm, already fixed) + fixed a real, previously-unverified keyboard-accessibility bug: the assistant FAB had zero keyboard-a — [`TODO.md` L3293](./TODO.md#L3293)
- [ ] `e2e-bug.186` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1124](./TODO.md#L1124)

### e2e-bug.101–165 (mention or headed) (44)

- [ ] `e2e-bug.101` **[Open]** — largely fixed on this surface. High-end rank vocab no longer searches a literal service name (`couldn't find "most expensive"` gone). Rank extracts symmetrically with cheapest: _(mention-only)_ — [`TODO.md` L2017](./TODO.md#L2017)
- [ ] `e2e-bug.102` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1588](./TODO.md#L1588)
- [ ] `e2e-bug.106` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2120](./TODO.md#L2120)
- [ ] `e2e-bug.108` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1805](./TODO.md#L1805)
- [ ] `e2e-bug.109` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2191](./TODO.md#L2191)
- [ ] `e2e-bug.110` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1806](./TODO.md#L1806)
- [ ] `e2e-bug.111` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2168](./TODO.md#L2168)
- [ ] `e2e-bug.112` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2172](./TODO.md#L2172)
- [ ] `e2e-bug.113` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2345](./TODO.md#L2345)
- [ ] `e2e-bug.118` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1304](./TODO.md#L1304)
- [ ] `e2e-bug.122` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1213](./TODO.md#L1213)
- [ ] `e2e-bug.128` **[Open]** — `confirm_my_booking_details` never validates the guest manage-token; any garbage token + a real `bookingId` leaks a total stranger's full booking details, unauthenticated, business _(mention-only)_ — [`TODO.md` L2120](./TODO.md#L2120)
- [ ] `e2e-bug.129` **[Open]** — `explain_my_subscription` is itself unreachable via natural language, which is why the `subscription_first_visit` compound can never get past step 1. — Fixed: (1) `isOpenBillingSet _(mention-only)_ — [`TODO.md` L2406](./TODO.md#L2406)
- [ ] `e2e-bug.130` **[Open]** — a gift-card purchase request is severely cross-domain misclassified into multi-service-booking availability-checking, not any gift-card action at all. — Fixed: (1) `isMultiServiceA _(mention-only)_ — [`TODO.md` L2408](./TODO.md#L2408)
- [ ] `e2e-bug.131` **[Open]** — `remove_service_from_cart` hallucinates to a *dashboard-admin* action name, not just a plausible customer one. — Fixed: (1) `isUnassignServicesFromProviderPrompt` no longer treats  _(mention-only)_ — [`TODO.md` L1329](./TODO.md#L1329)
- [ ] `e2e-bug.132` **[Open]** — `explain_cancel_policy` correctly classifies formal and even heavily-typo'd phrasing, but misclassifies the most natural, casual phrasing of the same question into a completely unr _(mention-only)_ — [`TODO.md` L2462](./TODO.md#L2462)
- [ ] `e2e-bug.133` **[Open]** — a tour-business booking request gets routed into a clinic-only action, and the response literally announces it's on the wrong vertical. — Fixed: (1) `isExplainResultStatusPrompt` n _(mention-only)_ — [`TODO.md` L2490](./TODO.md#L2490)
- [ ] `e2e-bug.134` **[Open]** — `guest_manage_visit`: a guest with a valid manage-link token asking to cancel their booking is told to sign in instead — the opposite of what a manage link is for. — Fixed: (1) `is _(mention-only)_ — [`TODO.md` L2496](./TODO.md#L2496)
- [ ] `e2e-bug.135` **[Open]** — 142) — e2e-bug.135 (systemic pipeline-internals leak), e2e-bug.136 (mutation false-success on `clear_schedule`), e2e-bug.137 (react_agent tool-registry gap, confirmed across 7 doma _(mention-only)_ — [`TODO.md` L2538](./TODO.md#L2538)
- [ ] `e2e-bug.136` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2556](./TODO.md#L2556)
- [ ] `e2e-bug.137` **[Open]** — 3 further independent confirmations, widening the confirmed-broken domain list. Same session, immediately following: `"What promo codes are currently active"` → `react_agent`: `"I  _(mention-only)_ — [`TODO.md` L2567](./TODO.md#L2567)
- [ ] `e2e-bug.138` **[Open]** — a business-owner request for a business-wide customer-segment list gets misclassified into a customer-self-service "view MY OWN subscriptions" intent, and then fails with a sign-in _(mention-only)_ — [`TODO.md` L2588](./TODO.md#L2588)
- [ ] `e2e-bug.139` **[Open]** — a support-ticket question is confidently answered with a real number, but the number belongs to a completely different domain (AI agent tasks), because no dashboard AI action for r _(mention-only)_ — [`TODO.md` L2590](./TODO.md#L2590)
- [ ] `e2e-bug.140` **[Open]** — `record_expense` extracts a garbage value into the `category` field because the classifier has zero guidance on what a valid category looks like. — Fixed: `normalizeExpenseCategory _(mention-only)_ — [`TODO.md` L2596](./TODO.md#L2596)
- [ ] `e2e-bug.141` **[Open]** — `delete_expense` fails to match an expense by description even though the classifier's own rules document description-matching as supported, and the description text given matched  _(mention-only)_ — [`TODO.md` L2598](./TODO.md#L2598)
- [ ] `e2e-bug.142` **[Open]** — no dashboard AI action can list/view promo codes at all, so a request to see the promo code the AI itself just created falls through to the tool-less react_agent and is denied. — F _(mention-only)_ — [`TODO.md` L2602](./TODO.md#L2602)
- [ ] `e2e-bug.143` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2612](./TODO.md#L2612)
- [ ] `e2e-bug.144` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2618](./TODO.md#L2618)
- [ ] `e2e-bug.145` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2628](./TODO.md#L2628)
- [ ] `e2e-bug.146` **[Open]** — `"Set commission rate for Gevorg Gasparyan to 20 percent"` → `react_agent`: `"I currently cannot set commission rates for employees."` — but `create_commission_rule` is a real, dis _(mention-only)_ — [`TODO.md` L2636](./TODO.md#L2636)
- [ ] `e2e-bug.147` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2642](./TODO.md#L2642)
- [ ] `e2e-bug.148` **[Open]** — `create_product` fails to extract a plainly-stated price because its regex fallback only recognizes rigid `"price 5"`/`"retail 5"` number-adjacent forms, not natural phrasing like  _(mention-only)_ — [`TODO.md` L2648](./TODO.md#L2648)
- [ ] `e2e-bug.149` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2662](./TODO.md#L2662)
- [ ] `e2e-bug.150` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2672](./TODO.md#L2672)
- [ ] `e2e-bug.151` **[Open]** — creating a plain catalog category gets misclassified as creating a discount promo code, with the category name treated as a promo code name. — Fixed: `isCreateServiceCategoryPrompt _(mention-only)_ — [`TODO.md` L2690](./TODO.md#L2690)
- [ ] `e2e-bug.152` **[Open]** — the exact same prompt, verbatim, routes to a completely different action on repeated asks, flipping between a correct real-data answer and a flat denial. — Fixed: `isListClinicTask _(mention-only)_ — [`TODO.md` L2696](./TODO.md#L2696)
- [ ] `e2e-bug.153` **[Open]** — 155's pattern. Not numbered. _(mention-only)_ — [`TODO.md` L2746](./TODO.md#L2746)
- [ ] `e2e-bug.154` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2754](./TODO.md#L2754)
- [ ] `e2e-bug.155` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2760](./TODO.md#L2760)
- [ ] `e2e-bug.157` **[Open]** — creating a multi-service package gets misclassified into gift-card-bundle creation, a real but semantically distinct action, and the error message's own example makes the confusion _(mention-only)_ — [`TODO.md` L2840](./TODO.md#L2840)
- [ ] `e2e-bug.159` **[Open]** — asking to set up a personal, ongoing owner alert gets reinterpreted as a one-off customer-facing notification proposal, misunderstanding both who should be notified and about what. _(mention-only)_ — [`TODO.md` L2880](./TODO.md#L2880)
- [ ] `e2e-bug.162` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2952](./TODO.md#L2952)
- [ ] `e2e-bug.163` **[Open]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2966](./TODO.md#L2966)
- [x] `e2e-bug.165` **[Fixed]** — dashboard `BookingService.cancel()` had zero refund logic + concurrent cancels silent lost-update — [`TODO.md` L3518](./TODO.md#L3518)

### e2e-bug.1–100 (mostly mention-only) (11)

- [x] `e2e-bug.2` **[Fixed]** — cold/hard load never applied `body.salon-tab-active` (Ionic `useIonViewDidEnter` skip) → fixed CTA / content sat under tab bar — [`TODO.md` L983](./TODO.md#L983)
- [x] `e2e-bug.4` **[Fixed]** — primary tap targets used Ion hosts (`generic` a11y role); native `ConsumerActionButton` / fixed bar / provider list + home / not-found CTAs — [`TODO.md` L1268](./TODO.md#L1268)
- [x] `e2e-bug.10` **[Fixed]** — N/A env gap: online checkout correctly requires Stripe Connect; unblocked on `gevgas-operations` (`acct_1Tmz2M81m04mcCIP`); re-verified 2026-07-31 — [`TODO.md` L917](./TODO.md#L917)
- [x] `e2e-bug.74` **[Fixed]** — concurrent provider check-in TOCTOU (all 201); claim under FOR UPDATE without outer joins; live `qa-e2e-bug-74.mjs` 5/5 (2026-07-31) — [`TODO.md` e2e-bug.74](./TODO.md#e2e-bug74--concurrent-provider-check-in-requests-all-succeed-toctou-duplicate-reception-pushes--fixed)
- [x] `e2e-bug.81` **[Fixed]** — `my_gift_cards` hardcoded `"Your gift cards."`; now data-bearing summary + account navigate; live `qa-e2e-bug-81.mjs` 6/6 (2026-07-31) — [`TODO.md` e2e-bug.81](./TODO.md#e2e-bug81--my_gift_cards-returned-a-hardcoded-non-data-bearing-summary--fixed)
- [x] `e2e-bug.83` **[Fixed]** — `claim_referral_code` stolen by `apply_gift_card_code`; claim rescue + gift-card cue gate; live `qa-e2e-bug-83.mjs` 26/26 (2026-07-31) — [`TODO.md` e2e-bug.83](./TODO.md#e2e-bug83--claim_referral_code-stolen-by-apply_gift_card_code--fixed)
- [x] `e2e-bug.84` **[Fixed]** — `privacy_delete` no confirmation before GDPR erasure; two-turn preview; live `qa-e2e-bug-84.mjs` 8/8 (2026-07-31) — [`TODO.md` e2e-bug.84](./TODO.md#e2e-bug84--privacy_delete-had-no-confirmation-before-irreversible-gdpr-erasure--fixed)
- [x] `e2e-bug.87` **[Fixed]** — hy guide mixed-script / full-Latin transliteration corruption (incl. 2-step worse variant); clean corpora + live `qa-e2e-bug-87.mjs` 9/9 (2026-07-31) — [`TODO.md` e2e-bug.87](./TODO.md#e2e-bug87--hy-locale-guide-mixed-script--full-latin-transliteration-corruption--fixed)
- [x] `e2e-bug.88` **[Fixed]** — classification + named-service execution fixed (e2e-bug.229). Widget threads full slot context (`bookingStep:checkout` + ids). Same matrix as Section G: _(mention-only)_ — [`TODO.md` L2004](./TODO.md#L2004)
- [x] `e2e-bug.90` **[Fixed]** — public discovery intents raw 500 (`PUBLIC_ASSISTANT_INTENTS` undefined `.includes`); leaf fallback + gate; live `qa-e2e-bug-90.mjs` 14/14 (2026-07-31) — [`TODO.md` e2e-bug.90](./TODO.md#e2e-bug90--public-discovery-intents-raw-500-on-undefined-public_assistant_intents--fixed)
- [x] `e2e-bug.91` **[Fixed]** — public assistant leaked `_capabilityHints` / `_entityMemoryBlock` / role keys in `sessionContext`; sanitize + public map; live `qa-e2e-bug-91.mjs` 12/12 (2026-07-31) — [`TODO.md` e2e-bug.91](./TODO.md#e2e-bug91--public-assistant-leaked-orchestration-internals-in-sessioncontext--fixed)
- [x] `e2e-bug.92` **[Fixed]** — `check_providers_for_service` gravity well; removed customer gateway hard-remap + abs-date/`with Name` escapes; live `qa-e2e-bug-92.mjs` 14/14 (2026-07-31) — [`TODO.md` e2e-bug.92](./TODO.md#e2e-bug92--check_providers_for_service-gravity-well--fixed)
- [x] `e2e-bug.93` **[Fixed]** — named provider availability/profile name-drop; full-name/`free`/Open-profile/`What's X's availability` + day clarify; live `qa-e2e-bug-93.mjs` 13/13 (2026-07-31) — [`TODO.md` e2e-bug.93](./TODO.md#e2e-bug93--named-provider-availability--profile-name-drop--fixed)
- [x] `e2e-bug.96` **[Fixed]** — unauthenticated `confirm_my_booking_details` IDOR (bookingId alone / garbage token); live `qa-e2e-bug-96.mjs` 10/10 incl. e2e-bug.261 forge (2026-07-31) — [`TODO.md` e2e-bug.96](./TODO.md#e2e-bug96--confirm_my_booking_details-unauthenticated-idor--fixed)

### API bugs (5)

- [x] `api-bug.1` **[Fixed]** — guest manage reschedule/cancel crashed on `customer:<uuid>` actor → `ensureMember`/Postgres uuid; guard + live `qa-api-bug-1.mjs` 5/5 (2026-07-31) — [`TODO.md` api-bug.1](./TODO.md#api-bug1--guest-manage-reschedule-customeruuid-actor-postgres-crash--fixed)
- [x] `api-bug.2` **[Fixed]** — package vs multi-service `maxDurationMinutes` (packages skip cap; providers path hardened); live `qa-api-bug-2.mjs` 14/14 (2026-07-31) — [`TODO.md` api-bug.2](./TODO.md#api-bug2--package-booking-vs-multi-service-maxdurationminutes-inconsistency--fixed)
- [x] `api-bug.4` **[Fixed]** — concurrent double-book same slot; FOR UPDATE claim; live `qa-api-bug-4.mjs` 7/7 (2026-07-31) — [`TODO.md` api-bug.4](./TODO.md#api-bug4--concurrent-double-book-same-slot-parallel-post-bookings--fixed)
- [x] `api-bug.5` **[Fixed]** — concurrent cancel idempotent (manage + `/me`); live `qa-api-bug-5.mjs` 7/7 (2026-07-31) — [`TODO.md` api-bug.5](./TODO.md#api-bug5--concurrent-cancel-same-booking-manage--me--fixed)
- [x] `api-bug.7` **[Fixed]** — package/multi online `amountDue` = per-line prepayment sum (not catalog total); live `qa-api-bug-7.mjs` 8/8 (2026-07-31) — [`TODO.md` api-bug.7](./TODO.md#api-bug7--online-amountdue-is-per-line-prepayment-sum-not-catalogpackage-total--fixed)

---

## Fixed

72 bugs classified Fixed from TODO.md signals:

- [x] `e2e-bug.247` **[Fixed]** — dashboard-handoff explainers unreachable (registry + post-heuristic lock); live `qa-e2e-bug-247.mjs` 16/16 (2026-07-31) — residual **e2e-bug.266** — [`TODO.md` e2e-bug.247](./TODO.md#e2e-bug247--dashboard-handoff-explainers-explain_dashboard_only_action-explain_reassign_limit-explain_time_off_approval-completely-unreachable--fixed)
- [x] `e2e-bug.246` **[Fixed]** — assistant UX explainers unreachable (registry + rescue before Exp2/Exp3); live `qa-e2e-bug-246.mjs` 15/15 (2026-07-31) — [`TODO.md` e2e-bug.246](./TODO.md#e2e-bug246--assistant-ux-explainers-explain_accessibility_settings-explain_offline_suggestions-completely-unreachable--fixed)
- [x] `e2e-bug.245` **[Fixed]** — calendar-scheduling explainers unreachable (registry + rescue before Exp2/Exp3); live `qa-e2e-bug-245.mjs` 16/16 (2026-07-31) — [`TODO.md` e2e-bug.245](./TODO.md#e2e-bug245--calendar-scheduling-explainers-explain_block_vs_time_off-explain_calendar_utilization_bands-completely-unreachable--fixed)
- [x] `e2e-bug.244` **[Fixed]** — visit-status explainers unreachable (registry + Exp2 no-steal); live `qa-e2e-bug-244.mjs` 18/18 (2026-07-31) — [`TODO.md` e2e-bug.244](./TODO.md#e2e-bug244--visit-status-explainers-explain_floor_status-explain_booking_status_badge-completely-unreachable--fixed)
- [x] `e2e-bug.243` **[Fixed]** — `give_provider_ai_feedback` unreachable (registry + Not-helpful-down + lastAction); live `qa-e2e-bug-243.mjs` 16/16 (2026-07-31) — residual **e2e-bug.265** (Fixed; **280**/ **281**) — [`TODO.md` e2e-bug.243](./TODO.md#e2e-bug243--give_provider_ai_feedback-completely-unreachable--no-rescue-call-no-registry-entry--fixed)
- [x] `e2e-bug.242` **[Fixed]** — `confirm_pending_booking` unreachable (registry + named customerName + push no-steal); live `qa-e2e-bug-242.mjs` 18/18 (2026-07-31) — [`TODO.md` e2e-bug.242](./TODO.md#e2e-bug242--confirm_pending_booking-completely-unreachable--no-rescue-call-no-registry-entry--fixed)
- [x] `e2e-bug.241` **[Fixed]** — `mark_multi_service_step_done` unreachable (registry + per-leg precedence); live `qa-e2e-bug-241.mjs` 17/17 (2026-07-31) — residual **e2e-bug.264** — [`TODO.md` e2e-bug.241](./TODO.md#e2e-bug241--mark_multi_service_step_done-completely-unreachable--no-rescue-call-no-registry-entry--fixed)
- [x] `e2e-bug.240` **[Fixed]** — `mark_visit_in_progress` unreachable (registry + detection); live `qa-e2e-bug-240.mjs` 16/16 (2026-07-31) — residual **e2e-bug.263** — [`TODO.md` e2e-bug.240](./TODO.md#e2e-bug240--mark_visit_in_progress-completely-unreachable--no-rescue-call-no-registry-entry--fixed)
- [x] `api-bug.7` **[Fixed]** — package/multi online amountDue = per-line prepayment sum; unit 99 related, live `qa-api-bug-7.mjs` 8/8 (2026-07-31) — [`TODO.md` api-bug.7](./TODO.md#api-bug7--online-amountdue-is-per-line-prepayment-sum-not-catalogpackage-total--fixed)
- [x] `api-bug.5` **[Fixed]** — concurrent cancel idempotent (manage + `/me`); unit 46 related, live `qa-api-bug-5.mjs` 7/7 (2026-07-31) — [`TODO.md` api-bug.5](./TODO.md#api-bug5--concurrent-cancel-same-booking-manage--me--fixed)
- [x] `api-bug.4` **[Fixed]** — concurrent double-book same slot; FOR UPDATE claim; unit 16 related, live `qa-api-bug-4.mjs` 7/7 (2026-07-31) — [`TODO.md` api-bug.4](./TODO.md#api-bug4--concurrent-double-book-same-slot-parallel-post-bookings--fixed)
- [x] `api-bug.2` **[Fixed]** — package vs multi-service `maxDurationMinutes`; providers enforce cap for ad-hoc; live `qa-api-bug-2.mjs` 14/14 (2026-07-31) — [`TODO.md` api-bug.2](./TODO.md#api-bug2--package-booking-vs-multi-service-maxdurationminutes-inconsistency--fixed)
- [x] `api-bug.1` **[Fixed]** — guest manage reschedule `customer:<uuid>` actor Postgres crash; unit 6/6, live `qa-api-bug-1.mjs` 5/5 (2026-07-31) — [`TODO.md` api-bug.1](./TODO.md#api-bug1--guest-manage-reschedule-customeruuid-actor-postgres-crash--fixed)
- [x] `e2e-bug.96` **[Fixed]** — confirm_my_booking_details unauthenticated IDOR; unit 23/23 related, live `qa-e2e-bug-96.mjs` 10/10 (2026-07-31) — [`TODO.md` e2e-bug.96](./TODO.md#e2e-bug96--confirm_my_booking_details-unauthenticated-idor--fixed)
- [x] `e2e-bug.261` **[Fixed]** — forged context.customerId bypassed confirm IDOR guard; inbound sanitize (2026-07-31) — [`TODO.md` e2e-bug.261](./TODO.md#e2e-bug261--forged-contextcustomerid-bypassed-confirm_my_booking_details-idor-guard--fixed)
- [x] `e2e-bug.93` **[Fixed]** — named provider availability/profile name-drop; unit 17/17, live `qa-e2e-bug-93.mjs` 13/13 (2026-07-31) — [`TODO.md` e2e-bug.93](./TODO.md#e2e-bug93--named-provider-availability--profile-name-drop--fixed)
- [x] `e2e-bug.92` **[Fixed]** — check_providers gravity well; unit 61/61 related, live `qa-e2e-bug-92.mjs` 14/14 (2026-07-31) — [`TODO.md` e2e-bug.92](./TODO.md#e2e-bug92--check_providers_for_service-gravity-well--fixed)
- [x] `e2e-bug.91` **[Fixed]** — public assistant sessionContext leaked orchestration internals; unit 7/7, live `qa-e2e-bug-91.mjs` 12/12 (2026-07-31) — [`TODO.md` e2e-bug.91](./TODO.md#e2e-bug91--public-assistant-leaked-orchestration-internals-in-sessioncontext--fixed)
- [x] `e2e-bug.90` **[Fixed]** — public discovery intents raw 500 on undefined allowlist `.includes`; unit 25/25, live `qa-e2e-bug-90.mjs` 14/14 (2026-07-31) — [`TODO.md` e2e-bug.90](./TODO.md#e2e-bug90--public-discovery-intents-raw-500-on-undefined-public_assistant_intents--fixed)
- [x] `e2e-bug.87` **[Fixed]** — hy guide mixed-script / full-Latin corruption (2-step + 3-step); unit 106/106, live `qa-e2e-bug-87.mjs` 9/9 (2026-07-31) — [`TODO.md` e2e-bug.87](./TODO.md#e2e-bug87--hy-locale-guide-mixed-script--full-latin-transliteration-corruption--fixed)
- [x] `e2e-bug.1` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L917](./TODO.md#L917)
- [x] `e2e-bug.84` **[Fixed]** — `privacy_delete` two-turn confirm before GDPR erasure; unit 47/47, live `qa-e2e-bug-84.mjs` 8/8 (2026-07-31) — [`TODO.md` e2e-bug.84](./TODO.md#e2e-bug84--privacy_delete-had-no-confirmation-before-irreversible-gdpr-erasure--fixed)
- [x] `e2e-bug.257` **[Fixed]** — privacy_delete turn-2 `"yes"` pending rescue not wired on customer surface (e2e-bug.84 residual) — [`TODO.md` e2e-bug.257](./TODO.md#e2e-bug257--privacy_delete-turn-2-yes-failed-without-history-pending-not-wired-on-customer-surface--fixed)
- [x] `e2e-bug.83` **[Fixed]** — `claim_referral_code` stolen by gift-card apply; unit 19/19, live `qa-e2e-bug-83.mjs` 26/26 (2026-07-31) — [`TODO.md` e2e-bug.83](./TODO.md#e2e-bug83--claim_referral_code-stolen-by-apply_gift_card_code--fixed)
- [x] `e2e-bug.256` **[Fixed]** — GCM-/GCB-/GCS- checkout apply stolen by `promo_code_help` (e2e-bug.83 residual) — [`TODO.md` e2e-bug.256](./TODO.md#e2e-bug256--use-code-gcm--at-checkout-stolen-by-promo_code_help-e2e-bug83-residual--fixed)
- [x] `e2e-bug.81` **[Fixed]** — `my_gift_cards` hardcoded summary; data-bearing counts/balances + navigate; unit 14/14, live `qa-e2e-bug-81.mjs` 6/6 (2026-07-31) — [`TODO.md` e2e-bug.81](./TODO.md#e2e-bug81--my_gift_cards-returned-a-hardcoded-non-data-bearing-summary--fixed)
- [x] `e2e-bug.74` **[Fixed]** — concurrent provider check-in TOCTOU; FOR UPDATE claim without outer joins; unit 26/26, live `qa-e2e-bug-74.mjs` 5/5 (2026-07-31) — [`TODO.md` e2e-bug.74](./TODO.md#e2e-bug74--concurrent-provider-check-in-requests-all-succeed-toctou-duplicate-reception-pushes--fixed)
- [x] `e2e-bug.255` **[Fixed]** — provider ready_now / running_late visit-status TOCTOU; FOR UPDATE claim + idempotent no re-notify; unit 19/19, live `qa-e2e-bug-255.mjs` 11/11 (2026-07-31) — [`TODO.md` e2e-bug.255](./TODO.md#e2e-bug255--provider-ready_now--running_late-visit-status-updates-are-not-serialized-e2e-bug74-sibling--fixed)
- [x] `e2e-bug.258` **[Fixed]** — short Armenian how-to-book → booking_help; unit + live `qa-e2e-bug-258.mjs` 11/11 (2026-07-31) — residuals **e2e-bug.274**, **e2e-bug.275** — [`TODO.md` e2e-bug.258](./TODO.md#e2e-bug258--short-armenian-how-to-book-misroutes-to-confirm_my_booking_details--fixed)
- [x] `e2e-bug.259` **[Fixed]** — hy/ru clarify + Still stuck? handoff via messages.ts; live `qa-e2e-bug-259.mjs` 8/8 (2026-07-31) — residuals **e2e-bug.276**, **e2e-bug.277** — [`TODO.md` e2e-bug.259](./TODO.md#e2e-bug259--hy-locale-english-clarifystatus--still-stuck-handoff-alongside-clean-guides--fixed)
- [x] `e2e-bug.274` **[Fixed]** — confirm anon clarify localized (e2e-bug.259 pass); live in `qa-e2e-bug-259.mjs` — [`TODO.md` e2e-bug.274](./TODO.md#e2e-bug274--confirm_my_booking_details-clarify-stays-english-under-localehy--fixed)
- [x] `e2e-bug.2` **[Fixed]** — cold/hard load never applied `body.salon-tab-active` → CTA/content under tab bar; mount-default + ref-count class; re-verified 2026-07-31 (unit 15/15, live `qa-e2e-bug-2.mjs` 5/5) — [`TODO.md` L983](./TODO.md#L983)
- [x] `e2e-bug.4` **[Fixed]** — primary CTAs were Ion hosts (`generic` a11y); native `ConsumerActionButton` + fixed bar + provider list; residual home/not-found converted 2026-07-31; unit 18/18, live `qa-e2e-bug-4.mjs` 8/8 — [`TODO.md` L1268](./TODO.md#L1268)
- [x] `e2e-bug.10` **[Fixed]** — N/A (test-env): checkout correctly requires Stripe Connect; linked on `gevgas-operations`; unit 68/68 + live `qa-e2e-bug-10.mjs` 6/6 (2026-07-31) — [`TODO.md` L917](./TODO.md#L917)
- [x] `e2e-bug.3` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1044](./TODO.md#L1044)
- [x] `e2e-bug.6` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1087](./TODO.md#L1087)
- [x] `e2e-bug.7` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1312](./TODO.md#L1312)
- [x] `e2e-bug.11` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1304](./TODO.md#L1304)
- [x] `e2e-bug.15` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1312](./TODO.md#L1312)
- [x] `e2e-bug.18` **[Fixed]** — native single-service return`, confirmed present in source and confirmed working via a direct probe (`optischedule://book/salon/svc-1?paid=1&startTime=...&session_id=cs_single_nati _(mention-only)_ — [`TODO.md` L1080](./TODO.md#L1080)
- [x] `e2e-bug.75` **[Fixed]** — Fixed (see Fix log). Originally: every mutating self-service-booking intent whose natural phrasing mentions "my booking/appointment/visit" (at minimum `cancel_my_booking`, `resched _(mention-only)_ — [`TODO.md` L1317](./TODO.md#L1317)
- [x] `e2e-bug.76` **[Fixed]** — Fixed (see Fix log). Originally: a *question-phrased* cancel request ("can I cancel my appointment?", "is it possible to cancel my booking?") got hijacked to the read-only `explain _(mention-only)_ — [`TODO.md` L1319](./TODO.md#L1319)
- [x] `e2e-bug.77` **[Fixed]** — Fixed (see Fix log). Originally: customer/public prompts sharing vocabulary with provider/dashboard-only intents were rescued into those staff actions and then `security_blocked` ( _(mention-only)_ — [`TODO.md` L1325](./TODO.md#L1325)
- [x] `e2e-bug.78` **[Fixed]** — Fixed (see Fix log). Originally: the `cancel_all_upcoming_bookings` two-turn confirm flow never completed — `"yes"` / `"yes, cancel them all"` after the preview re-showed the same  _(mention-only)_ — [`TODO.md` L1327](./TODO.md#L1327)
- [x] `e2e-bug.79` **[Fixed]** — Fixed (see Fix log). Originally: `explain_subscription_vs_one_time` unreachable via natural language — all 3 realistic phrasings failed: `"should I get the subscription or just pay _(mention-only)_ — [`TODO.md` L1336](./TODO.md#L1336)
- [x] `e2e-bug.80` **[Fixed]** — the entire gift-card purchase flow (`buy_gift_card`, `buy_gift_card_physical`) is unreachable via natural language; `get_gift_card_quote` is unreliable too — every tested "gift car _(mention-only)_ — [`TODO.md` L1188](./TODO.md#L1188)
- [x] `e2e-bug.82` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1303](./TODO.md#L1303)
- [x] `e2e-bug.85` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1553](./TODO.md#L1553)
- [x] `e2e-bug.86` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1554](./TODO.md#L1554)
- [x] `e2e-bug.89` **[Fixed]** — Fixed (see Fix log). Originally: the `cancel_and_rebook` compound (and by extension any compound whose steps include `cancel_my_booking`) failed at the cancellation step with "No u _(mention-only)_ — [`TODO.md` L1541](./TODO.md#L1541)
- [x] `e2e-bug.95` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1765](./TODO.md#L1765)
- [x] `e2e-bug.97` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2123](./TODO.md#L2123)
- [x] `e2e-bug.107` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1086](./TODO.md#L1086)
- [x] `e2e-bug.114` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2210](./TODO.md#L2210)
- [x] `e2e-bug.156` **[Fixed]** — a mutation *confirmation prompt* (the text a business owner reads right before approving a real batch write) contains a fabricated detail: a non-existent employee name attached to  _(mention-only)_ — [`TODO.md` L2786](./TODO.md#L2786)
- [x] `e2e-bug.158` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2856](./TODO.md#L2856)
- [x] `e2e-bug.160` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2896](./TODO.md#L2896)
- [x] `e2e-bug.161` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L2862](./TODO.md#L2862)
- [x] `e2e-bug.164` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L927](./TODO.md#L927)
- [x] `e2e-bug.168` **[Fixed]** — "Orchestrix AI" plan execution crashes with `Cannot read properties of undefined (reading 'some')` whenever `applyDays` isn't specified in the prompt — [`TODO.md` L3141](./TODO.md#L3141)
- [x] `e2e-bug.169` **[Fixed]** — `propose_create_direct_schedule(s)` never resolves `employeeId` from a bare `employeeName`, unlike every other provider-scoped schedule tool — [`TODO.md` L3169](./TODO.md#L3169)
- [x] `e2e-bug.170` **[Fixed]** — `propose_block_schedule` can never succeed at execution: it never builds the `isRepetitive`/`singleBlock`/`repetitiveBlock` shape the underlying service requires — [`TODO.md` L3191](./TODO.md#L3191)
- [x] `e2e-bug.171` **[Fixed]** — a correctly-classified, high-confidence dashboard scheduling command gets silently hijacked by a customer-only rescue heuristic when paraphrased — [`TODO.md` L3207](./TODO.md#L3207)
- [x] `e2e-bug.177` **[Fixed]** — every consumer-app AI-assistant `clientAction` (native push, notification settings, update-nudge dismissal, checkout-recommendation dismissal, analytics consent, TTS) was silently  — [`TODO.md` L3261](./TODO.md#L3261)
- [x] `e2e-bug.179` **[Fixed]** — `prepaymentDue()`'s 50%-deposit fallback silently undercharges by a cent on exact-half-cent ties (e.g. $19.99 deposit computed as $9.99 instead of $10.00), found writing branch-cov — [`TODO.md` L3305](./TODO.md#L3305)
- [x] `e2e-bug.180` **[Fixed]** — checkout payment-method gating checked `service.prepaymentMode` directly instead of the already-`onlinePaymentEnabled`-gated `prepaymentDue()`, forcing online-only checkout (with c — [`TODO.md` L3319](./TODO.md#L3319)
- [x] `e2e-bug.181` **[Fixed]** — a declined/abandoned online payment left the customer permanently stranded with zero feedback: `confirmPendingPayment`'s catch block was fully silent, and the one designed recovery — [`TODO.md` L3333](./TODO.md#L3333)
- [x] `e2e-bug.182` **[Fixed]** — a single subscription-plan payment minted 3 duplicate `customer_subscriptions` rows (12 appointment credits instead of 4), because a re-render race on the frontend fires several co — [`TODO.md` L3355](./TODO.md#L3355)
- [x] `e2e-bug.183` **[Fixed]** — cancelling a booking that's currently in progress (partway through the visit) is correctly blocked, but with a misleading reason implying a notice-window problem instead of "this i — [`TODO.md` L3392](./TODO.md#L3392)
- [x] `e2e-bug.184` **[Fixed]** — booking cancellation was completely broken for any booking whose cancel reached the actual lock/refund code path: a raw Postgres error ("FOR UPDATE cannot be applied to the nullabl — [`TODO.md` L3404](./TODO.md#L3404)
- [x] `e2e-bug.185` **[Fixed]** — a customer whose booking-cancellation refund genuinely failed (Stripe error, etc.) saw the exact same silent "cancelled" outcome as a customer whose refund succeeded, with zero ind — [`TODO.md` L3418](./TODO.md#L3418)
- [x] `e2e-bug.187` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1125](./TODO.md#L1125)
- [x] `e2e-bug.188` **[Fixed]** — see TODO.md mentions _(mention-only)_ — [`TODO.md` L1176](./TODO.md#L1176)

---

## Full index (all 183)

| ID | Status | Headed | Title |
|---|---|---|---|
| `api-bug.1` | **Fixed** | yes | guest manage reschedule/cancel `customer:<uuid>` actor → Postgres uuid crash |
| `api-bug.2` | **Fixed** | yes | package vs multi-service maxDurationMinutes (packages skip; ad-hoc enforce) |
| `api-bug.4` | **Fixed** | yes | concurrent double-book same slot (parallel POST /bookings) |
| `api-bug.5` | **Fixed** | yes | concurrent cancel same booking (manage + /me) idempotent |
| `api-bug.7` | **Fixed** | yes | online amountDue = per-line prepayment sum (not catalog/package total) |
| `e2e-bug.1` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.2` | **Fixed** | no | cold/hard load never applied `body.salon-tab-active` → CTA/content under tab bar |
| `e2e-bug.3` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.4` | **Fixed** | no | primary tap targets used Ion hosts (`generic` a11y role) |
| `e2e-bug.6` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.7` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.10` | **Fixed** | no | N/A env gap: online checkout correctly requires Stripe Connect |
| `e2e-bug.11` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.15` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.18` | **Fixed** | no | native single-service return`, confirmed present in source and confirmed working |
| `e2e-bug.74` | **Fixed** | yes | concurrent provider check-in TOCTOU; FOR UPDATE claim without outer joins |

| `e2e-bug.75` | **Fixed** | no | Fixed (see Fix log). Originally: every mutating self-service-booking intent whos |
| `e2e-bug.76` | **Fixed** | no | Fixed (see Fix log). Originally: a *question-phrased* cancel request ("can I can |
| `e2e-bug.77` | **Fixed** | no | Fixed (see Fix log). Originally: customer/public prompts sharing vocabulary with |
| `e2e-bug.78` | **Fixed** | no | Fixed (see Fix log). Originally: the `cancel_all_upcoming_bookings` two-turn con |
| `e2e-bug.79` | **Fixed** | no | Fixed (see Fix log). Originally: `explain_subscription_vs_one_time` unreachable  |
| `e2e-bug.80` | **Fixed** | no | the entire gift-card purchase flow (`buy_gift_card`, `buy_gift_card_physical`) i |
| `e2e-bug.81` | **Fixed** | yes | `my_gift_cards` hardcoded summary; now data-bearing counts/balances + navigate |
| `e2e-bug.82` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.83` | **Fixed** | yes | `claim_referral_code` stolen by `apply_gift_card_code` |
| `e2e-bug.84` | **Fixed** | yes | `privacy_delete` no confirmation before irreversible GDPR erasure |
| `e2e-bug.85` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.86` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.87` | **Fixed** | yes | hy guide mixed-script / full-Latin transliteration corruption (2-step + 3-step) |
| `e2e-bug.88` | **Fixed** | no | classification + named-service execution fixed (e2e-bug.229). Widget threads |
| `e2e-bug.89` | **Fixed** | no | Fixed (see Fix log). Originally: the `cancel_and_rebook` compound (and by extens |
| `e2e-bug.90` | **Fixed** | yes | public discovery intents raw 500 on undefined PUBLIC_ASSISTANT_INTENTS `.includes` |
| `e2e-bug.91` | **Fixed** | yes | public assistant leaked orchestration internals in sessionContext |
| `e2e-bug.92` | **Fixed** | yes | check_providers_for_service gravity well (customer hard-remap + abs-date) |
| `e2e-bug.93` | **Fixed** | yes | named provider availability/profile name-drop (full-name, free, Open profile, What's X's availability) |
| `e2e-bug.95` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.96` | **Fixed** | yes | confirm_my_booking_details unauthenticated IDOR (bookingId alone / garbage token) |
| `e2e-bug.97` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.101` | **Open** | no | largely fixed on this surface. High-end rank vocab no longer searches a literal  |
| `e2e-bug.102` | **Open** | no | see TODO.md mentions |
| `e2e-bug.106` | **Open** | no | see TODO.md mentions |
| `e2e-bug.107` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.108` | **Open** | no | see TODO.md mentions |
| `e2e-bug.109` | **Open** | no | see TODO.md mentions |
| `e2e-bug.110` | **Open** | no | see TODO.md mentions |
| `e2e-bug.111` | **Open** | no | see TODO.md mentions |
| `e2e-bug.112` | **Open** | no | see TODO.md mentions |
| `e2e-bug.113` | **Open** | no | see TODO.md mentions |
| `e2e-bug.114` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.118` | **Open** | no | see TODO.md mentions |
| `e2e-bug.122` | **Open** | no | see TODO.md mentions |
| `e2e-bug.128` | **Open** | no | `confirm_my_booking_details` never validates the guest manage-token; any garbage |
| `e2e-bug.129` | **Open** | no | `explain_my_subscription` is itself unreachable via natural language, which is w |
| `e2e-bug.130` | **Open** | no | a gift-card purchase request is severely cross-domain misclassified into multi-s |
| `e2e-bug.131` | **Open** | no | `remove_service_from_cart` hallucinates to a *dashboard-admin* action name, not  |
| `e2e-bug.132` | **Open** | no | `explain_cancel_policy` correctly classifies formal and even heavily-typo'd phra |
| `e2e-bug.133` | **Open** | no | a tour-business booking request gets routed into a clinic-only action, and the r |
| `e2e-bug.134` | **Open** | no | `guest_manage_visit`: a guest with a valid manage-link token asking to cancel th |
| `e2e-bug.135` | **Open** | no | 142) — e2e-bug.135 (systemic pipeline-internals leak), e2e-bug.136 (mutation fal |
| `e2e-bug.136` | **Open** | no | see TODO.md mentions |
| `e2e-bug.137` | **Open** | no | 3 further independent confirmations, widening the confirmed-broken domain list.  |
| `e2e-bug.138` | **Open** | no | a business-owner request for a business-wide customer-segment list gets misclass |
| `e2e-bug.139` | **Open** | no | a support-ticket question is confidently answered with a real number, but the nu |
| `e2e-bug.140` | **Open** | no | `record_expense` extracts a garbage value into the `category` field because the  |
| `e2e-bug.141` | **Open** | no | `delete_expense` fails to match an expense by description even though the classi |
| `e2e-bug.142` | **Open** | no | no dashboard AI action can list/view promo codes at all, so a request to see the |
| `e2e-bug.143` | **Open** | no | see TODO.md mentions |
| `e2e-bug.144` | **Open** | no | see TODO.md mentions |
| `e2e-bug.145` | **Open** | no | see TODO.md mentions |
| `e2e-bug.146` | **Open** | no | `"Set commission rate for Gevorg Gasparyan to 20 percent"` → `react_agent`: `"I  |
| `e2e-bug.147` | **Open** | no | see TODO.md mentions |
| `e2e-bug.148` | **Open** | no | `create_product` fails to extract a plainly-stated price because its regex fallb |
| `e2e-bug.149` | **Open** | no | see TODO.md mentions |
| `e2e-bug.150` | **Open** | no | see TODO.md mentions |
| `e2e-bug.151` | **Open** | no | creating a plain catalog category gets misclassified as creating a discount prom |
| `e2e-bug.152` | **Open** | no | the exact same prompt, verbatim, routes to a completely different action on repe |
| `e2e-bug.153` | **Open** | no | 155's pattern. Not numbered. |
| `e2e-bug.154` | **Open** | no | see TODO.md mentions |
| `e2e-bug.155` | **Open** | no | see TODO.md mentions |
| `e2e-bug.156` | **Fixed** | no | a mutation *confirmation prompt* (the text a business owner reads right before a |
| `e2e-bug.157` | **Open** | no | creating a multi-service package gets misclassified into gift-card-bundle creati |
| `e2e-bug.158` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.159` | **Open** | no | asking to set up a personal, ongoing owner alert gets reinterpreted as a one-off |
| `e2e-bug.160` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.161` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.162` | **Open** | no | see TODO.md mentions |
| `e2e-bug.163` | **Open** | no | see TODO.md mentions |
| `e2e-bug.164` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.165` | **Fixed** | yes | dashboard `BookingService.cancel()` had zero refund logic + concurrent cancels silent lost-update |
| `e2e-bug.166` | **Open** | yes | locale hydration mismatch on the booking confirmation page (found via user-repor |
| `e2e-bug.167` | **Open** | no | no dashboard AI action exists to report refunds at all, confirmed with unusually |
| `e2e-bug.168` | **Fixed** | yes | "Orchestrix AI" plan execution crashes with `Cannot read properties of undefined |
| `e2e-bug.169` | **Fixed** | yes | `propose_create_direct_schedule(s)` never resolves `employeeId` from a bare `emp |
| `e2e-bug.170` | **Fixed** | yes | `propose_block_schedule` can never succeed at execution: it never builds the `is |
| `e2e-bug.171` | **Fixed** | yes | a correctly-classified, high-confidence dashboard scheduling command gets silent |
| `e2e-bug.172` | **Open** | yes | `AcceptInvitePage` doesn't establish (or clear) a session, so a newly-invited em |
| `e2e-bug.174` | **Open** | no | see TODO.md mentions |
| `e2e-bug.177` | **Fixed** | yes | every consumer-app AI-assistant `clientAction` (native push, notification settin |
| `e2e-bug.178` | **Open** | yes | investigated a suspected 6th e2e-bug.3 instance (false alarm, already fixed) + f |
| `e2e-bug.179` | **Fixed** | yes | `prepaymentDue()`'s 50%-deposit fallback silently undercharges by a cent on exac |
| `e2e-bug.180` | **Fixed** | yes | checkout payment-method gating checked `service.prepaymentMode` directly instead |
| `e2e-bug.181` | **Fixed** | yes | a declined/abandoned online payment left the customer permanently stranded with  |
| `e2e-bug.182` | **Fixed** | yes | a single subscription-plan payment minted 3 duplicate `customer_subscriptions` r |
| `e2e-bug.183` | **Fixed** | yes | cancelling a booking that's currently in progress (partway through the visit) is |
| `e2e-bug.184` | **Fixed** | yes | booking cancellation was completely broken for any booking whose cancel reached  |
| `e2e-bug.185` | **Fixed** | yes | a customer whose booking-cancellation refund genuinely failed (Stripe error, etc |
| `e2e-bug.186` | **Open** | no | see TODO.md mentions |
| `e2e-bug.187` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.188` | **Fixed** | no | see TODO.md mentions |
| `e2e-bug.189` | **Fixed** | yes | `list_providers` ("Who are your providers / specialists?") misroutes to `check_p |
| `e2e-bug.190` | **Fixed** | yes | `check_availability` is unreachable as a live single-intent on `/public/:slug/as |
| `e2e-bug.191` | **Fixed** | yes | `business_info` ("Tell me about this business / salon info") misroutes to `expla |
| `e2e-bug.192` | **Fixed** | yes | `book_appointment` natural-language book prompts never create a booking (→ `unkn |
| `e2e-bug.193` | **Fixed** | yes | `list_services` classifies correctly but fails entity resolution on "What servic |
| `e2e-bug.194` | **Fixed** | yes | `explain_provider_availability` returns a generic clarify despite named provider |
| `e2e-bug.195` | **Fixed** | yes | `booking_help` ("How do I book an appointment step by step?") misroutes to `expl |
| `e2e-bug.196` | **Fixed** | yes | 7 of 14 `PUBLIC_ONLY_ASSISTANT_ACTIONS` are dead on compound / `executeDetermini |
| `e2e-bug.197` | **Fixed** | yes | customer JWT from Business A is accepted on `/public/{BusinessB}/assistant`, so  |
| `e2e-bug.198` | **Fixed** | yes | `customer_clinic_compound` always dies on step 2 (`notify_when_results_ready`) e |
| `e2e-bug.199` | **Fixed** | yes | budget / flexible-availability compound fixtures say "haircut" but live salon ca |
| `e2e-bug.200` | **Fixed** | yes | `customer_flexible_availability_budget_compound` drops `serviceName` / loses com |
| `e2e-bug.201` | **Fixed** | yes | `intake_lab_book_pay` always dies on step 1 because `complete_intake_and_book` r |
| `e2e-bug.202` | **Fixed** | yes | `book_lab_collection_nearest` reports full compound success for a nonexistent la |
| `e2e-bug.203` | **Fixed** | yes | `guest_book_and_manage` / `guest_pay_cash_manage` stolen by `explain_guest_check |
| `e2e-bug.204` | **Fixed** | yes | `public_assistant_compound` is unreachable on live `/public/:slug/assistant` (pu |
| `e2e-bug.205` | **Open** | yes | `tour_group_checkout` / `book_tour_nearest_departure` glue capacity/date cue tex |
| `e2e-bug.206` | **Open** | yes | incomplete tour group prompt (`Wine tour for 6 next Saturday` without capacity g |
| `e2e-bug.207` | **Fixed** | yes | public booking home omits hours and service-category teaser (checklist landing c |
| `e2e-bug.208` | **Fixed** | yes | `/book/[slug]/services` is not a full-catalog browse (hard redirect + slot filte |
| `e2e-bug.209` | **Fixed** | yes | services list never surfaces prepayment/deposit (API fields unused in UI) |
| `e2e-bug.210` | **Fixed** | yes | provider `/reviews` page omits aggregate rating summary |
| `e2e-bug.211` | **Fixed** | yes | dedicated provider reviews route is undiscoverable when all reviews fit on profi |
| `e2e-bug.212` | **Fixed** | yes | public checkout defaults WhatsApp reminders ON, blocking guest book without a ph |
| `e2e-bug.213` | **Fixed** | yes | multi-service quote returns `subtotal`/`amountDue` 0 for pay-at-visit carts (UI  |
| `e2e-bug.214` | **Fixed** | yes | package checkout quote/`Total` show US$0.00 for a $344 package (pay-at-visit lin |
| `e2e-bug.215` | **Fixed** | yes | account “Leave a review” links to provider profile instead of the post-visit rev |
| `e2e-bug.216` | **Fixed** | yes | guest manage cancel success shows misleading “Your booking is confirmed” toast |
| `e2e-bug.217` | **Fixed** | yes | `suggest-lines` fails for Swedish+Neck while `suggest-block` succeeds |
| `e2e-bug.218` | **Fixed** | yes | salon JWT on another business's `/public/{slug}/me/*` can read PII and DELETE th |
| `e2e-bug.219` | **Fixed** | yes | guide/assistant summaries keep an English `Step N of M:` prefix in hy/ru |
| `e2e-bug.220` | **Fixed** | yes | mobile assistant FAB overlaps sticky bottom CTAs |
| `e2e-bug.221` | **Fixed** | yes | web booking has no “running late” self-service (consumer-app only) |
| `e2e-bug.222` | **Fixed** | yes | pay-at-visit (`prepayment_mode:none`) checkout UI still offers “Pay online” |
| `e2e-bug.223` | **Fixed** | yes | public booking assistant POST shows “Created successfully.” toast |
| `e2e-bug.224` | **Fixed** | yes | public web `followNavigate` missing consumer-style path mapping (packages/login/ |
| `e2e-bug.225` | **Fixed** | yes | web booking assistant never auto-navigates on booking-verb + checkout |
| `e2e-bug.226` | **Fixed** | yes | `list_services` treats “you offer” from “what services do you offer?” as a servi |
| `e2e-bug.227` | **Fixed** | yes | `explain_business_hours_and_location` reports close time 19:00 vs public hours 1 |
| `e2e-bug.228` | **Fixed** | yes | `suggest_package_block` checkout navigate drops package on public web |
| `e2e-bug.229` | **Fixed** | yes | `pay_online` with named service wipes checkout session `serviceId` (e2e-bug.88 r |
| `e2e-bug.230` | **Fixed** | yes | e2e-bug.79 residual: “subscription or just pay per visit” → `confirm_my_booking_ |
| `e2e-bug.231` | **Fixed** | yes | `check_gift_card_balance` by code still unreachable (sibling steals) |
| `e2e-bug.232` | **Fixed** | yes | `claim_referral_code` stolen by `apply_promo_code_checkout` (e2e-bug.83 residual |
| `e2e-bug.233` | **Fixed** | yes | web home widget steers loyalty prompts into `guide_user_flow` |
| `e2e-bug.234` | **Fixed** | yes | manage-page AI ignores URL-threaded `manageToken` for guest reschedule/cancel |
| `e2e-bug.235` | **Fixed** | yes | waitlist confirm still says “with Gevorg with Gevorg” (e2e-bug.112 residual) |
| `e2e-bug.236` | **Fixed** | yes | `report_booking_problem` natural phrasing stolen by `confirm_my_booking_details` |
| `e2e-bug.237` | **Fixed** | yes | dated cancel+rebook (“…rebook for next Friday”) still fails lookup / misroutes ( |
| `e2e-bug.238` | **Fixed** | yes | budget/flex compound treats “soonest” as a service name in `list_services` |
| `e2e-bug.239` | **Fixed** | yes | `action:error` fallback summary not localized (en-only for hy/ru) |
| `e2e-bug.240` | **Fixed** | yes | `mark_visit_in_progress` unreachable (registry gate); live qa-e2e-bug-240 16/16 |
| `e2e-bug.241` | **Fixed** | yes | `mark_multi_service_step_done` unreachable (registry gate); live qa-e2e-bug-241 17/17 |
| `e2e-bug.263` | **Fixed** | yes | visit-status aliases clarify on multi-match; live qa-e2e-bug-263 9/9 |
| `e2e-bug.264` | **Fixed** | yes | customerName → unique multi-service group; live qa-e2e-bug-264 7/7 |
| `e2e-bug.242` | **Fixed** | yes | `confirm_pending_booking` unreachable (registry + named extract); live qa-e2e-bug-242 18/18 |
| `e2e-bug.243` | **Fixed** | yes | `give_provider_ai_feedback` unreachable; live qa-e2e-bug-243 16/16 |
| `e2e-bug.265` | **Fixed** | yes | Not helpful → down; live qa-e2e-bug-265 19/19 |
| `e2e-bug.280` | **Fixed** | yes | short feedback cues unknown-phase rescue; live qa-e2e-bug-280 22/22 |
| `e2e-bug.281` | **Fixed** | yes | public give_ai_feedback forwards chips/labels; live qa-e2e-bug-281 13/13 |
| `e2e-bug.293` | **Fixed** | yes | Thumbs up/down/emoji rate; live qa-e2e-bug-293 18/18 |
| `e2e-bug.299` | **Fixed** | yes | give_ai_feedback chip/summary labels localize under locale hy/ru; live qa-e2e-bug-299 22/22 |
| `e2e-bug.300` | **Fixed** | yes | +1 / -1 rate as give_ai_feedback; live qa-e2e-bug-300 20/20 |
| `e2e-bug.326` | **Open** | yes | "+1 thanks" / "thanks +1" stay unknown (e2e-bug.300 residual) |
| `e2e-bug.324` | **Open** | yes | HY native Օգտակար չէ stays unknown (e2e-bug.299 residual) |
| `e2e-bug.325` | **Open** | yes | provider give_provider_ai_feedback labels stay EN under hy/ru |
| `e2e-bug.244` | **Fixed** | yes | visit-status explainers unreachable; live qa-e2e-bug-244 18/18 |
| `e2e-bug.245` | **Fixed** | yes | calendar-scheduling explainers unreachable; live qa-e2e-bug-245 16/16 |
| `e2e-bug.246` | **Fixed** | yes | assistant UX explainers unreachable; live qa-e2e-bug-246 15/15 |
| `e2e-bug.247` | **Fixed** | yes | dashboard-handoff explainers unreachable; live qa-e2e-bug-247 16/16 |
| `e2e-bug.266` | **Fixed** | yes | my_stats նչ+եմ false-positives removed; live qa-e2e-bug-266 16/16 |
| `e2e-bug.282` | **Fixed** | yes | HY/RU call-client → dashboard handoff; live qa-e2e-bug-282 13/13 |
| `e2e-bug.283` | **Fixed** | yes | product-guide no-steal for my_stats; live qa-e2e-bug-283 12/12 |
| `e2e-bug.302` | **Fixed** | yes | HY/RU Home|Today → provider-today-calendar; live qa-e2e-bug-302 10/10 |
| `e2e-bug.303` | **Fixed** | yes | first-person how-am-I → Your/mine; live qa-e2e-bug-303 12/12 |
| `e2e-bug.328` | **Open** | yes | my_stats Your/Team stats summaries stay EN under HY/RU |
| `e2e-bug.301` | **Fixed** | yes | explain_dashboard_only_action summaries localize HY/RU; live qa-e2e-bug-301 12/12 |
| `e2e-bug.327` | **Open** | yes | explain_reassign_limit / explain_time_off_approval summaries stay EN under HY/RU |
| `e2e-bug.248` | **Fixed** | yes | move+nearest → reschedule_booking; live qa-e2e-bug-248 15/15 |
| `e2e-bug.267` | **Fixed** | yes | semicolon move+put-it nearest → single reschedule; live qa-e2e-bug-267 10/10 |
| `e2e-bug.284` | **Fixed** | yes | move+then-book golden reschedule→create; live qa-e2e-bug-284 8/8 |
| `e2e-bug.304` | **Fixed** | yes | mid-step clarify keeps compound resume; live qa-e2e-bug-304 6/6 |
| `e2e-bug.305` | **Fixed** | yes | compound clarify action=compound_intent; live qa-e2e-bug-305 7/7 |
| `e2e-bug.329` | **Open** | yes | compound resume empty prior plans still skips/fails reschedule |
| `e2e-bug.330` | **Open** | yes | remaining ~41 guide playbooks lack shortTitleKey (e2e-bug.316 residual) |
| `e2e-bug.331` | **Open** | yes | page-help on /book/services|/book/checkout misroutes (e2e-bug.316 residual) |
| `e2e-bug.332` | **Open** | yes | create_booking "is not free" still uses DD/MM slash (e2e-bug.286 residual) |
| `e2e-bug.333` | **Open** | yes | short first-available Create a booking may skip BFA (e2e-bug.286 residual) |
| `e2e-bug.334` | **Open** | yes | public is anyone free → explain_provider_availability "anyone" (e2e-bug.307 residual) |
| `e2e-bug.335` | **Open** | yes | public is anybody open → check_providers not check_availability (e2e-bug.307 residual) |
| `e2e-bug.268` | **Fixed** | yes | first-available clamps ≥ today; live qa-e2e-bug-268 9/9 |
| `e2e-bug.285` | **Fixed** | yes | AI date labels unambiguous; skip enrich for booking; live qa-e2e-bug-285 7/7 |
| `e2e-bug.306` | **Fixed** | yes | no-slot/availability dates use AI labels; live qa-e2e-bug-306 8/8 |
| `e2e-bug.286` | **Fixed** | yes | Create a booking first available → create_booking not create_employee (live 15/15; residuals 332/333) |
| `e2e-bug.249` | **Fixed** | yes | check+book nearest stays create_booking; live qa-e2e-bug-249 13/13 |
| `e2e-bug.269` | **Fixed** | yes | anybody-open-schedule check+book; live qa-e2e-bug-269 11/11 |
| `e2e-bug.287` | **Fixed** | yes | check-only anybody-open → check_providers_for_service; live qa-e2e-bug-287 18/18 |
| `e2e-bug.307` | **Fixed** | yes | public is anybody open stays availability not calendar (live 17/17; residuals 334/335) |
| `e2e-bug.250` | **Fixed** | yes | `list_tour_calendar_week` prompt fragment as `serviceName` (session + parse guard); live qa-e2e-bug-250 12/12 |
| `e2e-bug.270` | **Fixed** | yes | week-phrase weekStartDate no longer Invalid time value; live qa-e2e-bug-270 17/17 |
| `e2e-bug.288` | **Fixed** | yes | next/last week tours → list_tour_calendar_week; live qa-e2e-bug-288 17/17 |
| `e2e-bug.308` | **Fixed** | yes | tour calendar week labels via formatDateForAiLabel; covered in qa-e2e-bug-289 |
| `e2e-bug.289` | **Fixed** | yes | HY/RU tour calendar week summaries localized + skip enrich; live qa-e2e-bug-289 16/16 |
| `e2e-bug.309` | **Fixed** | yes | RU next/last-week calendar tours → list_tour_calendar_week; live qa-e2e-bug-309 19/19; residual 336 |
| `e2e-bug.310` | **Fixed** | yes | HY last-week anchors deterministic (անցած/նախորդ/անցյալ/վերջին); live qa-e2e-bug-310 18/18 |
| `e2e-bug.336` | **Open** | yes | explain_tour_calendar_span empty summaries still DD/MM slash (e2e-bug.309 residual) |
| `e2e-bug.251` | **Fixed** | yes | catalog category create ≠ import_services_from_menu; live qa-e2e-bug-251 11/11 |
| `e2e-bug.271` | **Fixed** | yes | voice named X…please keeps full categoryName; live qa-e2e-bug-271 14/14 |
| `e2e-bug.290` | **Fixed** | yes | trailing kindly/cheers/appreciate stripped from categoryName; live qa-e2e-bug-290 17/17 |
| `e2e-bug.291` | **Fixed** | yes | HY catalog-category create → create_service_category; live qa-e2e-bug-291 16/16 |
| `e2e-bug.311` | **Fixed** | yes | HY/RU explain_clinic_services empty localized + skip enrich; live qa-e2e-bug-311 17/17; residual 337 |
| `e2e-bug.337` | **Open** | yes | HY բացատրի՛ր կլինիկական ծառայությունները → explain_business_hours (e2e-bug.311 residual) |
| `e2e-bug.292` | **Fixed** | yes | RU catalog-category create → create_service_category; live qa-e2e-bug-292 15/15 |
| `e2e-bug.312` | **Open** | yes | RU create_service_category success summary sometimes English (e2e-bug.292 residual) |
| `e2e-bug.252` | **Fixed** | yes | owner alert "a customer reschedules" (-s) + no misclass_to_reschedule steal; live qa-e2e-bug-252 13/13 |
| `e2e-bug.253` | **Fixed** | yes | Account booking-card / ConsumerBookingActions → ConsumerActionButton; live qa-e2e-bug-253 7/7 |
| `e2e-bug.272` | **Fixed** | yes | package/multi-service visit actions → ConsumerActionButton; live qa-e2e-bug-272 9/9 |
| `e2e-bug.313` | **Open** | yes | package/multi reschedule shows Confirm when no slots (e2e-bug.272 residual) |
| `e2e-bug.314` | **Open** | yes | ConsumerSubscriptionsSection Account CTAs still IonButton (e2e-bug.272 residual) |
| `e2e-bug.254` | **Fixed** | yes | Face Pilling roll-forward assigned hours; live qa-e2e-bug-254 7/7 |
| `e2e-bug.273` | **Fixed** | yes | public GET ephemeral projection (no schedule persist); live qa-e2e-bug-273 8/8 |
| `e2e-bug.315` | **Open** | yes | booking POST still auto-materializes projected hours (e2e-bug.273 residual) |
| `e2e-bug.255` | **Fixed** | yes | provider ready_now / running_late FOR UPDATE claim; live qa-e2e-bug-255 11/11 |
| `e2e-bug.256` | **Fixed** | yes | GCM-/GCB-/GCS- checkout apply stolen by promo_code_help (e2e-bug.83 residual) |
| `e2e-bug.257` | **Fixed** | yes | privacy_delete turn-2 yes pending rescue not wired on customer surface |
| `e2e-bug.258` | **Fixed** | yes | short Armenian how-to-book → booking_help; live qa-e2e-bug-258 11/11 |
| `e2e-bug.259` | **Fixed** | yes | hy/ru clarify + Still stuck? handoff; live qa-e2e-bug-259 8/8 |
| `e2e-bug.274` | **Fixed** | yes | confirm anon clarify localized (e2e-bug.259 pass) |
| `e2e-bug.275` | **Fixed** | yes | hy/ru booking_help humanize step titles; live qa-e2e-bug-275 15/15 |
| `e2e-bug.294` | **Fixed** | yes | hy/ru shortTitles + humanize locale splits; live qa-e2e-bug-294 15/15 |
| `e2e-bug.316` | **Fixed** | yes | high-traffic guide playbooks shortTitleKey (e2e-bug.294 residual; live 33/33; residuals 330/331) |
| `e2e-bug.276` | **Fixed** | yes | Home-tab reclaim from widget/compare; live qa-e2e-bug-276 12/12 |
| `e2e-bug.277` | **Fixed** | yes | booking_help guide/supportHandoff round-trip; live qa-e2e-bug-277 11/11 |
| `e2e-bug.295` | **Fixed** | yes | Add next home screen → explain_home_screen_widget; live qa-e2e-bug-295 14/14 |
| `e2e-bug.317` | **Open** | yes | explain_home_screen_widget success summaries English under hy/ru (e2e-bug.295 residual) |
| `e2e-bug.259` | **Fixed** | yes | hy/ru clarify + Still stuck? handoff; live qa-e2e-bug-259 8/8 |
| `e2e-bug.260` | **Fixed** | yes | strip trailing time window from recommend serviceName; live qa-e2e-bug-260 11/11 |
| `e2e-bug.278` | **Fixed** | yes | recommend + day-part → recommend_specialists; live qa-e2e-bug-278 12/12 |
| `e2e-bug.296` | **Fixed** | yes | recommend someone + tonight/this evening same-day; live qa-e2e-bug-296 16/16 |
| `e2e-bug.318` | **Open** | yes | evening/tonight recommend lists afternoon slots (e2e-bug.296 residual) |
| `e2e-bug.319` | **Open** | yes | later today scrub → "massage later" (e2e-bug.296 residual) |
| `e2e-bug.279` | **Fixed** | yes | facial → face family synonym; live qa-e2e-bug-279 12/12 |
| `e2e-bug.297` | **Fixed** | yes | show me facials keeps face family; live qa-e2e-bug-297 12/12 |
| `e2e-bug.320` | **Open** | yes | show me massage → Deep tissue only (e2e-bug.297 residual) |
| `e2e-bug.321` | **Open** | yes | list massage services → Men's/Women's cut (e2e-bug.297 residual) |
| `e2e-bug.298` | **Fixed** | yes | trim/styling → hairstyle synonym; live qa-e2e-bug-298 12/12 |
| `e2e-bug.322` | **Open** | yes | list trim header stays "Our trim service types" (e2e-bug.298 residual) |
| `e2e-bug.323` | **Open** | yes | bare "a cut" prefers hairstyle over Men's/Women's cut (e2e-bug.298 residual) |
| `e2e-bug.261` | **Fixed** | yes | forged context.customerId bypassed confirm_my_booking_details IDOR guard |
| `e2e-bug.262` | **Fixed** | yes | public slots omit overlap-blocked starts; live qa-e2e-bug-262 7/7 |

