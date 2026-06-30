import { CONFIGURE_PACKAGE_ONLINE_PAYMENT_PROMPTS } from './ai-configure-package-online-payment.fixtures.js';
import { handleConfigurePackageOnlinePaymentLogic } from './ai-configure-package-online-payment.logic.js';
import { rescueCatalogIntent } from './ai-catalog.util.js';

describe('configure_package_online_payment AI scenarios', () => {
  const services = [
    {
      id: 'svc-massage',
      businessId: 'biz-1',
      name: 'Massage',
      price: 80,
      isActive: true,
      prepaymentMode: 'none',
      depositAmount: null,
    },
  ];

  const packagesService = {
    listPackages: jest.fn(async () => [
      {
        id: 'pkg-spa',
        name: 'Spa Day',
        isActive: true,
        items: [{ serviceId: 'svc-massage', service: { id: 'svc-massage' } }],
      },
    ]),
  };

  const serviceService = {
    update: jest.fn(async (id: string, dto: Record<string, unknown>) => ({
      id,
      name: 'Massage',
      prepaymentMode: dto.prepaymentMode,
      depositAmount: dto.depositAmount ?? null,
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(CONFIGURE_PACKAGE_ONLINE_PAYMENT_PROMPTS.slice(0, 4))(
    'rescues dashboard prompt $id via catalog rescue',
    ({ prompt }) => {
      expect(rescueCatalogIntent(prompt, 'unknown')?.action).toBe(
        'configure_package_online_payment',
      );
    },
  );

  it('disambiguates package payment from service online payment', () => {
    expect(
      rescueCatalogIntent('Require 50% online prepayment for Spa Day package', 'unknown')
        ?.action,
    ).toBe('configure_package_online_payment');
    expect(
      rescueCatalogIntent(
        'Accept online payment on public booking for all services with 50% prepayment',
        'unknown',
      )?.action,
    ).not.toBe('configure_package_online_payment');
  });

  it('executes configure_package_online_payment handler', async () => {
    const result = await handleConfigurePackageOnlinePaymentLogic(
      { packagesService, serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Require 50% online prepayment for Spa Day package',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_package_online_payment');
    expect(serviceService.update).toHaveBeenCalled();
  });
});
