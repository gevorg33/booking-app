/** e2e-bug.38 — restore ledger rows use negative amount / creditsConsumed. */
export function isGiftCardRestoreRedemption(row: {
  amount?: number | null;
  creditsConsumed?: number | null;
}): boolean {
  return Number(row.amount ?? 0) < 0 || Number(row.creditsConsumed ?? 0) < 0;
}

export function restoredMonetaryBalance(params: {
  currentBalance: number;
  restoreAmount: number;
  initialBalance: number;
}): number {
  const restoreAmount = Math.max(0, Number(params.restoreAmount) || 0);
  const current = Math.max(0, Number(params.currentBalance) || 0);
  const initial = Math.max(0, Number(params.initialBalance) || 0);
  return Math.min(initial, current + restoreAmount);
}

export function restoredServiceCreditRemaining(params: {
  quantityRemaining: number;
  quantityTotal: number;
  creditsToRestore: number;
}): number {
  const credits = Math.max(0, Number(params.creditsToRestore) || 0);
  const remaining = Math.max(0, Number(params.quantityRemaining) || 0);
  const total = Math.max(0, Number(params.quantityTotal) || 0);
  return Math.min(total, remaining + credits);
}
