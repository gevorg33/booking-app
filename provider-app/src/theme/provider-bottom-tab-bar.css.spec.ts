import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'variables.css'),
  'utf8',
);

describe('provider-bottom-tab-bar CSS (e2e-bug.65)', () => {
  it('tab bar is horizontally scrollable instead of clipping overflow', () => {
    const barBlock = css.match(/\.provider-bottom-tab-bar\s*\{[^}]+\}/)?.[0] ?? '';
    expect(barBlock).toMatch(/overflow-x:\s*auto/);
    expect(barBlock).toContain('-webkit-overflow-scrolling');
  });

  it('tab buttons keep a usable min-width and do not force-shrink below content', () => {
    const btnBlock = css.match(/\.provider-tab-btn\s*\{[^}]+\}/)?.[0] ?? '';
    expect(btnBlock).toMatch(/min-width:\s*3\.25rem/);
    expect(btnBlock).toMatch(/flex:\s*1\s+0\s+auto/);
  });
});
