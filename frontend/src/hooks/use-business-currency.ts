'use client';

import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/lib/store';
import { formatBusinessMoney, readBusinessCurrency } from '@/lib/business-currency';

export function useBusinessCurrency() {
  const business = useAuthStore((s) => s.business);
  const currency = useMemo(
    () => readBusinessCurrency(business?.settings),
    [business?.settings],
  );

  const formatMoney = useCallback(
    (amount: number | string | null | undefined, entityCurrency?: string | null) =>
      formatBusinessMoney(amount, { entityCurrency, businessCurrency: currency }),
    [currency],
  );

  return { currency, formatMoney };
}
