/** @vitest-environment happy-dom */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import type { PublicProvider } from '../lib/types.js';
import { ConsumerActionButton } from './ConsumerActionButton.js';
import { ConsumerFixedActionBar } from './ConsumerFixedActionBar.js';
import { ConsumerProviderList } from './ConsumerProviderList.js';
import {
  E2E4_CSS_MARKERS,
  E2E4_NATIVE_CTA_SELECTORS,
  E2E4_UNIT_CASES,
} from './e2e4-button-role.fixtures.js';

const provider: PublicProvider = {
  id: 'emp-1',
  name: 'Gevorg Gasparyan',
  role: 'Massage therapist',
  slots: [{ startTime: '2026-07-20T09:00:00.000Z', endTime: '2026-07-20T09:30:00.000Z' }],
  averageRating: 3.5,
  reviewCount: 6,
};

describe('e2e-bug.4 button-role fixtures', () => {
  it('documents every unit + selector scenario id', () => {
    expect(E2E4_UNIT_CASES.map((c) => c.id)).toEqual([
      'action-button-native-role',
      'fixed-action-bar-native-cta',
      'provider-profile-light-dom-link',
      'any-specialist-light-dom-button',
      'css-markers-present',
    ]);
    expect(E2E4_NATIVE_CTA_SELECTORS.length).toBeGreaterThanOrEqual(4);
  });
});

describe('e2e-bug.4 native CTA roles', () => {
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

  it('action-button-native-role: ConsumerActionButton is light-DOM button', () => {
    const onClick = vi.fn();
    act(() => {
      root.render(
        <ConsumerActionButton expand="block" onClick={onClick}>
          Confirm booking
        </ConsumerActionButton>,
      );
    });
    const button = container.querySelector(E2E4_NATIVE_CTA_SELECTORS[0]);
    expect(button).not.toBeNull();
    expect(button?.closest('ion-button')).toBeNull();
    expect(button?.getAttribute('role')).toBeNull();
    expect(button?.textContent).toContain('Confirm booking');
    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fixed-action-bar-native-cta: fixed bar uses native button', () => {
    act(() => {
      root.render(
        <ConsumerFixedActionBar
          label="Continue with selected services"
          primaryColor="#4361ee"
          onClick={() => undefined}
        />,
      );
    });
    const button = container.querySelector(E2E4_NATIVE_CTA_SELECTORS[1]);
    expect(button).not.toBeNull();
    expect(button?.closest('ion-button')).toBeNull();
    expect(button?.textContent).toBe('Continue with selected services');
  });

  it('provider-profile-light-dom-link + any-specialist-light-dom-button', () => {
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
    const profileLink = container.querySelector(E2E4_NATIVE_CTA_SELECTORS[2]);
    expect(profileLink).not.toBeNull();
    expect(profileLink?.tagName).toBe('A');
    expect(profileLink?.closest('ion-item')).toBeNull();
    expect(profileLink?.getAttribute('href')).toBe('/s/demo/providers/emp-1');

    const anyBtn = container.querySelector(E2E4_NATIVE_CTA_SELECTORS[3]);
    expect(anyBtn).not.toBeNull();
    expect(anyBtn?.closest('ion-item')).toBeNull();
    act(() => {
      anyBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onAnySpecialist).toHaveBeenCalledTimes(1);
  });

  it('css-markers-present: variables.css keeps e2e-bug.4 rules', () => {
    const css = readFileSync(
      resolve(__dirname, '../theme/variables.css'),
      'utf8',
    );
    for (const marker of E2E4_CSS_MARKERS) {
      expect(css).toContain(marker);
    }
    expect(css).toContain('e2e-bug.4');
  });

  it.each(
    E2E4_UNIT_CASES.map((c) => [c.id, c.description] as const),
  )('fixture case registered: %s — %s', (id) => {
    expect(typeof id).toBe('string');
  });
});
