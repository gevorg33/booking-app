/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsumerActionButton } from './ConsumerActionButton.js';
import { ConsumerFixedActionBar } from './ConsumerFixedActionBar.js';

describe('ConsumerActionButton (e2e-bug.4)', () => {
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

  it('exposes a native button role and name', () => {
    const onClick = vi.fn();
    act(() => {
      root.render(
        <ConsumerActionButton expand="block" onClick={onClick}>
          Confirm booking
        </ConsumerActionButton>,
      );
    });

    const button = container.querySelector('button[type="button"]');
    expect(button).not.toBeNull();
    expect(button?.getAttribute('role')).toBeNull(); // implicit button role from native element
    expect(button?.textContent).toContain('Confirm booking');
    expect(button?.tagName).toBe('BUTTON');

    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fixed action bar uses a native button for the CTA label', () => {
    act(() => {
      root.render(
        <ConsumerFixedActionBar
          label="Continue with selected services"
          primaryColor="#4361ee"
          onClick={() => undefined}
        />,
      );
    });

    const button = container.querySelector(
      'button.consumer-fixed-action-bar__button[type="button"]',
    );
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Continue with selected services');
    expect(
      (button as HTMLButtonElement).style.getPropertyValue('--consumer-action-button-color'),
    ).toBe('#4361ee');
    expect(document.body.classList.contains('consumer-fixed-action-active')).toBe(true);

    act(() => root.unmount());
    expect(document.body.classList.contains('consumer-fixed-action-active')).toBe(false);
    // afterEach also unmounts; recreate root so cleanup stays safe
    root = createRoot(container);
  });
});
