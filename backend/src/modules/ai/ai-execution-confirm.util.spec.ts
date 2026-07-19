import {
  buildExecutionConfirmationResult,
  DASHBOARD_EXECUTION_CONFIRM_ACTIONS,
  requiresDashboardExecutionConfirmation,
  sanitizeParamsForPreview,
} from './ai-execution-confirm.util.js';
import { PRODUCT_GUIDE_BULK_MUTATE_ACTIONS } from './ai-product-guide.util.js';

describe('ai-execution-confirm.util', () => {
  describe('e2e-bug.156 — no fabricated preview fields on catalog mutates', () => {
    it('strips customerName and schedule fields from update_service_prices preview', () => {
      const preview = sanitizeParamsForPreview(
        {
          serviceName: 'QA Confirm Test',
          amountChange: 5,
          customerName: 'Test User',
          templateName: 'Standard Mon-Fri',
          allProviders: false,
        },
        'update_service_prices',
      );
      expect(preview).toEqual({
        serviceName: 'QA Confirm Test',
        amountChange: 5,
      });
      expect(preview).not.toHaveProperty('customerName');
      expect(preview).not.toHaveProperty('templateName');
      expect(preview).not.toHaveProperty('allProviders');
    });

    it('strips employee/template fabrications from create_services preview', () => {
      const preview = sanitizeParamsForPreview(
        {
          serviceNames: ['QA Manicure', 'QA Pedicure', 'QA Waxing'],
          employeeName: 'Test User',
          templateName: 'Standard Mon-Fri',
          customerName: 'Test User',
        },
        'create_services',
      );
      expect(preview).toEqual({
        serviceNames: ['QA Manicure', 'QA Pedicure', 'QA Waxing'],
      });
    });

    it('builds confirmation summary from preview params only — not LLM reasoning', () => {
      const result = buildExecutionConfirmationResult(
        'update_service_prices',
        'Raise QA Confirm Test by $5 for Test User using the Standard Mon-Fri template',
        'Increase the price of the QA Confirm Test service by 5 dollars',
        {
          serviceName: 'QA Confirm Test',
          amountChange: 5,
          customerName: 'Test User',
          templateName: 'Standard Mon-Fri',
          allProviders: false,
        },
      );
      expect(result.details?.previewParams).toEqual({
        serviceName: 'QA Confirm Test',
        amountChange: 5,
      });
      expect(result.summary).toContain('QA Confirm Test');
      expect(result.summary).toContain('5');
      expect(result.summary).toContain('Confirm below to execute');
      expect(result.summary).not.toMatch(/Test User/i);
      expect(result.summary).not.toMatch(/Standard Mon-Fri/i);
      expect(result.summary).not.toMatch(/for Test User/i);
      // Reasoning kept for telemetry, not owner-facing summary.
      expect(result.details?.reasoning).toContain('Test User');
    });

    it('create_services confirmation never echoes fabricated employee/template prose', () => {
      const result = buildExecutionConfirmationResult(
        'create_services',
        'You are about to create three new QA test services for Test User using the Standard Mon-Fri template',
        'Create 3 new QA test services: QA Manicure at 20 dollars, QA Pedicure at 25 dollars, and QA Waxing at 15 dollars',
        {
          serviceNames: ['QA Manicure', 'QA Pedicure', 'QA Waxing'],
          employeeName: 'Test User',
          templateName: 'Standard Mon-Fri',
        },
      );
      expect(result.summary).not.toMatch(/Test User/i);
      expect(result.summary).not.toMatch(/Standard Mon-Fri/i);
      expect(result.details?.previewParams).toEqual({
        serviceNames: ['QA Manicure', 'QA Pedicure', 'QA Waxing'],
      });
    });
  });

  it('e2e-bug.164 — price preview keeps delta fields', () => {
    const preview = sanitizeParamsForPreview(
      {
        serviceName: 'QA Approve Test',
        amountChange: 5,
        percentChange: 5,
        customerName: 'Test User',
      },
      'update_service_prices',
    );
    expect(preview).toEqual({
      serviceName: 'QA Approve Test',
      amountChange: 5,
      percentChange: 5,
    });
  });

  it('builds confirmation result with requiresExecutionConfirmation', () => {
    const result = buildExecutionConfirmationResult(
      'update_service_prices',
      'Raise price',
      'Increase Facial by 5 dollars',
      { serviceName: 'Facial', amountChange: 5 },
    );
    expect(result.success).toBe(true);
    expect(result.details?.requiresExecutionConfirmation).toBe(true);
    expect(result.details?.previewParams).toEqual({
      serviceName: 'Facial',
      amountChange: 5,
    });
  });

  it('still allows schedule template/employee preview for schedule actions', () => {
    const preview = sanitizeParamsForPreview(
      {
        templateName: 'Standard Mon-Fri',
        employeeNames: ['Gevorg Gasparyan', 'Karo Mazmanyan'],
        customerName: 'Test User',
      },
      'setup_week_schedule',
    );
    expect(preview).toEqual({
      templateName: 'Standard Mon-Fri',
      employeeNames: ['Gevorg Gasparyan', 'Karo Mazmanyan'],
    });
  });

  describe('e2e-bug.158 — update_service_duration_buffer requires confirmation', () => {
    it('gates duration updates like update_service_prices (facemassage incident)', () => {
      expect(
        requiresDashboardExecutionConfirmation('update_service_duration_buffer'),
      ).toBe(true);
      expect(
        requiresDashboardExecutionConfirmation('update_service_prices'),
      ).toBe(true);

      const result = buildExecutionConfirmationResult(
        'update_service_duration_buffer',
        'Set facemassage duration to 45 minutes for Test User',
        'Update the duration of the facemassage service to 45 minutes',
        {
          serviceName: 'facemassage',
          durationMinutes: 45,
          customerName: 'Test User',
          templateName: 'Standard Mon-Fri',
        },
      );
      expect(result.details?.requiresExecutionConfirmation).toBe(true);
      expect(result.details?.previewParams).toEqual({
        serviceName: 'facemassage',
        durationMinutes: 45,
      });
      expect(result.summary).toContain('Confirm below to execute');
      expect(result.summary).toContain('45');
      expect(result.summary).toContain('facemassage');
      expect(result.summary).not.toMatch(/Test User/i);
    });

    it('previews bufferMinutes and category scope', () => {
      const preview = sanitizeParamsForPreview(
        {
          categoryName: 'massage',
          durationMinutes: 60,
          bufferMinutes: 15,
          allServices: true,
          templateName: 'Standard Mon-Fri',
        },
        'update_service_duration_buffer',
      );
      expect(preview).toEqual({
        categoryName: 'massage',
        durationMinutes: 60,
        bufferMinutes: 15,
        allServices: true,
      });
    });
  });

  describe('e2e-bug.160 — payment-settings mutates require confirmation', () => {
    it.each([
      'configure_cash_payments',
      'configure_checkout_defaults',
      'configure_service_deposit_policy',
      'configure_service_online_payment',
    ] as const)('gates %s before execution', (action) => {
      expect(requiresDashboardExecutionConfirmation(action)).toBe(true);
      const result = buildExecutionConfirmationResult(
        action,
        'Preview payment settings change',
        'Enable cash payments at the venue for customers',
        { enabled: true },
      );
      expect(result.details?.requiresExecutionConfirmation).toBe(true);
      expect(result.summary).toContain('Confirm below to execute');
    });
  });

  describe('e2e-bug.161 — registry-driven confirmation policy', () => {
    it.each([
      'admin_delete_customer_data',
      'delete_customer_data',
      'privacy_delete',
      'update_service_duration_buffer',
      'configure_cash_payments',
      'configure_business_currency',
      'configure_business_tax',
      'rotate_api_key',
      'revoke_api_key',
      'configure_stripe_connect',
      'enable_hipaa_mode',
      'report_data_breach',
      'send_breach_notification',
      'deactivate_service',
      'deactivate_package',
      'update_service_prices',
      'cancel_bookings',
    ] as const)('requires confirmation for high-risk action %s', (action) => {
      expect(requiresDashboardExecutionConfirmation(action)).toBe(true);
      expect(DASHBOARD_EXECUTION_CONFIRM_ACTIONS).toContain(action);
    });

    it('does not gate ordinary read-only / low-risk actions', () => {
      expect(requiresDashboardExecutionConfirmation('list_customers')).toBe(
        false,
      );
      expect(requiresDashboardExecutionConfirmation('list_services')).toBe(
        false,
      );
      expect(requiresDashboardExecutionConfirmation('create_booking')).toBe(
        false,
      );
    });

    it('keeps product-guide bulk-mutate set identical to the confirm registry', () => {
      expect([...PRODUCT_GUIDE_BULK_MUTATE_ACTIONS]).toEqual([
        ...DASHBOARD_EXECUTION_CONFIRM_ACTIONS,
      ]);
    });

    it('covers far more than the legacy ~26 ad-hoc gates', () => {
      expect(DASHBOARD_EXECUTION_CONFIRM_ACTIONS.length).toBeGreaterThanOrEqual(
        60,
      );
    });
  });
});
