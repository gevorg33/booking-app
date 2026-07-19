/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import * as publicApi from '../services/public-api.js';
import { ConsumerWaitlistSection } from './ConsumerWaitlistSection.js';

describe('ConsumerWaitlistSection (e2e-bug.12)', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it('exposes join waitlist as a native button when not on the list', async () => {
    vi.spyOn(publicApi, 'fetchMyWaitlistStatus').mockResolvedValue({
      onWaitlist: false,
      request: null,
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <ConsumerWaitlistSection slug="demo" copy={CONSUMER_COPY_EN} authed />
        </QueryClientProvider>,
      );
    });

    await vi.waitFor(() => {
      const join = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes(CONSUMER_COPY_EN.waitlistJoinAction),
      );
      expect(join?.tagName).toBe('BUTTON');
    });
  });
});
