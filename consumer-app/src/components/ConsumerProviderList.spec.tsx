/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import type { PublicProvider } from '../lib/types.js';
import { ConsumerProviderList } from './ConsumerProviderList.js';

const provider: PublicProvider = {
  id: 'emp-1',
  name: 'Gevorg Gasparyan',
  role: 'Massage therapist',
  slots: [{ startTime: '2026-07-20T09:00:00.000Z', endTime: '2026-07-20T09:30:00.000Z' }],
  averageRating: 3.5,
  reviewCount: 6,
};

describe('ConsumerProviderList (e2e-bug.4)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('exposes provider profile as a light-DOM link and any-specialist as a button', () => {
    const onAnySpecialist = vi.fn();
    act(() => {
      root.render(
        <MemoryRouter>
          <ConsumerProviderList
            slug="demo"
            providers={[provider]}
            primaryColor="#336699"
            copy={CONSUMER_COPY_EN}
            locale="en"
            selectedEmployeeId={null}
            selectedStartTime={null}
            onSelect={() => undefined}
            onAnySpecialist={onAnySpecialist}
          />
        </MemoryRouter>,
      );
    });

    const profileLink = container.querySelector(
      'a.consumer-provider-list__profile-link[href="/s/demo/providers/emp-1"]',
    );
    expect(profileLink).not.toBeNull();
    expect(profileLink?.textContent).toContain('Gevorg Gasparyan');

    const anyBtn = container.querySelector(
      'button.consumer-provider-list__row-button[type="button"]',
    );
    expect(anyBtn).not.toBeNull();
    expect(anyBtn?.textContent).toContain(CONSUMER_COPY_EN.anySpecialist);

    act(() => {
      anyBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onAnySpecialist).toHaveBeenCalledTimes(1);

    const slotBtn = Array.from(container.querySelectorAll('button')).find((el) =>
      (el.textContent ?? '').match(/\d/),
    );
    expect(slotBtn).toBeTruthy();
  });
});
