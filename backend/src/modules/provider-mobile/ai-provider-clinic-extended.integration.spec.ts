import { describe, expect, it, jest } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI clinic extended (ai-cmd-provider-5.19)', () => {
  const businessId = 'biz-519';
  const userId = 'user-519';
  const employeeId = 'emp-519';

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  it('dispatches search_patient and returns matching patients (ai-cmd-provider-5.19.1)', async () => {
    const llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(async () => ({
        action: 'search_patient',
        params: { query: 'Jane' },
        reasoning: 'test',
      })),
    };
    const providerMobile = {
      resolveMobileAccess: jest.fn(async () => staffAccess),
      getScopedEmployeeId: jest.fn(() => employeeId),
      searchProviderPatients: jest.fn(
        async (..._args: [string, string, string]) => ({
          labFeaturesEnabled: true,
          viewMode: 'provider',
          query: 'Jane',
          patients: [
            { id: 'c1', name: 'Jane Doe', email: null, phone: '555-1234' },
          ],
        }),
      ),
    };
    const service = createProviderAiCommandHarness({ llm, providerMobile });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Find patient Jane',
      [],
    );

    expect(result.action).toBe('search_patient');
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Jane Doe');
    expect(providerMobile.searchProviderPatients).toHaveBeenCalledWith(
      businessId,
      userId,
      'Jane',
    );
  });

  it('fails gracefully when clinic features are disabled (ai-cmd-provider-5.19.1)', async () => {
    const llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(async () => ({
        action: 'search_patient',
        params: { query: 'Jane' },
        reasoning: 'test',
      })),
    };
    const providerMobile = {
      resolveMobileAccess: jest.fn(async () => staffAccess),
      getScopedEmployeeId: jest.fn(() => employeeId),
      searchProviderPatients: jest.fn(async () => ({
        labFeaturesEnabled: false,
        viewMode: 'provider',
        query: 'Jane',
        patients: [],
      })),
    };
    const service = createProviderAiCommandHarness({ llm, providerMobile });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Find patient Jane',
      [],
    );

    expect(result.action).toBe('search_patient');
    expect(result.success).toBe(false);
    expect(result.details?.clinicOnly).toBe(true);
  });

  it('dispatches notify_patient_book_lab and reuses the dashboard push logic (ai-cmd-provider-5.19.4)', async () => {
    const llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(async () => ({
        action: 'notify_patient_book_lab',
        params: { customerName: 'Maria' },
        reasoning: 'test',
      })),
    };
    const providerMobile = {
      resolveMobileAccess: jest.fn(async () => staffAccess),
      getScopedEmployeeId: jest.fn(() => employeeId),
    };
    const clinicLabBooking = {
      handleListPatientPendingLabRequests: jest.fn(async () => ({
        success: true,
        action: 'list_patient_pending_lab_requests',
        summary: 'ok',
        details: {},
      })),
      handlePushLabBookingToPatient: jest.fn(async () => ({
        success: true,
        action: 'push_lab_booking_to_patient',
        summary: 'Sent Maria a lab collection self-booking link.',
        details: { customerName: 'Maria' },
      })),
    };
    const service = createProviderAiCommandHarness({
      llm,
      providerMobile,
      clinicLabBooking,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Remind Maria to book her lab collection',
      [],
    );

    expect(result.action).toBe('notify_patient_book_lab');
    expect(result.success).toBe(true);
    expect(clinicLabBooking.handlePushLabBookingToPatient).toHaveBeenCalled();
  });

  it('dispatches handoff_to_dashboard_phi with a static explainer (ai-cmd-provider-5.19.6)', async () => {
    const providerMobile = {
      resolveMobileAccess: jest.fn(async () => staffAccess),
      getScopedEmployeeId: jest.fn(() => employeeId),
    };
    const service = createProviderAiCommandHarness({ providerMobile });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Why can\'t I edit intake here?',
      [],
    );

    expect(result.action).toBe('handoff_to_dashboard_phi');
    expect(result.success).toBe(true);
    expect(result.summary).toContain('dashboard');
  });
});
