import { describe, expect, it } from 'vitest';
import {
  isOfflineQueuedResponse,
  offlineNeedsNetworkSummary,
  offlineQueuedAssistantSummary,
} from './provider-offline-response.util';

describe('provider-offline-response.util', () => {
  it('detects queued offline axios responses', () => {
    expect(isOfflineQueuedResponse({ queued: true, offline: true }, 202)).toBe(true);
    expect(isOfflineQueuedResponse({ queued: true }, 202)).toBe(false);
    expect(isOfflineQueuedResponse({ queued: true, offline: true }, 200)).toBe(false);
  });

  it('returns translated offline assistant summaries', () => {
    const t = (key: string) => key;
    expect(offlineQueuedAssistantSummary(t)).toBe('provider.offlineCommandQueued');
    expect(offlineNeedsNetworkSummary(t)).toBe('provider.offlineCommandNeedsNetwork');
  });
});
