import { canCustomerAccessReleasedDocument } from './patient-customer-document-access.util.js';

describe('patient-customer-document-access.util', () => {
  it('allows customers to read only their own released documents', () => {
    expect(
      canCustomerAccessReleasedDocument({
        customerId: 'cust-1',
        releasedToPatient: true,
        requestCustomerId: 'cust-1',
      }),
    ).toBe(true);
    expect(
      canCustomerAccessReleasedDocument({
        customerId: 'cust-1',
        releasedToPatient: false,
        requestCustomerId: 'cust-1',
      }),
    ).toBe(false);
    expect(
      canCustomerAccessReleasedDocument({
        customerId: 'cust-2',
        releasedToPatient: true,
        requestCustomerId: 'cust-1',
      }),
    ).toBe(false);
  });
});
