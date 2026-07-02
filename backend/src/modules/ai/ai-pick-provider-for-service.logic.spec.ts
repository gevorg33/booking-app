import {
  buildPickProviderForServiceSummary,
  handlePickProviderForServiceLogic,
} from './ai-pick-provider-for-service.logic.js';
import { PICK_PROVIDER_FOR_SERVICE_PROMPTS } from './ai-pick-provider-for-service.fixtures.js';

describe('ai-pick-provider-for-service.logic (ai-cmd-customer-4.11.2)', () => {
  const employees = [
    { id: 'emp-anna', name: 'Anna', businessId: 'biz-1', isActive: true },
    { id: 'emp-maria', name: 'Maria', businessId: 'biz-1', isActive: true },
  ];
  const services = [
    { id: 'svc-color', name: 'Color', businessId: 'biz-1', isActive: true },
    {
      id: 'svc-highlights',
      name: 'Highlights',
      businessId: 'biz-1',
      isActive: true,
    },
  ];
  const employeeRepo = {
    find: jest.fn(async () => employees),
  };
  const serviceRepo = {
    find: jest.fn(async () => services),
  };
  const publicCustomerAuthService = {
    listBookings: jest.fn(async () => ({
      bookings: [
        {
          id: 'book-1',
          status: 'completed',
          startTime: '2026-06-01T10:00:00.000Z',
          employeeId: 'emp-anna',
          employeeName: 'Anna',
          serviceId: 'svc-color',
          serviceName: 'Color',
        },
      ],
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('selects named provider and service with navigate query', async () => {
    const result = await handlePickProviderForServiceLogic(
      { employeeRepo, serviceRepo, publicCustomerAuthService },
      'biz-1',
      {},
      'Book with Anna for color',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('pick_provider_for_service');
    expect(result.details).toMatchObject({
      mode: 'named_provider',
      employeeId: 'emp-anna',
      serviceId: 'svc-color',
      navigate: {
        path: 'booking',
        query: {
          employeeId: 'emp-anna',
          serviceId: 'svc-color',
        },
      },
    });
  });

  it('selects stylist from last visit when signed in', async () => {
    const result = await handlePickProviderForServiceLogic(
      { employeeRepo, serviceRepo, publicCustomerAuthService },
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'salon' },
      'I want the same stylist as last time',
    );
    expect(result.success).toBe(true);
    expect(result.details).toMatchObject({
      mode: 'same_as_last',
      employeeId: 'emp-anna',
      rebookHint: 'rebook_last_appointment',
    });
  });

  it('requires sign-in for same_as_last', async () => {
    const result = await handlePickProviderForServiceLogic(
      { employeeRepo, serviceRepo, publicCustomerAuthService },
      'biz-1',
      {},
      'Use my usual stylist',
    );
    expect(result.success).toBe(false);
    expect(result.details?.mode).toBe('same_as_last');
  });

  it('navigates to professionals when only provider is selected', async () => {
    const result = await handlePickProviderForServiceLogic(
      { employeeRepo, serviceRepo, publicCustomerAuthService },
      'biz-1',
      {},
      'I want Anna as my stylist',
    );
    expect(result.success).toBe(true);
    expect(result.details?.navigate).toMatchObject({
      path: 'professionals',
      query: { employeeId: 'emp-anna' },
    });
  });

  it('fails when no past visit exists for same_as_last', async () => {
    publicCustomerAuthService.listBookings.mockResolvedValueOnce({
      bookings: [],
    });
    const result = await handlePickProviderForServiceLogic(
      { employeeRepo, serviceRepo, publicCustomerAuthService },
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'salon' },
      'I want the same stylist as last time',
    );
    expect(result.success).toBe(false);
  });

  it('builds same_as_last summary', () => {
    expect(
      buildPickProviderForServiceSummary({
        mode: 'same_as_last',
        employeeName: 'Anna',
      }),
    ).toContain('last visit');
  });

  it('fails when slug is missing for same_as_last', async () => {
    const result = await handlePickProviderForServiceLogic(
      { employeeRepo, serviceRepo, publicCustomerAuthService },
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Use my usual stylist',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Business not found');
  });

  it('returns clarify when prompt does not parse', async () => {
    const result = await handlePickProviderForServiceLogic(
      { employeeRepo, serviceRepo, publicCustomerAuthService },
      'biz-1',
      {},
      'hello there',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('keeps unresolved service name when catalog has no match', async () => {
    const result = await handlePickProviderForServiceLogic(
      { employeeRepo, serviceRepo, publicCustomerAuthService },
      'biz-1',
      {},
      'Book with Anna for keratin',
    );
    expect(result.success).toBe(true);
    expect(result.details).toMatchObject({
      serviceName: 'keratin',
      navigate: { path: 'professionals' },
    });
  });

  it('fails when named provider is unknown', async () => {
    const result = await handlePickProviderForServiceLogic(
      { employeeRepo, serviceRepo, publicCustomerAuthService },
      'biz-1',
      {},
      'Book with Zoe for color',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain("couldn't find");
  });

  it.each(
    PICK_PROVIDER_FOR_SERVICE_PROMPTS.filter(
      (row) => row.mode === 'named_provider',
    ),
  )(
    'builds summary for named provider $id',
    ({ providerName, serviceName }) => {
      const summary = buildPickProviderForServiceSummary({
        mode: 'named_provider',
        employeeName: providerName ?? 'Anna',
        serviceName: serviceName ?? null,
      });
      expect(summary).toContain(providerName ?? 'Anna');
    },
  );
});
