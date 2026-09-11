
## §128 — the 90% bar cannot be met by any slice, and that is about the corpus

§127 noted in passing that "90% on n=6 is not a meaningful threshold". That deserved more than a
passing note, because the same bar has been used to gate every retirement decision from §88 onward.

### Wilson intervals on the readiness table

95% confidence intervals on the §119 per-domain figures, trace-weighted:

| domain | traces | point | 95% CI | clears 90%? |
|---|---|---|---|---|
| **tour** | 33/34 | 97% | **85–99%** | *possible, not established* |
| push | 15/18 | 83% | 61–94% | possible |
| commerce | 7/11 | 64% | 35–85% | no |
| operations | 6/30 | 20% | 10–37% | no |
| business | 3/14 | 21% | 8–48% | no |
| booking / catalog | 5/56 | 9% | 3–28% | no |
| clinic / customer / marketing / payment / guide / compliance | 0/53 | 0% | 0–14% … 0–79% | no |

**No domain's lower bound reaches 90%, including `tour`.**

And the structural fact behind it: to get a 95% lower bound at or above 90% you need **n ≥ 35 traces
with no failures at all**. `tour` has 34 traces and one failure. The largest slice in the corpus cannot
clear this bar even scoring perfectly.

### What that does and does not overturn

It does **not** say `tour`'s retirement was wrong. §92's evidence is still the strongest available:
33 of 34 recoveries on precisely the traffic the detectors decided, and the alternative — deleting
detectors with nothing behind them — measured at 20% loss. That comparison does not depend on a 90%
threshold at all.

It does say that **"clears §42's 90% bar" was a stronger claim than n=34 supports**, and I have written
it that way in §88, §92, §118, §119 and §127. The point estimate was reported as if it settled a
threshold question; it never could.

### The bar is being used outside its design

`PROPOSE_ONLY_ACCURACY_BAR = 90` comes from §42, where it gates a command against the **8,509-case**
deterministic corpus — a sample where 90% is a sharp line. Applying the same number to a per-domain
sample of 34, or 18, or 6 rescue-dependent traces is using a precise instrument on data that cannot
resolve it.

That is not fixable by gathering more data: traffic stopped 2026-08-03, and the rescue-dependent
population is 216 traces in total across all thirteen domains.

### What a defensible criterion looks like

Two options, and both are honest where the current one is not:

1. **state the interval** — retire when the 95% lower bound clears a lower threshold (say 70%), which
   `tour` does comfortably at 85% and nothing else approaches;
2. **compare against the alternative** rather than a constant — retire when planner recovery beats
   detector-deletion loss by a margin, which is what §92 actually measured and what actually decided
   `tour`.

The second is closer to what the decision needs: retirement is a choice between the planner and
nothing, not between the planner and an abstract bar.

Filed as `e2e-bug.406`.

### Verification

- Fast chain **3,876 across 19**, 0 failures. No code changed in this section.
