import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  CONSUMER_ADOPTION_A11Y_SURFACES,
  CONSUMER_ADOPTION_COPY_KEYS,
} from './mobile-adoption-surfaces.fixtures.js';
import {
  CONSUMER_COPY_EN,
  CONSUMER_COPY_HY,
  CONSUMER_COPY_RU,
} from './consumer-copy-catalog.js';

describe('mobile-adoption-surfaces (adopt-5.6)', () => {
  it('covers EN/HY/RU copy on every adoption surface key', () => {
    for (const key of CONSUMER_ADOPTION_COPY_KEYS) {
      expect(CONSUMER_COPY_EN[key]?.trim(), `en:${key}`).toBeTruthy();
      expect(CONSUMER_COPY_HY[key]?.trim(), `hy:${key}`).toBeTruthy();
      expect(CONSUMER_COPY_RU[key]?.trim(), `ru:${key}`).toBeTruthy();
    }
  });
});

describe('mobile-a11y-adoption (adopt-5.6)', () => {
  const root = path.resolve(import.meta.dirname, '..');

  it.each(CONSUMER_ADOPTION_A11Y_SURFACES)(
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
