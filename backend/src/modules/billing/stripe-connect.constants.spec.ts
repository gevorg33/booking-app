import { parseAllowedConnectCountries } from './stripe-connect.constants.js';

describe('parseAllowedConnectCountries', () => {
  it('parses env override', () => {
    expect(parseAllowedConnectCountries('AE, AM, US', 'AE')).toEqual(['AE', 'AM', 'US']);
  });

  it('falls back to platform defaults', () => {
    expect(parseAllowedConnectCountries(undefined, 'AE')).toEqual(['AE']);
  });
});
