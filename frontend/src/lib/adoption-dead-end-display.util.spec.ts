import { describe, expect, it } from 'vitest';
import {
  formatDeadEndDropRate,
  readQualifiedInstallDeadEndAudit,
} from './adoption-dead-end-display.util.js';

describe('adoption-dead-end-display.util (n99-3.6)', () => {
  it('formats drop rates', () => {
    expect(formatDeadEndDropRate(0.015)).toBe('1.5%');
  });

  it('defaults missing audit to passed', () => {
    expect(readQualifiedInstallDeadEndAudit(undefined).passed).toBe(true);
  });
});
