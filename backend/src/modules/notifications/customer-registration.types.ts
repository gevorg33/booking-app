export type CustomerRegistrationSource = 'dashboard' | 'web_booking' | 'app';

export interface CustomerRegisteredEventPayload {
  businessId: string;
  customerId: string;
  source: CustomerRegistrationSource;
}

export const CUSTOMER_REGISTERED_EVENT = 'customer.registered';

export function formatCustomerRegistrationSourceLabel(source: CustomerRegistrationSource): string {
  switch (source) {
    case 'web_booking':
      return 'Web booking';
    case 'app':
      return 'Customer app / Google sign-in';
    default:
      return 'Dashboard';
  }
}
