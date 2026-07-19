import type { CommandResult } from './command-completion.types.js';
import {
  handleAddCustomerStaffNoteLogic,
  handleCreateEncounterAddendumLogic,
  handleDismissPatientAlertLogic,
  handleListCustomerStaffNotesLogic,
  handleReleasePatientDocumentLogic,
  handleUpdateClinicalProfileLogic,
  handleUpdateEncounterByBookingLogic,
  type PatientClinicalMutationsLogicDeps,
} from './ai-patient-clinical-mutations.logic.js';

export type PatientClinicalMutationsDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  userId?: string;
};

export type PatientClinicalMutationsLogicDispatchHandler = (
  deps: PatientClinicalMutationsLogicDeps,
  ctx: PatientClinicalMutationsDispatchContext,
) => Promise<CommandResult>;

export function buildPatientClinicalMutationsLogicDispatchMap(): ReadonlyMap<
  string,
  PatientClinicalMutationsLogicDispatchHandler
> {
  const map = new Map<string, PatientClinicalMutationsLogicDispatchHandler>();

  map.set('update_clinical_profile', async (deps, ctx) =>
    handleUpdateClinicalProfileLogic(
      deps,
      ctx.businessId,
      ctx.userId ?? '',
      ctx.params,
    ),
  );
  map.set('dismiss_patient_alert', async (deps, ctx) =>
    handleDismissPatientAlertLogic(
      deps,
      ctx.businessId,
      ctx.userId ?? '',
      ctx.params,
    ),
  );
  map.set('release_patient_document', async (deps, ctx) =>
    handleReleasePatientDocumentLogic(
      deps,
      ctx.businessId,
      ctx.userId ?? '',
      ctx.params,
    ),
  );
  map.set('create_encounter_addendum', async (deps, ctx) =>
    handleCreateEncounterAddendumLogic(
      deps,
      ctx.businessId,
      ctx.userId ?? '',
      ctx.params,
    ),
  );
  map.set('update_encounter_by_booking', async (deps, ctx) =>
    handleUpdateEncounterByBookingLogic(
      deps,
      ctx.businessId,
      ctx.userId ?? '',
      ctx.params,
    ),
  );
  map.set('list_customer_staff_notes', async (deps, ctx) =>
    handleListCustomerStaffNotesLogic(
      deps,
      ctx.businessId,
      ctx.userId ?? '',
      ctx.params,
    ),
  );
  map.set('add_customer_staff_note', async (deps, ctx) =>
    handleAddCustomerStaffNoteLogic(
      deps,
      ctx.businessId,
      ctx.userId ?? '',
      ctx.params,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiPatientClinicalMutationsService (ai-cmd-ext-0.5). */
export const PATIENT_CLINICAL_MUTATIONS_LOGIC_DISPATCH_MAP =
  buildPatientClinicalMutationsLogicDispatchMap();
