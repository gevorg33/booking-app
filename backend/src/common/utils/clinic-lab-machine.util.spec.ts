import {
  isValidClinicLabMachineName,
  normalizeClinicLabMachineName,
} from './clinic-lab-machine.util.js';

describe('clinic-lab-machine.util', () => {
  it('normalizes machine names', () => {
    expect(normalizeClinicLabMachineName('  Analyzer   A ')).toBe('Analyzer A');
  });

  it('validates machine names', () => {
    expect(isValidClinicLabMachineName('Analyzer A')).toBe(true);
    expect(isValidClinicLabMachineName('')).toBe(false);
  });
});
