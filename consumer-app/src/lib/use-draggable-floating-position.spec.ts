import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  readStoredAnchor,
  reconcileFloatingSize,
} from './use-draggable-floating-position.js';

describe('reconcileFloatingSize', () => {
  it('prefers estimated size when measured panel size is stale on FAB', () => {
    expect(
      reconcileFloatingSize({ width: 400, height: 560 }, { width: 56, height: 56 }),
    ).toEqual({ width: 56, height: 56 });
  });

  it('keeps measured size when it matches estimated', () => {
    expect(
      reconcileFloatingSize({ width: 56, height: 56 }, { width: 56, height: 56 }),
    ).toEqual({ width: 56, height: 56 });
  });
});

describe('readStoredAnchor', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: { width: 390, height: 844 },
    });
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('clears legacy top-left coordinates from storage', () => {
    localStorage.setItem('consumer-ai-position-test', JSON.stringify({ x: 0, y: 0 }));
    const anchor = readStoredAnchor('consumer-ai-position-test', 64);
    expect(anchor).toEqual({ right: 24, bottom: 64 });
    expect(localStorage.getItem('consumer-ai-position-test')).toBeNull();
  });
});
