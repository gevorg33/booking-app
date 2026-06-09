import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { PROVIDER_A11Y_INTEGRATION_SURFACES } from './provider-a11y.fixtures';

describe('provider a11y integration (prov-exp-10.3)', () => {
  const root = path.resolve(import.meta.dirname, '..');

  it.each(PROVIDER_A11Y_INTEGRATION_SURFACES)(
    '$id exposes adoption accessibility hooks',
    ({ file, needles }) => {
      const source = fs.readFileSync(path.join(root, file), 'utf8');
      for (const needle of needles) {
        expect(source, `${file} missing ${needle}`).toContain(needle);
      }
    },
  );

  it('loads adoption a11y stylesheet from main entry', () => {
    expect(fs.existsSync(path.join(root, 'theme/adoption-a11y.css'))).toBe(true);
    expect(fs.readFileSync(path.join(root, 'main.tsx'), 'utf8')).toContain('adoption-a11y.css');
  });
});
