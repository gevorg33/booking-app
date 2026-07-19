import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { translate } from '@shared-i18n/translate';
import { getMessages } from '../i18n/catalog';

const pageSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'AcceptInvitePage.tsx'),
  'utf8',
);

describe('AcceptInvitePage i18n (e2e-bug.72)', () => {
  it('wires last-name label through auth.lastName like first name', () => {
    expect(pageSource).toContain("t('auth.firstName')");
    expect(pageSource).toContain("t('auth.lastName')");
    expect(pageSource).not.toMatch(/>\s*Last name\s*</);
  });

  it('has auth.lastName localized in en/hy/ru catalogs', () => {
    expect(translate(getMessages('en'), 'auth.lastName')).toMatch(/last name/i);
    expect(translate(getMessages('hy'), 'auth.lastName')).toBe('Ազգանուն');
    expect(translate(getMessages('ru'), 'auth.lastName')).toBe('Фамилия');
  });
});
