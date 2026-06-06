import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../services/auth-store';
import {
  formatProviderMoney,
  readBusinessCurrency,
} from './business-currency';

export function useBusinessCurrency() {
  const businessCurrencyRaw = useAuthStore((s) => s.business?.currency);
  const currency = useMemo(
    () => readBusinessCurrency(businessCurrencyRaw),
    [businessCurrencyRaw],
  );

  const formatMoney = useCallback(
    (amount: number | string | null | undefined, entityCurrency?: string | null) =>
      formatProviderMoney(amount, entityCurrency, currency),
    [currency],
  );

  return { currency, formatMoney };
}
