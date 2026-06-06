import { describe, expect, it } from 'vitest';
import { formatProviderMoney, resolveTenantPriceCurrency } from './business-currency';

describe('business-currency integration (provider app)', () => {
  it('formats booking list price with AMD tenant default when service currency missing', () => {
    const code = resolveTenantPriceCurrency(null, 'AMD');
    expect(code).toBe('AMD');
    const formatted = formatProviderMoney(15000, null, 'AMD');
    expect(formatted).toMatch(/֏|AMD/);
  });

  it('formats POS retail total in business currency when summary currency is absent', () => {
    const formatted = formatProviderMoney(36, null, 'EUR');
    expect(formatted).toContain('€');
  });

  it('keeps per-service EUR on a USD-default tenant', () => {
    const formatted = formatProviderMoney(80, 'EUR', 'USD');
    expect(formatted).toContain('€');
  });
});
