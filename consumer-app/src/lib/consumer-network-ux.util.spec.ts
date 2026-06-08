import { describe, expect, it } from 'vitest';
import {
  formatFriendlyNetworkError,
  isRetryableNetworkError,
} from './consumer-network-ux.util.js';

describe('consumer-network-ux.util (adopt-5.4)', () => {
  it('detects retryable network failures', () => {
    expect(isRetryableNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
    expect(isRetryableNetworkError(new Error('Network Error'))).toBe(true);
    expect(isRetryableNetworkError({ response: { status: 500 } })).toBe(false);
  });

  it('formats friendly load errors', () => {
    expect(formatFriendlyNetworkError({ code: 'ERR_NETWORK' }, 'Load failed')).toBe('Load failed');
    expect(formatFriendlyNetworkError(new Error('Bad slot'), 'Load failed')).toBe('Bad slot');
  });
});
