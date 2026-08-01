import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { E2E2_CLASS_DEPENDENT_SELECTORS } from '../hooks/e2e2-salon-tab-active.fixtures.js';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'variables.css'),
  'utf8',
);

describe('variables.css desktop shell (e2e-bug.55)', () => {
  it('defines a tablet/desktop max-width shell so mobile layout does not stretch', () => {
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('--consumer-desktop-shell-max: 32rem');
    expect(css).toMatch(/ion-app\s*\{[^}]*max-width:\s*var\(--consumer-desktop-shell-max\)/s);
    expect(css).toMatch(/ion-app\s*\{[^}]*margin-inline:\s*auto/s);
  });

  it('pins fixed tab/action bars to the same shell width', () => {
    const desktopBlock =
      css.match(/@media \(min-width: 768px\)\s*\{[\s\S]*\}\s*$/)?.[0] ?? '';
    expect(desktopBlock).toContain('.salon-bottom-tab-bar');
    expect(desktopBlock).toContain('.consumer-fixed-action-bar');
    expect(desktopBlock).toContain(
      'max-width: var(--consumer-desktop-shell-max)',
    );
  });

  it('uses brand primary for CTA hover and calendar selection', () => {
    expect(css).toContain('.consumer-action-button--solid:hover:not(:disabled)');
    expect(css).toContain('.consumer-fixed-action-bar__button:hover:not(:disabled)');
    expect(css).toContain('.consumer-booking-datetime::part(calendar-day active)');
    expect(css).toContain('.consumer-ai-fab');
    expect(css).toContain('rgba(var(--ion-color-primary-rgb), 0.16)');
  });

  it('keeps solid ion-button label contrast on hover (no brand-colored text)', () => {
    const solidBlock =
      css.match(
        /ion-button\[fill='solid'\]\[color='primary'\]\s*\{[\s\S]*?\}/,
      )?.[0] ?? '';
    expect(solidBlock).toContain('--color-hover: #ffffff');
    expect(solidBlock).not.toContain('--color-hover: rgba(var(--ion-color-primary-rgb)');
  });
});

describe('variables.css salon-tab-active offsets (e2e-bug.2)', () => {
  it.each(E2E2_CLASS_DEPENDENT_SELECTORS.map((sel) => [sel] as const))(
    'defines offset rule for %s',
    (selector) => {
      expect(css).toContain(selector);
    },
  );

  it('raises fixed action bar above the tab bar only when salon-tab-active', () => {
    expect(css).toContain(
      'body.salon-tab-active .consumer-fixed-action-bar',
    );
    expect(css).toContain('bottom: var(--consumer-tab-bar-total-height)');
  });
});
