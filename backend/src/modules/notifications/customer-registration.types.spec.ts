import { formatCustomerRegistrationSourceLabel } from './customer-registration.types.js';

describe('customer-registration.types', () => {
  it('labels registration sources', () => {
    expect(formatCustomerRegistrationSourceLabel('web_booking')).toBe(
      'Web booking',
    );
    expect(formatCustomerRegistrationSourceLabel('app')).toContain('Google');
    expect(formatCustomerRegistrationSourceLabel('dashboard')).toBe(
      'Dashboard',
    );
  });
});
