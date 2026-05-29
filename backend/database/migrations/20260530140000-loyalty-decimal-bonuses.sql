-- Store loyalty bonuses as dollar credit with cents (e.g. 0.50 = $0.50 bonus).
ALTER TABLE loyalty_accounts
  ALTER COLUMN "pointsBalance" TYPE numeric(12, 2) USING "pointsBalance"::numeric,
  ALTER COLUMN "lifetimeEarned" TYPE numeric(12, 2) USING "lifetimeEarned"::numeric;

ALTER TABLE loyalty_transactions
  ALTER COLUMN points TYPE numeric(12, 2) USING points::numeric;
