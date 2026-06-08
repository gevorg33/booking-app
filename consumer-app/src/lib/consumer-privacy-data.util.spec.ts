import { describe, expect, it } from 'vitest';
import { buildCustomerDataExportFilename } from './consumer-privacy-data.util.js';

describe('consumer-privacy-data.util', () => {
  it('builds export filename from slug', () => {
    expect(buildCustomerDataExportFilename('glow-salon')).toBe('my-data-glow-salon.json');
  });
});
