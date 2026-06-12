# Intent anchor bank boundary (pipe-1.4.1)

Semantic anchors paraphrase user intent — they must **not** encode catalog entities.

## Rules

1. **Generic phrases only** — no person names, customer/staff codes (`emp-`, `cust-`, `GCM-`), or emails.
2. **EN first per intent** — canonical English anchors precede HY/RU/translit in `getIntentAnchorBank()`.
3. **Seed from eval** — eval cases with `useSemanticIntentMatch: true` merge via `harvestEvalPhrasingAnchors()`; no seed-util edits per paraphrase.
4. **Service nouns** — eval prompts sanitize `massage`, `haircut`, etc. to generic `service` before anchoring.

## Where to add anchors

| Source | File |
|--------|------|
| Canonical EN/HY/RU | `intent-phrasing.bank.ts` |
| Eval paraphrases | `ai-semantic-intent.fixtures.ts` → `SEMANTIC_PARAPHRASE_SCENARIOS` (auto-harvested) |

## CI gate

`npm run test:pipe-intent-anchor-boundary`
