import { PrepaymentMode } from '../service/entities/service.entity.js';
import { handleConfigureServiceDepositPolicyLogic } from './ai-service-deposit-policy.logic.js';

describe('ai-service-deposit-policy.logic', () => {
  it('updates scoped services with deposit prepayment', async () => {
    const services = [
      {
        id: 'svc-1',
        businessId: 'biz-1',
        name: 'Premium Cut',
        price: 100,
        metadata: { serviceTier: 'premium' },
        isActive: true,
      },
      {
        id: 'svc-2',
        businessId: 'biz-1',
        name: 'Standard Cut',
        price: 50,
        metadata: { serviceTier: 'standard' },
        isActive: true,
      },
    ] as any[];

    const update = jest.fn(
      async (id: string, dto: Record<string, unknown>) => ({
        id,
        name: services.find((s) => s.id === id)!.name,
        prepaymentMode: dto.prepaymentMode,
        depositAmount: dto.depositAmount ?? null,
      }),
    );

    const result = await handleConfigureServiceDepositPolicyLogic(
      {
        serviceService: { update } as any,
      } as any,
      'biz-1',
      {},
      'Set 30% deposit on premium tier services',
      services,
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_service_deposit_policy');
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      'svc-1',
      expect.objectContaining({ prepaymentMode: PrepaymentMode.DEPOSIT }),
      undefined,
    );
  });

  it('returns clarify when no matching services', async () => {
    const result = await handleConfigureServiceDepositPolicyLogic(
      { serviceService: { update: jest.fn() } as any } as any,
      'biz-1',
      {},
      'Set 30% deposit on premium tier services',
      [
        {
          id: 'svc-1',
          businessId: 'biz-1',
          name: 'Standard Cut',
          price: 50,
          metadata: { serviceTier: 'standard' },
          isActive: true,
        },
      ] as any[],
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('No matching services');
  });

  it('returns clarify when scope is missing', async () => {
    const result = await handleConfigureServiceDepositPolicyLogic(
      { serviceService: { update: jest.fn() } as any } as any,
      'biz-1',
      { depositPercent: 30 },
      'Set 30% deposit',
      [],
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns clarify when parse fails', async () => {
    const result = await handleConfigureServiceDepositPolicyLogic(
      { serviceService: { update: jest.fn() } as any } as any,
      'biz-1',
      {},
      'hello world',
      [],
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('surfaces service update errors', async () => {
    const services = [
      {
        id: 'svc-1',
        businessId: 'biz-1',
        name: 'Featured Facial',
        price: 80,
        metadata: { isFeatured: true },
        isActive: true,
      },
    ] as any[];

    const result = await handleConfigureServiceDepositPolicyLogic(
      {
        serviceService: {
          update: jest.fn(async () => {
            throw new Error('Stripe Connect required');
          }),
        } as any,
      } as any,
      'biz-1',
      {},
      'Require $25 deposit on featured services',
      services,
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Stripe Connect required');
  });
});
