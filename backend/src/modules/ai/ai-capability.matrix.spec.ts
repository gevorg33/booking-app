import {
  buildCapabilitiesView,
  capabilityMatrixForPrompt,
  CLINIC_TEST_RESULT_CAPABILITY_ROWS,
  CLINIC_TEST_RESULT_CAPABILITY_VALIDATION_ERRORS,
  CLINIC_TEST_RESULT_CORE_CAPABILITY_ROWS,
  CLINIC_TEST_RESULT_EXT_CAPABILITY_ROWS,
  CLINIC_TEST_RESULT_EXT_CAPABILITY_VALIDATION_ERRORS,
  CUSTOMER_PUBLIC_DELEGATED_INTENTS,
  CUSTOMER_PUBLIC_RESCUE_ROUTING,
  getAllowedIntents,
  getClinicTestResultCapabilityRow,
  getClinicTestResultExtCapabilityRow,
  getServiceOnlinePaymentCapabilityRow,
  getCustomerNativeIntents,
  getEffectiveAllowedIntents,
  getPublicDelegatedCustomerIntents,
  isIntentAllowed,
  isMutatingIntent,
  normalizeActorRole,
  SERVICE_ONLINE_PAYMENT_CAPABILITY_ROWS,
  SERVICE_ONLINE_PAYMENT_CAPABILITY_VALIDATION_ERRORS,
  validateClinicTestResultCapabilityRows,
  validateClinicTestResultExtCapabilityRows,
  validateCustomerPublicDelegatedIntents,
  validateServiceOnlinePaymentCapabilityRows,
  type ClinicTestResultExtCapabilityRow,
  type ServiceOnlinePaymentCapabilityRow,
} from './ai-capability.matrix.js';
import { SERVICE_ONLINE_PAYMENT_INTENT } from './ai-service-online-payment.util.js';
import { CLINIC_TEST_RESULT_EXT_INTENTS } from './ai-clinic-test-result-ext.util.js';
import { CLINIC_TEST_RESULT_INTENTS } from './ai-clinic-test-result.util.js';
import {
  CUSTOMER_INTENTS,
  DASHBOARD_INTENTS,
  PROVIDER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import { COMMAND_REGISTRY_BY_ID } from './ai-command-registry.js';
import { PUBLIC_ONLY_ASSISTANT_ACTIONS } from './customer-ai-command.util.js';

describe('ai-capability.matrix (Sprint 15)', () => {
  it('restricts staff from owner-only dashboard intents', () => {
    expect(isIntentAllowed('dashboard', 'staff', 'optimize_schedule')).toBe(
      false,
    );
    expect(isIntentAllowed('dashboard', 'owner', 'optimize_schedule')).toBe(
      true,
    );
  });

  it('allows meta actions without role checks', () => {
    expect(isIntentAllowed('dashboard', 'client', 'unknown')).toBe(true);
    expect(isIntentAllowed('provider', 'client', 'error')).toBe(true);
    expect(isIntentAllowed('provider', 'staff', 'security_blocked')).toBe(true);
  });

  it('checks provider surface intents', () => {
    expect(isIntentAllowed('provider', 'staff', 'payment_sweep')).toBe(false);
    expect(isIntentAllowed('provider', 'owner', 'list_bookings')).toBe(true);
  });

  it('defaults plan tier to solo when omitted', () => {
    const allowed = getEffectiveAllowedIntents('dashboard', 'owner');
    expect(allowed).not.toContain('optimize_schedule');
  });

  it('filters solo plan denied intents from effective list', () => {
    const allowed = getEffectiveAllowedIntents('dashboard', 'owner', 'solo');
    expect(allowed).toContain('create_booking');
    expect(allowed).not.toContain('optimize_schedule');
    expect(allowed).not.toContain('clear_schedule');
  });

  it('does not filter provider intents by plan tier', () => {
    const allowed = getEffectiveAllowedIntents('provider', 'owner', 'solo');
    expect(allowed).toContain('list_bookings');
    expect(allowed).toContain('reschedule_booking');
  });

  it('detects mutating intents per surface', () => {
    expect(isMutatingIntent('dashboard', 'create_booking')).toBe(true);
    expect(isMutatingIntent('dashboard', 'list_bookings')).toBe(false);
    expect(isMutatingIntent('dashboard', 'optimize_schedule')).toBe(true);
    expect(isMutatingIntent('provider', 'block_schedule')).toBe(true);
    expect(isMutatingIntent('provider', 'summarize_day')).toBe(false);
    expect(isMutatingIntent('provider', 'unknown_action')).toBe(false);
  });

  it('builds dashboard capabilities view with plan denied list', () => {
    const view = buildCapabilitiesView('dashboard', 'owner', 'solo');
    expect(view.surface).toBe('dashboard');
    expect(view.planTierId).toBe('solo');
    expect(view.planDeniedIntents.length).toBeGreaterThan(0);
    expect(view.allowedIntents).not.toContain('day_replan');
    expect(view.hints).toMatch(/Allowed AI actions \(dashboard\)/);
  });

  it('builds provider capabilities without plan denied list', () => {
    const view = buildCapabilitiesView('provider', 'staff', 'solo');
    expect(view.surface).toBe('provider');
    expect(view.planDeniedIntents).toEqual([]);
    expect(view.hints).toMatch(/Allowed AI actions \(provider\)/);
  });

  it('lists allowed intents for role', () => {
    const owner = getAllowedIntents('dashboard', 'owner');
    expect(owner).toContain('optimize_schedule');
    const staff = getAllowedIntents('dashboard', 'staff');
    expect(staff).not.toContain('optimize_schedule');
    expect(getAllowedIntents('public', 'client')).toEqual(PUBLIC_INTENTS);
    expect(getAllowedIntents('provider', 'owner')).toContain('list_bookings');
  });

  it('formats capability hints for classifier', () => {
    const hints = capabilityMatrixForPrompt('dashboard', 'manager');
    expect(hints).toMatch(/Manager/);
    expect(hints).toMatch(/optimize_schedule|list_bookings/);
  });

  it('normalizes membership roles to access tiers', () => {
    expect(normalizeActorRole('owner')).toBe('owner');
    expect(normalizeActorRole(undefined)).toBe('client');
  });

  it('applies plan filters only on dashboard effective intents', () => {
    expect(getEffectiveAllowedIntents('customer', 'client', 'solo')).toContain(
      'book_package',
    );
    expect(getEffectiveAllowedIntents('provider', 'owner', 'solo')).toContain(
      'list_bookings',
    );
  });

  it('exposes intent lists generated from the command registry', () => {
    expect(DASHBOARD_INTENTS.length).toBeGreaterThan(150);
    expect(PROVIDER_INTENTS.length).toBeGreaterThan(30);
    expect(CUSTOMER_INTENTS.length).toBeGreaterThan(40);
    expect(PUBLIC_INTENTS.length).toBeGreaterThan(10);
    expect(DASHBOARD_INTENTS).toContain('create_booking');
    expect(PROVIDER_INTENTS).toContain('list_package_appointments_today');
    expect(CUSTOMER_INTENTS).toContain('book_package');
    expect(PUBLIC_INTENTS).toContain('book_appointment');
    expect(CUSTOMER_INTENTS).not.toContain('create_booking');
  });

  it('scopes customer surface to client tier', () => {
    expect(isIntentAllowed('customer', 'client', 'book_package')).toBe(true);
    expect(isIntentAllowed('customer', 'staff', 'book_package')).toBe(false);
    expect(getAllowedIntents('customer', 'client')).toContain('book_package');
    expect(getAllowedIntents('customer', 'owner')).toEqual(['unknown']);
  });

  it('rejects anonymous public intents outside the public allow-list', () => {
    expect(isIntentAllowed('public', 'client', 'book_appointment')).toBe(true);
    expect(isIntentAllowed('public', 'client', 'book_package')).toBe(false);
    expect(capabilityMatrixForPrompt('public', 'client')).toMatch(
      /Public booking assistant/,
    );
    expect(capabilityMatrixForPrompt('public', 'client')).toContain(
      'book_appointment',
    );
  });

  it('detects customer mutating intents and builds customer capabilities view', () => {
    expect(isMutatingIntent('customer', 'book_package')).toBe(true);
    expect(isMutatingIntent('customer', 'list_my_appointments')).toBe(false);
    expect(isMutatingIntent('public', 'book_appointment')).toBe(false);
    const view = buildCapabilitiesView('customer', 'client', 'solo');
    expect(view.surface).toBe('customer');
    expect(view.allowedIntents).toContain('book_package');
    expect(view.publicDelegatedIntents).toEqual([
      ...PUBLIC_ONLY_ASSISTANT_ACTIONS,
    ]);
    expect(view.customerNativeIntents).toContain('book_package');
    expect(view.customerNativeIntents).not.toContain('list_services');
    expect(view.rescueRoutingNotes).toBe(
      CUSTOMER_PUBLIC_RESCUE_ROUTING.sharedDiscovery.summary,
    );
    expect(capabilityMatrixForPrompt('customer', 'client')).toMatch(
      /Customer booking assistant/,
    );
    expect(capabilityMatrixForPrompt('customer', 'client')).toMatch(
      /delegated to PublicBookingAssistantService/,
    );
  });

  it('documents public delegation vs customer-native intents (ai-cmd-customer-0.1)', () => {
    expect(validateCustomerPublicDelegatedIntents()).toEqual([]);
    expect(
      validateCustomerPublicDelegatedIntents(['not_a_delegated_action']),
    ).toEqual([
      'not_a_delegated_action missing from PUBLIC_INTENTS',
      'not_a_delegated_action missing from customer surface union',
    ]);
    expect(CUSTOMER_PUBLIC_DELEGATED_INTENTS).toEqual([
      ...PUBLIC_ONLY_ASSISTANT_ACTIONS,
    ]);

    const delegated = getPublicDelegatedCustomerIntents('client');
    const native = getCustomerNativeIntents('client');
    const allowed = getAllowedIntents('customer', 'client');

    for (const action of PUBLIC_ONLY_ASSISTANT_ACTIONS) {
      expect(delegated).toContain(action);
      expect(native).not.toContain(action);
      expect(allowed).toContain(action);
    }

    expect(native).toContain('book_package');
    expect(native).not.toContain('list_services');
    expect(delegated).not.toContain('book_package');
  });

  it('allows customer meta actions and rejects dashboard intents on customer surface', () => {
    expect(isIntentAllowed('customer', 'client', 'unknown')).toBe(true);
    expect(isIntentAllowed('customer', 'client', 'error')).toBe(true);
    expect(isIntentAllowed('customer', 'client', 'security_blocked')).toBe(
      true,
    );
    expect(isIntentAllowed('customer', 'client', 'create_booking')).toBe(false);
    expect(isIntentAllowed('customer', 'client', 'not_a_real_intent')).toBe(
      false,
    );
  });

  it('allows anonymous public booking intents on customer gateway (ai-cmd-0.5)', () => {
    expect(isIntentAllowed('customer', 'client', 'list_providers')).toBe(true);
    expect(isIntentAllowed('customer', 'client', 'book_appointment')).toBe(
      true,
    );
    expect(getAllowedIntents('customer', 'client')).toEqual(
      expect.arrayContaining([
        'book_package',
        'list_providers',
        'check_availability',
      ]),
    );
  });

  it('rejects denied provider intents for client tier', () => {
    expect(isIntentAllowed('provider', 'client', 'list_bookings')).toBe(false);
    expect(
      isIntentAllowed('provider', 'owner', 'list_package_appointments_today'),
    ).toBe(true);
  });

  describe('clinic test-result ext capability rows (ai-cmd-clinic-6-gap-4.1)', () => {
    it('documents four dashboard-only ext intents with tier, mutating, sprint 54', () => {
      expect(CLINIC_TEST_RESULT_EXT_CAPABILITY_ROWS).toHaveLength(4);
      expect(
        CLINIC_TEST_RESULT_EXT_CAPABILITY_ROWS.map((row) => row.id),
      ).toEqual([...CLINIC_TEST_RESULT_EXT_INTENTS]);
      for (const row of CLINIC_TEST_RESULT_EXT_CAPABILITY_ROWS) {
        expect(row.surfaces).toEqual(['dashboard']);
        expect(row.sprint).toBe('54');
        expect(row.mutating).toBe(row.tier === 'M');
      }
    });

    it('validates zero drift against registry and access-control', () => {
      expect(CLINIC_TEST_RESULT_EXT_CAPABILITY_VALIDATION_ERRORS).toEqual([]);
      expect(
        validateClinicTestResultExtCapabilityRows(COMMAND_REGISTRY_BY_ID),
      ).toEqual([]);
    });

    it.each(CLINIC_TEST_RESULT_EXT_CAPABILITY_ROWS)(
      'row $id aligns with dashboard allow-list and mutating set',
      (row) => {
        expect(getClinicTestResultExtCapabilityRow(row.id)).toEqual(row);
        expect(getClinicTestResultExtCapabilityRow('not_an_ext_intent')).toBe(
          undefined,
        );
        expect(isMutatingIntent('dashboard', row.id)).toBe(row.mutating);
        expect(isIntentAllowed('dashboard', 'staff', row.id)).toBe(true);
        expect(isIntentAllowed('dashboard', 'client', row.id)).toBe(false);
        expect(DASHBOARD_INTENTS).toContain(row.id);
      },
    );

    it('reports registry drift when an ext intent is missing', () => {
      const broken = new Map(COMMAND_REGISTRY_BY_ID);
      broken.delete('upload_patient_result');
      expect(validateClinicTestResultExtCapabilityRows(broken)).toContain(
        'registry: missing entry for upload_patient_result',
      );
    });

    it('reports when registry drops dashboard surface', () => {
      const uploadRow = CLINIC_TEST_RESULT_EXT_CAPABILITY_ROWS[0];
      const registry = COMMAND_REGISTRY_BY_ID.get('upload_patient_result')!;
      const brokenRegistry = new Map(COMMAND_REGISTRY_BY_ID);
      brokenRegistry.set('upload_patient_result', {
        ...registry,
        surfaces: ['provider'],
      });
      expect(
        validateClinicTestResultExtCapabilityRows(brokenRegistry, [uploadRow]),
      ).toContain('registry: upload_patient_result missing dashboard surface');
    });

    it('reports when classifier tier cannot be resolved for a row id', () => {
      const uploadRow = CLINIC_TEST_RESULT_EXT_CAPABILITY_ROWS[0];
      const mismatchedRow = {
        ...uploadRow,
        id: 'create_booking' as ClinicTestResultExtCapabilityRow['id'],
        tier: 'M' as const,
      };
      expect(
        validateClinicTestResultExtCapabilityRows(COMMAND_REGISTRY_BY_ID, [
          mismatchedRow,
        ]),
      ).toContain('capability rows: create_booking tier M !== resolved none');
    });

    it('defaults customer native/delegated helpers to client tier', () => {
      expect(getCustomerNativeIntents()).toEqual(
        getCustomerNativeIntents('client'),
      );
      expect(getPublicDelegatedCustomerIntents()).toEqual(
        getPublicDelegatedCustomerIntents('client'),
      );
    });

    it('reports row and registry validation drift', () => {
      const uploadRow = CLINIC_TEST_RESULT_EXT_CAPABILITY_ROWS[0];
      const registry = COMMAND_REGISTRY_BY_ID.get('upload_patient_result')!;

      const brokenRegistry = new Map(COMMAND_REGISTRY_BY_ID);
      brokenRegistry.set('upload_patient_result', {
        ...registry,
        surfaces: ['dashboard', 'provider'],
        mutating: false,
      });

      const brokenRow = {
        ...uploadRow,
        tier: 'R' as const,
        mutating: true,
        sprint: '53' as '54',
        surfaces: ['provider' as 'dashboard'],
      } satisfies ClinicTestResultExtCapabilityRow;

      const errors = validateClinicTestResultExtCapabilityRows(brokenRegistry, [
        brokenRow,
      ]);
      expect(errors).toEqual(
        expect.arrayContaining([
          'capability rows: expected 4 rows, got 1',
          'capability rows: missing explicit row for configure_test_reference_range',
          'capability rows: upload_patient_result tier R !== resolved M',
          'capability rows: upload_patient_result mutating true !== tier-derived false',
          'capability rows: upload_patient_result sprint must be 54',
          'capability rows: upload_patient_result must be dashboard-only',
          'registry: upload_patient_result must be dashboard-only',
          'registry: upload_patient_result mutating false !== capability row true',
        ]),
      );
    });
  });

  describe('clinic test-result family registry parity (ai-cmd-clinic-6-gap-4.3)', () => {
    it('documents six dashboard clinic test-result intents with zero drift', () => {
      expect(CLINIC_TEST_RESULT_CAPABILITY_ROWS).toHaveLength(6);
      expect(CLINIC_TEST_RESULT_CAPABILITY_ROWS.map((row) => row.id)).toEqual([
        ...CLINIC_TEST_RESULT_INTENTS,
      ]);
      expect(
        CLINIC_TEST_RESULT_CORE_CAPABILITY_ROWS.map((row) => row.id),
      ).toEqual(['enter_test_result', 'release_test_result']);
      expect(CLINIC_TEST_RESULT_CAPABILITY_VALIDATION_ERRORS).toEqual([]);
      expect(
        validateClinicTestResultCapabilityRows(COMMAND_REGISTRY_BY_ID),
      ).toEqual([]);
    });

    it.each(CLINIC_TEST_RESULT_CAPABILITY_ROWS)(
      'family row $id matches registry handler and dashboard allow-list',
      (row) => {
        expect(getClinicTestResultCapabilityRow(row.id)).toEqual(row);
        expect(COMMAND_REGISTRY_BY_ID.get(row.id)?.handler).toBe(
          'AiClinicTestResultService',
        );
        expect(COMMAND_REGISTRY_BY_ID.get(row.id)?.apiModule).toBe(
          'clinic-test-results',
        );
        expect(isMutatingIntent('dashboard', row.id)).toBe(row.mutating);
        expect(isIntentAllowed('dashboard', 'staff', row.id)).toBe(true);
        expect(isIntentAllowed('dashboard', 'client', row.id)).toBe(false);
        expect(DASHBOARD_INTENTS).toContain(row.id);
      },
    );

    it('reports registry drift for core enter/release intents', () => {
      const broken = new Map(COMMAND_REGISTRY_BY_ID);
      broken.delete('enter_test_result');
      expect(validateClinicTestResultCapabilityRows(broken)).toContain(
        'registry: missing entry for enter_test_result',
      );
    });

    it('reports handler and dashboard intent drift for family rows', () => {
      const enterRow = CLINIC_TEST_RESULT_CORE_CAPABILITY_ROWS[0];
      const registry = COMMAND_REGISTRY_BY_ID.get('enter_test_result')!;
      const brokenRegistry = new Map(COMMAND_REGISTRY_BY_ID);
      brokenRegistry.set('enter_test_result', {
        ...registry,
        handler: 'AiCommandService',
        apiModule: 'ai-command',
      });
      expect(
        validateClinicTestResultCapabilityRows(
          brokenRegistry,
          [enterRow],
          ['enter_test_result'],
        ),
      ).toEqual(
        expect.arrayContaining([
          'registry: enter_test_result handler must be AiClinicTestResultService',
          'registry: enter_test_result apiModule must be clinic-test-results',
        ]),
      );
    });

    it('reports when capability row id is missing from DASHBOARD_INTENTS', () => {
      const fakeRow = {
        ...CLINIC_TEST_RESULT_CORE_CAPABILITY_ROWS[0],
        id: 'not_in_dashboard_intents' as ClinicTestResultExtCapabilityRow['id'],
      };
      expect(
        validateClinicTestResultCapabilityRows(
          COMMAND_REGISTRY_BY_ID,
          [fakeRow],
          ['not_in_dashboard_intents'],
        ),
      ).toContain('DASHBOARD_INTENTS: missing not_in_dashboard_intents');
    });
  });

  describe('service online payment capability row (ai-cmd-ext-2.13.3)', () => {
    it('documents configure_service_online_payment with dashboard-only tier M sprint 2.13', () => {
      expect(SERVICE_ONLINE_PAYMENT_CAPABILITY_ROWS).toHaveLength(1);
      expect(SERVICE_ONLINE_PAYMENT_CAPABILITY_ROWS[0]).toEqual({
        id: SERVICE_ONLINE_PAYMENT_INTENT,
        surfaces: ['dashboard'],
        tier: 'M',
        mutating: true,
        sprint: '2.13',
      });
    });

    it('validates zero drift against registry and payments handler', () => {
      expect(SERVICE_ONLINE_PAYMENT_CAPABILITY_VALIDATION_ERRORS).toEqual([]);
      expect(
        validateServiceOnlinePaymentCapabilityRows(COMMAND_REGISTRY_BY_ID),
      ).toEqual([]);
    });

    it.each(SERVICE_ONLINE_PAYMENT_CAPABILITY_ROWS)(
      'row $id aligns with dashboard allow-list and mutating set',
      (row) => {
        expect(getServiceOnlinePaymentCapabilityRow(row.id)).toEqual(row);
        expect(
          getServiceOnlinePaymentCapabilityRow('not_a_payment_intent'),
        ).toBe(undefined);
        expect(isMutatingIntent('dashboard', row.id)).toBe(row.mutating);
        expect(isIntentAllowed('dashboard', 'staff', row.id)).toBe(true);
        expect(isIntentAllowed('dashboard', 'owner', row.id)).toBe(true);
        expect(DASHBOARD_INTENTS).toContain(row.id);
        expect(COMMAND_REGISTRY_BY_ID.get(row.id)?.handler).toBe(
          'AiPaymentsService',
        );
        expect(COMMAND_REGISTRY_BY_ID.get(row.id)?.apiModule).toBe('payments');
      },
    );

    it('reports registry drift when service online payment intent is missing', () => {
      const broken = new Map(COMMAND_REGISTRY_BY_ID);
      broken.delete(SERVICE_ONLINE_PAYMENT_INTENT);
      expect(validateServiceOnlinePaymentCapabilityRows(broken)).toContain(
        `registry: missing entry for ${SERVICE_ONLINE_PAYMENT_INTENT}`,
      );
    });

    it('reports handler and sprint drift for service online payment row', () => {
      const row = SERVICE_ONLINE_PAYMENT_CAPABILITY_ROWS[0];
      const registry = COMMAND_REGISTRY_BY_ID.get(
        SERVICE_ONLINE_PAYMENT_INTENT,
      )!;
      const brokenRegistry = new Map(COMMAND_REGISTRY_BY_ID);
      brokenRegistry.set(SERVICE_ONLINE_PAYMENT_INTENT, {
        ...registry,
        handler: 'AiCommandService',
        apiModule: 'ai-command',
      });
      const brokenRow = {
        ...row,
        tier: 'R' as const,
        mutating: true,
        sprint: '2.12' as '2.13',
        surfaces: ['provider' as 'dashboard'],
      } satisfies ServiceOnlinePaymentCapabilityRow;

      expect(
        validateServiceOnlinePaymentCapabilityRows(brokenRegistry, [brokenRow]),
      ).toEqual(
        expect.arrayContaining([
          `capability rows: ${SERVICE_ONLINE_PAYMENT_INTENT} tier R !== resolved M`,
          `capability rows: ${SERVICE_ONLINE_PAYMENT_INTENT} mutating true !== tier-derived false`,
          `capability rows: ${SERVICE_ONLINE_PAYMENT_INTENT} sprint must be 2.13`,
          `capability rows: ${SERVICE_ONLINE_PAYMENT_INTENT} must be dashboard-only`,
          `registry: ${SERVICE_ONLINE_PAYMENT_INTENT} handler must be AiPaymentsService`,
          `registry: ${SERVICE_ONLINE_PAYMENT_INTENT} apiModule must be payments`,
        ]),
      );
    });
  });
});
