/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperationFeedbackHost } from './OperationFeedbackHost.js';
import { AppVersionGate } from './AppVersionGate.js';
import { operationFeedbackStore } from '../lib/operation-feedback-store.js';

vi.mock('../services/public-api.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/public-api.js')>();
  return {
    ...actual,
    fetchMobileAppConfig: vi.fn(async () => ({
      killSwitch: false,
      minSupportedVersion: '0.0.1',
      latestVersion: '1.0.0',
      updateRequired: false,
      storeUrl: null,
      message: null,
    })),
  };
});

describe('cold-load root hosts (e2e-bug.14)', () => {
  let container: HTMLDivElement;
  let root: Root;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    operationFeedbackStore.resetForTests();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    errorSpy.mockRestore();
  });

  it('OperationFeedbackHost does not trip max update depth on mount', async () => {
    await act(async () => {
      root.render(<OperationFeedbackHost />);
    });
    // flush microtasks / effects
    await act(async () => {
      await Promise.resolve();
    });
    const depthErrors = errorSpy.mock.calls
      .map((c) => c.map(String).join(' '))
      .filter((m) => /Maximum update depth|Too many re-renders/i.test(m));
    expect(depthErrors).toEqual([]);
    expect(container.textContent).toBeDefined();
  });

  it('AppVersionGate + OperationFeedbackHost together stay stable', async () => {
    await act(async () => {
      root.render(
        <AppVersionGate>
          <OperationFeedbackHost />
          <div data-testid="child">ok</div>
        </AppVersionGate>,
      );
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    const depthErrors = errorSpy.mock.calls
      .map((c) => c.map(String).join(' '))
      .filter((m) => /Maximum update depth|Too many re-renders/i.test(m));
    expect(depthErrors).toEqual([]);
    expect(container.textContent).toContain('ok');
  });
});
