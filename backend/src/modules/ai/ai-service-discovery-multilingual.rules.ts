/**
 * Classifier rules for multilingual service discovery — e2e-bug.477.
 *
 * Lives apart from the fixtures that use it because **production imports it**:
 * `ai-prompt-i18n.ts` needs this string, and `ai-prompt-i18n` is pulled in by
 * `ai-booking-core.service.ts`, `ai-prompt-normalization.service.ts` and
 * `customer-ai-command.util.ts`.
 *
 * While it lived in `ai-service-discovery-multilingual.fixtures.ts`, importing
 * the string also evaluated that module's scenario arrays, which are built at
 * load time from three *other* fixture modules. That closed an import cycle
 * (…→ ai-flexible-availability.util → ai-structural-extractors →
 * booking-first-available.semantic.util → intent-phrasing-bank.util →
 * intent-anchor.seed.util → ai-prompt-i18n → back here), and entering the graph
 * from the wrong side left those catalogs `undefined`, so the module threw
 * `Cannot read properties of undefined (reading 'find')` before a single test
 * ran.
 *
 * It is a self-contained string with no imports. Keeping it that way is what
 * keeps production out of the fixtures graph.
 */
export const SERVICE_DISCOVERY_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian/transliteration service discovery (budget + rank + OR availability):
  - maxPrice: hy «ունեմ X դրամ», «X դոլար», «X-ից ցած»; ru «у меня X рублей», «до X рублей», «меньше X»; translit «u menya X dollarov», «do X rubley» → list_services / check with maxPrice.
  - serviceRank: hy «ամենաէժան», «պրեմիում», «լյուքս»; ru «самый дешёвый», «люксовый», «премиум»; translit «samaya deshevaya», «premium uslugi» → list_services + serviceRank (NOT recommend_specialists for catalog rank).
  - OR availabilityWindows: hy «վաղը երեկոյան կամ ուրբաթ», «երեկոյան կամ հանգստյան օր»; ru «завтра вечером или в пятницу», «вечером или в субботу»; translit «vagh@ yereko yan kam urbat» → check_availability / check_providers_for_service with availabilityWindows[] (NOT single timeOfDay when «կամ/or/или» splits windows).
  - Compound: budget filter then OR scan — carry maxPrice + serviceRank through availabilityWindows; book compounds set bookingFirstAvailable when «ամենամոտ/blizhayshiy/забронируй» present.
  - Disambiguation: hy/ru gift card / package / deposit phrases → NOT maxPrice (same as English budget-1.3 rules).`;
