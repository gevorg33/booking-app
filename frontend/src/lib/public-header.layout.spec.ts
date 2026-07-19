import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PublicHeader layout (e2e-bug.57)', () => {
  const src = readFileSync(
    path.resolve(__dirname, '../components/public-booking/public-header.tsx'),
    'utf8',
  );

  it('constrains the business-name column so truncate engages beside actions', () => {
    expect(src).toContain('min-w-0 flex-1 overflow-hidden');
    expect(src).toContain(
      'flex min-w-0 max-w-full items-center gap-1 font-semibold',
    );
    expect(src).toContain('min-w-0 truncate');
    // inline-flex on the name link sized to content and overlapped gift-cards
    expect(src).not.toContain(
      'inline-flex items-center gap-1 font-semibold text-gray-900',
    );
  });

  it('hides gift-cards label under sm so the action cluster stays compact', () => {
    expect(src).toContain('hidden sm:inline');
    expect(src).toContain('aria-label={giftCardsNavLabel}');
  });
});
