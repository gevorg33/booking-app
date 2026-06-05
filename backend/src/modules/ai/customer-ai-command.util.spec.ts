import {
  buildCustomerClassifierSchema,
  commandResultToPublicAssistantResult,
  isCustomerSurfaceIntent,
  isPublicOnlyAssistantAction,
  mergeCustomerCompoundContext,
  PUBLIC_ONLY_ASSISTANT_ACTIONS,
  publicAssistantResultToCommandResult,
} from './customer-ai-command.util.js';

describe('customer-ai-command.util', () => {
  it('detects public-only assistant actions', () => {
    for (const action of PUBLIC_ONLY_ASSISTANT_ACTIONS) {
      expect(isPublicOnlyAssistantAction(action)).toBe(true);
    }
    expect(isPublicOnlyAssistantAction('book_package')).toBe(false);
    expect(isPublicOnlyAssistantAction('not_real')).toBe(false);
  });

  it('detects customer surface intents including meta and public union', () => {
    expect(isCustomerSurfaceIntent('book_package')).toBe(true);
    expect(isCustomerSurfaceIntent('list_providers')).toBe(true);
    expect(isCustomerSurfaceIntent('create_booking')).toBe(false);
    expect(isCustomerSurfaceIntent('unknown')).toBe(true);
    expect(isCustomerSurfaceIntent('error')).toBe(true);
    expect(isCustomerSurfaceIntent('security_blocked')).toBe(true);
  });

  it('converts between public assistant and command results', () => {
    const command = publicAssistantResultToCommandResult({
      success: true,
      action: 'check_availability',
      summary: 'slots',
      sessionContext: { serviceName: 'Massage' },
      navigate: { path: 'checkout', query: { serviceId: 's1' } },
      bookingId: 'book-1',
    });
    expect(command.details?.sessionContext).toEqual({ serviceName: 'Massage' });
    expect(commandResultToPublicAssistantResult(command)).toEqual({
      success: true,
      action: 'check_availability',
      summary: 'slots',
      sessionContext: { serviceName: 'Massage' },
      navigate: { path: 'checkout', query: { serviceId: 's1' } },
      bookingId: 'book-1',
    });
  });

  it('maps command results with missing details to public assistant shape', () => {
    expect(
      commandResultToPublicAssistantResult({
        success: false,
        summary: 'nope',
      } as any),
    ).toEqual({
      success: false,
      action: 'unknown',
      summary: 'nope',
      sessionContext: undefined,
      navigate: undefined,
      bookingId: undefined,
    });
  });

  it('maps minimal command results to public assistant shape', () => {
    expect(
      commandResultToPublicAssistantResult({
        success: false,
        action: 'unknown',
        summary: 'nope',
        details: {},
      }),
    ).toEqual({
      success: false,
      action: 'unknown',
      summary: 'nope',
      sessionContext: undefined,
      navigate: undefined,
      bookingId: undefined,
    });
  });

  it('builds classifier schema with customer and public actions', () => {
    const schema = buildCustomerClassifierSchema();
    expect(schema).toContain('book_package');
    expect(schema).toContain('list_providers');
    expect(schema).toContain('unknown');
    expect(schema).toContain('check_providers_for_service');
    expect(schema).toContain('book_nearest_slot');
    expect(schema).toContain('bookingFirstAvailable');
    expect(schema).toContain('timeOfDay');
    expect(schema).toContain(
      "who's free tomorrow evening for permanent lashes",
    );
    expect(schema).not.toContain('pick the FIRST actionable intent');
  });

  it('merges compound context from sessionContext and detail keys', () => {
    const merged = mergeCustomerCompoundContext(
      { customerId: 'cust-1' },
      {
        success: true,
        action: 'add_services_to_cart',
        summary: 'ok',
        details: {
          cartServiceIds: ['s1'],
          sessionContext: { serviceName: 'Massage' },
          promoCode: 'SPRING25',
          manageUrl: 'https://example.com/manage',
        },
      },
    );
    expect(merged.cartServiceIds).toEqual(['s1']);
    expect(merged.serviceName).toBe('Massage');
    expect(merged.promoCode).toBe('SPRING25');
    expect(merged.manageUrl).toBe('https://example.com/manage');
  });

  it('merges compound context when details are absent', () => {
    expect(
      mergeCustomerCompoundContext(
        { customerId: 'cust-1' },
        {
          success: true,
          action: 'noop',
          summary: 'ok',
        },
      ),
    ).toEqual({ customerId: 'cust-1' });
  });

  it('skips non-object sessionContext when merging compound context', () => {
    expect(
      mergeCustomerCompoundContext(
        { customerId: 'cust-1' },
        {
          success: true,
          action: 'noop',
          summary: 'ok',
          details: { sessionContext: 'bad', bookingId: 'bk-1' },
        },
      ),
    ).toEqual({ customerId: 'cust-1', bookingId: 'bk-1' });
  });
});
