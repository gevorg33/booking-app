import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { translate } from '@shared-i18n/translate';
import en from '@shared-i18n/messages/en';
import hy from '@shared-i18n/messages/hy';
import ru from '@shared-i18n/messages/ru';
import {
  PROVIDER_ADOPTION_A11Y_SURFACES,
  PROVIDER_ADOPTION_I18N_KEYS,
  PROVIDER_ADOPTION_GATE_COPY_FIELDS,
} from './mobile-adoption-surfaces.fixtures';
import { getAppVersionGateCopy } from './app-version-gate-copy.util';

describe('mobile-adoption-surfaces (adopt-5.6)', () => {
  it('covers EN/HY/RU provider adoption i18n keys', () => {
    for (const key of PROVIDER_ADOPTION_I18N_KEYS) {
      expect(translate(en, key).trim(), `en:${key}`).toBeTruthy();
      expect(translate(hy, key).trim(), `hy:${key}`).toBeTruthy();
      expect(translate(ru, key).trim(), `ru:${key}`).toBeTruthy();
    }
  });

  it('covers EN/HY/RU app version gate copy fields', () => {
    for (const field of PROVIDER_ADOPTION_GATE_COPY_FIELDS) {
      expect(getAppVersionGateCopy('en')[field]?.trim(), `en:${field}`).toBeTruthy();
      expect(getAppVersionGateCopy('hy')[field]?.trim(), `hy:${field}`).toBeTruthy();
      expect(getAppVersionGateCopy('ru')[field]?.trim(), `ru:${field}`).toBeTruthy();
    }
  });
});

describe('mobile-a11y-adoption (adopt-5.6)', () => {
  const root = path.resolve(import.meta.dirname, '..');

  it.each(PROVIDER_ADOPTION_A11Y_SURFACES)(
    '$file exposes accessibility hooks',
    ({ file, needles }) => {
      const source = fs.readFileSync(path.join(root, file), 'utf8');
      for (const needle of needles) {
        expect(source).toContain(needle);
      }
    },
  );

  it('loads adoption a11y stylesheet', () => {
    expect(fs.existsSync(path.join(root, 'theme/adoption-a11y.css'))).toBe(true);
    expect(fs.readFileSync(path.join(root, 'main.tsx'), 'utf8')).toContain('adoption-a11y.css');
  });
});
