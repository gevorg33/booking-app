# Semantic intent deterministic fallback (pipe-1.4.4)

When OpenAI embeddings are unavailable, semantic match uses **token cosine** in `ai-semantic-intent.util.ts`.

## When fallback runs

| Condition | Matcher |
|-----------|---------|
| `NODE_ENV=test` (CI) | `rankAnchorsDeterministic` |
| No OpenAI API key for business | `rankAnchorsDeterministic` |
| API available in production | Pre-embedded vectors + cosine (`pipe-1.4.3`) |

## Scoring

1. `tokenizeForSemantic` — Unicode-aware tokens (EN/HY/RU)
2. `scoreTokenCosineBetweenPhrases` — bag-of-words cosine vs anchor phrase
3. `scoreConceptCoverage` — synonym group coverage from anchor bank
4. Blend: `concept * 0.85 + tokenCosine * 0.15` (or phrase-only for eval anchors)

Threshold: `SEMANTIC_CONCEPT_THRESHOLD` (0.65).

## CI gate

`npm run test:pipe-semantic-deterministic`
