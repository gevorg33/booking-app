# Semantic steal guard (pipe-1.5.3 / acc-2.8)

Core semantic intents (`create_booking`, `check_providers_for_service`, `create_direct_schedule`, `book_nearest_slot`) must not absorb specialized domain prompts.

## Protected domains

| Domain | Example intents | Protection |
|--------|-----------------|------------|
| Tour calendar | `explain_tour_calendar_span`, `list_tour_calendar_week` | `isExplainTourCalendarSpanPrompt`, `isListTourCalendarWeekPrompt` |
| Provider stats | `summarize_staff`, `summarize_bookings` | `isSingleProviderRevenuePrompt`, `isTopStaffRevenuePrompt`, `isTotalEarningsPrompt` |
| Recommendation | `configure_recommendation_product`, `link_recommended_products`, `explain_recommendation_setup` | recommendation product util detectors |

## Enforcement

1. `isSemanticStealProtectedPrompt()` — deterministic domain vocabulary guard
2. `CommandUnderstandingPipelineService.stageSemanticMatch()` — skips semantic with trace `domain-protected (pipe-1.5.3)`
3. `AiSemanticIntentService.match()` — returns `null` for protected prompts
4. Rescue retains domain action when classifier returns `unknown`

## CI

```bash
npm run test:pipe-semantic-steal-guard
```

Included in `npm run test:ai-accuracy` (acc-2.8).
