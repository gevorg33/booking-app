import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI retail cart bulk replace + alias normalization (ai-cmd-provider-6.6)', () => {
  const businessId = 'biz-66';
  const userId = 'user-66';
  const employeeId = 'emp-66';
  const bookingId = 'bk-66';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock<any> };
  let providerExp3: { handleIntent: jest.Mock<any> };

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  beforeEach(() => {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(),
    };
    providerExp3 = {
      handleIntent: jest.fn(async (_biz, _user, action) => ({
        success: true,
        action,
        summary: `${action} ok`,
        details: { bookingId },
      })),
    };
    service = createProviderAiCommandHarness({
      llm,
      providerMobile: {
        resolveMobileAccess: jest.fn(async () => staffAccess),
        getScopedEmployeeId: jest.fn(() => employeeId),
      },
      providerExp3,
    });
  });

  function mockIntent(action: string, params: Record<string, unknown>) {
    llm.completeJson.mockResolvedValue({ action, params, reasoning: 'test' });
  }

  it('dispatches set_retail_sales_lines to providerExp3 with bookingId and lines', async () => {
    mockIntent('set_retail_sales_lines', {
      bookingId,
      lines: [{ productName: 'Shampoo', quantity: 2 }],
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Set retail cart to 2 shampoo',
      [],
    );

    expect(result.action).toBe('set_retail_sales_lines');
    expect(providerExp3.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'set_retail_sales_lines',
      expect.objectContaining({ bookingId }),
      'Set retail cart to 2 shampoo',
      undefined,
      employeeId,
    );
  });

  it('normalizes the dashboard-style add_retail_to_my_booking alias to add_retail_to_booking on the provider surface', async () => {
    mockIntent('add_retail_to_my_booking', {
      bookingId,
      productName: 'Shampoo',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Add shampoo to my booking',
      [],
    );

    expect(result.action).toBe('add_retail_to_booking');
    expect(providerExp3.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'add_retail_to_booking',
      expect.anything(),
      'Add shampoo to my booking',
      undefined,
      employeeId,
    );
  });

  it('retail_cart_replace compound: sets cart lines then marks the booking paid in one prompt', async () => {
    let providerBooking: { handleMarkPaid: jest.Mock<any> };
    providerBooking = {
      handleMarkPaid: jest.fn(async () => ({
        success: true,
        action: 'mark_paid',
        summary: 'Marked paid',
        details: { bookingId },
      })),
    };
    service = createProviderAiCommandHarness({
      llm,
      providerMobile: {
        resolveMobileAccess: jest.fn(async () => staffAccess),
        getScopedEmployeeId: jest.fn(() => employeeId),
      },
      providerExp3,
      providerBooking: providerBooking as any,
    });
    mockIntent('unknown', {});

    const result = await service.executeCommand(
      businessId,
      userId,
      'Set retail cart to 2 shampoo and mark it paid',
      [],
      { bookingId },
    );

    expect(result.action).toBe('compound_intent');
    expect(providerExp3.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'set_retail_sales_lines',
      expect.objectContaining({ bookingId }),
      expect.stringContaining('Set retail cart to 2 shampoo'),
      expect.anything(),
      employeeId,
    );
    expect(providerBooking.handleMarkPaid).toHaveBeenCalled();
  });
});
