import {
  handleDismissPatientAlertLogic,
  type DismissPatientAlertLogicDeps,
} from './ai-dismiss-patient-alert.logic.js';

function buildDeps(
  overrides: Partial<DismissPatientAlertLogicDeps> = {},
): DismissPatientAlertLogicDeps {
  return {
    patientClinicalAlertsService: {
      dismissAlertForCustomerAccount: jest
        .fn()
        .mockResolvedValue({ dismissed: true }),
    },
    ...overrides,
  } as DismissPatientAlertLogicDeps;
}

describe('handleDismissPatientAlertLogic', () => {
  it('dismisses a clinic patient alert', async () => {
    const deps = buildDeps();
    const result = await handleDismissPatientAlertLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      alertType: 'TestResultReleased',
      sourceId: 'order-1',
    });
    expect(result.success).toBe(true);
    expect(result.action).toBe('dismiss_patient_alert');
    expect(
      deps.patientClinicalAlertsService.dismissAlertForCustomerAccount,
    ).toHaveBeenCalledWith('biz-1', 'cust-1', 'TestResultReleased', 'order-1');
  });

  it('requires sign-in', async () => {
    const result = await handleDismissPatientAlertLogic(buildDeps(), 'biz-1', {
      alertType: 'TestResultReleased',
      sourceId: 'order-1',
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('requires alertType and sourceId', async () => {
    const result = await handleDismissPatientAlertLogic(buildDeps(), 'biz-1', {
      sessionCustomerId: 'cust-1',
    });
    expect(result.success).toBe(false);
    expect(result.details?.missing).toEqual(['alertType', 'sourceId']);
  });

  it('surfaces a dismiss failure', async () => {
    const result = await handleDismissPatientAlertLogic(
      buildDeps({
        patientClinicalAlertsService: {
          dismissAlertForCustomerAccount: jest
            .fn()
            .mockRejectedValue(new Error('Alert not found')),
        },
      }),
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        alertType: 'TestResultReleased',
        sourceId: 'missing',
      },
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('not found');
  });
});
