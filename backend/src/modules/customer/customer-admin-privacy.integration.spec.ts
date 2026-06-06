import { CustomerController } from './customer.controller.js';
import { CustomerService } from './customer.service.js';
import { CustomerPrivacyService } from './customer-privacy.service.js';

describe('Sprint 37 — customer admin privacy integration', () => {
  const customerService = {
    searchDashboard: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    getDetail: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const customerPrivacyService = {
    exportCustomerData: jest.fn(async () => ({
      exportedAt: '2026-06-01T00:00:00.000Z',
      customer: { id: 'cust-1', name: 'Jane' },
      bookings: [],
    })),
    deleteCustomerData: jest.fn(async () => ({ deleted: true as const })),
  };

  const controller = new CustomerController(
    customerService as unknown as CustomerService,
    customerPrivacyService as unknown as CustomerPrivacyService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin exportCustomerData delegates to CustomerPrivacyService', async () => {
    const result = await controller.exportCustomerData('biz-1', 'cust-1');

    expect(customerPrivacyService.exportCustomerData).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
    );
    expect(result).toMatchObject({ customer: { id: 'cust-1' } });
  });

  it('admin deleteCustomerData delegates to CustomerPrivacyService', async () => {
    const result = await controller.deleteCustomerData('biz-1', 'cust-1');

    expect(customerPrivacyService.deleteCustomerData).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
    );
    expect(result).toEqual({ deleted: true });
  });
});
