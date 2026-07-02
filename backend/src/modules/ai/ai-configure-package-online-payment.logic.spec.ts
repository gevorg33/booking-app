import { PrepaymentMode } from '../service/entities/service.entity.js';
import { handleConfigurePackageOnlinePaymentLogic } from './ai-configure-package-online-payment.logic.js';

describe('ai-configure-package-online-payment.logic', () => {
  const services = [
    {
      id: 'svc-massage',
      businessId: 'biz-1',
      name: 'Massage',
      price: 80,
      isActive: true,
      prepaymentMode: PrepaymentMode.NONE,
      depositAmount: null,
    },
    {
      id: 'svc-facial',
      businessId: 'biz-1',
      name: 'Facial',
      price: 60,
      isActive: true,
      prepaymentMode: PrepaymentMode.NONE,
      depositAmount: null,
    },
  ];

  const packages = [
    {
      id: 'pkg-spa',
      name: 'Spa Day',
      isActive: true,
      items: [
        { serviceId: 'svc-massage', service: { id: 'svc-massage' } },
        { serviceId: 'svc-facial', service: { id: 'svc-facial' } },
      ],
    },
  ];

  const packagesService = {
    listPackages: jest.fn(async () => packages),
  };

  const serviceService = {
    update: jest.fn(async (id: string, dto: Record<string, unknown>) => {
      const service = services.find((entry) => entry.id === id)!;
      return {
        ...service,
        prepaymentMode: dto.prepaymentMode ?? service.prepaymentMode,
        depositAmount: dto.depositAmount ?? service.depositAmount,
      };
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates services in a named package', async () => {
    const result = await handleConfigurePackageOnlinePaymentLogic(
      { packagesService, serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Require 50% online prepayment for Spa Day package',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_package_online_payment');
    expect(serviceService.update).toHaveBeenCalledTimes(2);
    expect(result.summary).toContain('Spa Day');
  });

  it('disables online payment for package services', async () => {
    const result = await handleConfigurePackageOnlinePaymentLogic(
      { packagesService, serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Disable online payment for Spa Day package',
    );
    expect(result.success).toBe(true);
    expect(serviceService.update).toHaveBeenCalledWith(
      'svc-massage',
      { prepaymentMode: PrepaymentMode.NONE },
      undefined,
    );
  });

  it('returns clarify when package name is missing', async () => {
    const result = await handleConfigurePackageOnlinePaymentLogic(
      { packagesService, serviceService } as any,
      'biz-1',
      { prepaymentMode: 'full' },
      services as any,
      'Enable online payment',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns failure when package is not found', async () => {
    const result = await handleConfigurePackageOnlinePaymentLogic(
      { packagesService, serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Require online prepayment for Missing package',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('No matching');
  });

  it('updates all packages when allPackages is set', async () => {
    packagesService.listPackages.mockResolvedValueOnce([
      ...packages,
      {
        id: 'pkg-glow',
        name: 'Glow',
        isActive: true,
        items: [{ serviceId: 'svc-massage', service: { id: 'svc-massage' } }],
      },
    ]);
    const result = await handleConfigurePackageOnlinePaymentLogic(
      { packagesService, serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Accept online prepayment on all packages with 50% deposit',
    );
    expect(result.success).toBe(true);
    expect(result.details?.packageCount).toBe(2);
  });

  it('returns failure when package has no linked services', async () => {
    packagesService.listPackages.mockResolvedValueOnce([
      {
        id: 'pkg-empty',
        name: 'Empty',
        isActive: true,
        items: [],
      },
    ]);
    const result = await handleConfigurePackageOnlinePaymentLogic(
      { packagesService, serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Enable online payment for Empty package',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('no linked services');
  });

  it('surfaces service update errors', async () => {
    serviceService.update.mockRejectedValueOnce(
      new Error('Stripe not connected'),
    );
    const result = await handleConfigurePackageOnlinePaymentLogic(
      { packagesService, serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Enable full online payment for Spa Day package',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Stripe not connected');
  });
});
