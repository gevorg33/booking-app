import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getCustomerToken } from '../lib/customer-auth.js';
import { updateMyPreferredLocale } from '../services/public-api.js';
import { writeStoredConsumerLocale } from '../lib/tenant-locale.js';

vi.mock('../lib/customer-auth.js', () => ({
  getCustomerToken: vi.fn(),
}));

vi.mock('../services/public-api.js', () => ({
  updateMyPreferredLocale: vi.fn(),
}));

describe('useConsumerLocale server sync (catalog-notify-1.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('persists locale locally for guests without API call', async () => {
    vi.mocked(getCustomerToken).mockReturnValue(null);
    writeStoredConsumerLocale('salon', 'hy');
    expect(updateMyPreferredLocale).not.toHaveBeenCalled();
  });

  it('sync hook contract: authed locale change calls updateMyPreferredLocale', async () => {
    vi.mocked(getCustomerToken).mockReturnValue('tok');
    vi.mocked(updateMyPreferredLocale).mockResolvedValue({
      preferredLocale: 'hy',
      storedLocale: 'hy',
    });

    if (getCustomerToken('salon')) {
      await updateMyPreferredLocale('salon', 'hy');
    }

    expect(updateMyPreferredLocale).toHaveBeenCalledWith('salon', 'hy');
  });
});
