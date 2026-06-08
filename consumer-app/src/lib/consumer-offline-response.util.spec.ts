import { describe, expect, it } from 'vitest';
import {
  isOfflineQueuedPayload,
  isOfflineQueuedResponse,
} from './consumer-offline-response.util.js';

describe('consumer-offline-response.util', () => {
  it('detects queued offline axios payloads', () => {
    expect(isOfflineQueuedResponse({ queued: true, offline: true }, 202)).toBe(true);
    expect(isOfflineQueuedResponse({ queued: true, offline: true }, 200)).toBe(false);
    expect(isOfflineQueuedPayload({ queued: true, offline: true })).toBe(true);
    expect(isOfflineQueuedPayload({ ok: true })).toBe(false);
  });
});
