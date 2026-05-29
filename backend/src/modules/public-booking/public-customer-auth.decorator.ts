import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

export { CurrentUser };

export type PublicCustomerRequestUser = {
  customerId: string;
  email: string;
  businessId: string;
  customer: import('../customer/entities/customer.entity.js').Customer;
};

export const CurrentPublicCustomer = () => CurrentUser();
