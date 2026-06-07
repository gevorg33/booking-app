import { formatExternalDoctorAddress } from './external-doctor-address.util.js';

describe('external-doctor-address.util', () => {
  it('formats unit, street, and locality like Pollin EMR', () => {
    expect(
      formatExternalDoctorAddress({
        unit: 'Suite 200',
        street: '123 Main St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 1A1',
        country: 'Canada',
      }),
    ).toBe('Suite 200 123 Main St, Toronto, ON, M5V 1A1, Canada');
  });

  it('omits empty unit segment', () => {
    expect(
      formatExternalDoctorAddress({
        street: '456 Oak Ave',
        city: 'Boston',
        province: 'MA',
        postalCode: '02108',
        country: 'USA',
      }),
    ).toBe('456 Oak Ave, Boston, MA, 02108, USA');
  });
});
