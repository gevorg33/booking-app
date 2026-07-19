import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'provider-guide.css'),
  'utf8',
);

describe('provider-guide.css (e2e-bug.68)', () => {
  it('TOC surface uses dark-theme card/item background, not --ion-color-light', () => {
    const tocBlock = css.match(/\.provider-guide-toc\s*\{[^}]+\}/)?.[0] ?? '';
    expect(tocBlock).toContain('--ion-card-background');
    expect(tocBlock).not.toMatch(/background:\s*var\(--ion-color-light/);
  });

  it('section dividers avoid unthemed --ion-color-light-shade', () => {
    const sectionBlock =
      css.match(/\.provider-guide-section\s*\{[^}]+\}/)?.[0] ?? '';
    expect(sectionBlock).not.toMatch(/--ion-color-light-shade/);
  });
});
