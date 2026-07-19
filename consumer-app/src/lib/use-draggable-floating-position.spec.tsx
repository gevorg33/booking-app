/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  readStoredAnchor,
  reconcileFloatingSize,
  useViewportSize,
} from './use-draggable-floating-position.js';

function ViewportProbe({ onRender }: { onRender: (v: { width: number; height: number }) => void }) {
  const viewport = useViewportSize();
  onRender(viewport);
  return null;
}

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

describe('useViewportSize (e2e-bug.14)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('keeps viewport state identity when resize fires with the same dimensions', () => {
    const seen: Array<{ width: number; height: number }> = [];
    act(() => {
      root.render(<ViewportProbe onRender={(v) => seen.push(v)} />);
    });
    const afterMount = seen[seen.length - 1];
    expect(afterMount?.width).toBeGreaterThan(0);

    act(() => {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
    });

    const last = seen[seen.length - 1];
    expect(last).toBe(afterMount);
  });
});
