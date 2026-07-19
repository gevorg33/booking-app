import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getMessages, translate, type AppLocale } from '@/i18n';
import {
  MULTI_SERVICE_AVAILABILITY_CATCH_I18N_KEYS,
  resolveMultiServiceAvailabilityCatchMessage,
} from './multi-service-availability-catch.util';

const LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

const BACKEND_ENGLISH_BLOCK_ERROR =
  'No available block found for the selected services';
const BACKEND_ENGLISH_LINE_ERROR = 'No available slot found for full body massage';

describe('multi-service availability catch i18n (e2e-bug.108 / e2e-bug.56)', () => {
  it.each(LOCALES)('resolves catch keys in %s', (locale) => {
    const messages = getMessages(locale);
    const t = (key: string) => translate(messages, key);
    for (const key of Object.values(MULTI_SERVICE_AVAILABILITY_CATCH_I18N_KEYS)) {
      const value = t(key);
      expect(value, `${locale}:${key}`).not.toBe(key);
      expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
    }
  });

  it('hy/ru never fall back to the backend English block error', () => {
    for (const locale of ['hy', 'ru'] as const) {
      const messages = getMessages(locale);
      const t = (key: string) => translate(messages, key);
      const findBlock = resolveMultiServiceAvailabilityCatchMessage(t, 'findBlock');
      const loadSlots = resolveMultiServiceAvailabilityCatchMessage(t, 'loadSlots');
      const suggestLines = resolveMultiServiceAvailabilityCatchMessage(t, 'suggestLines');
      expect(findBlock).not.toBe(BACKEND_ENGLISH_BLOCK_ERROR);
      expect(findBlock).not.toContain('No available block');
      expect(loadSlots).not.toContain('Could not load available times');
      expect(suggestLines).not.toContain('No available slot found');
    }
  });

  it('helper ignores thrown Error.message (never prefer it)', () => {
    const en = getMessages('en');
    const t = (key: string) => translate(en, key);
    const thrown = new Error(BACKEND_ENGLISH_BLOCK_ERROR);
    const resolved = resolveMultiServiceAvailabilityCatchMessage(t, 'findBlock');
    expect(resolved).not.toBe(thrown.message);
    expect(resolved).toBe(t('public.findAvailableBlockFailed'));
  });

  it('e2e-bug.56 — suggestLines never echoes backend line-slot English', () => {
    const en = getMessages('en');
    const t = (key: string) => translate(en, key);
    const resolved = resolveMultiServiceAvailabilityCatchMessage(t, 'suggestLines');
    expect(resolved).not.toBe(BACKEND_ENGLISH_LINE_ERROR);
    expect(resolved).toBe(t('public.suggestMultiServiceLinesFailed'));
  });

  it('availability + confirm clients use translated catch helpers only', () => {
    const availability = readFileSync(
      resolve(
        __dirname,
        '../components/public-booking/multi-service-availability-client.tsx',
      ),
      'utf8',
    );
    const confirm = readFileSync(
      resolve(
        __dirname,
        '../components/public-booking/multi-service-confirm-client.tsx',
      ),
      'utf8',
    );
    expect(availability).not.toMatch(/err(?:or)?(?:\s+as\s+Error)?\)?\.message\s*\|\|/);
    expect(confirm).not.toMatch(/err(?:or)?(?:\s+as\s+Error)?\)?\.message\s*\|\|/);
    expect(availability).toContain(
      "resolveMultiServiceAvailabilityCatchMessage(t, 'loadSlots')",
    );
    expect(availability).toContain(
      "resolveMultiServiceAvailabilityCatchMessage(t, 'findBlock')",
    );
    expect(confirm).toContain(
      "resolveMultiServiceAvailabilityCatchMessage(t, 'suggestLines')",
    );
    expect(confirm).toContain('public.multiServiceConfirmPerServiceHint');
    expect(confirm).not.toContain('public.packageScheduleEach');
  });
});
