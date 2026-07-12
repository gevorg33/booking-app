import type { CommandResult } from './command-completion.types.js';
import {
  PATIENT_CLINICAL_MUTATIONS_LOGIC_DISPATCH_MAP,
  type PatientClinicalMutationsDispatchContext,
  type PatientClinicalMutationsLogicDispatchHandler,
} from './ai-patient-clinical-mutations-dispatch.build.js';
import type { PatientClinicalMutationsLogicDeps } from './ai-patient-clinical-mutations.logic.js';

export function getPatientClinicalMutationsLogicDispatchHandler(
  action: string,
): PatientClinicalMutationsLogicDispatchHandler | undefined {
  return PATIENT_CLINICAL_MUTATIONS_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchPatientClinicalMutationsLogicIntent(
  deps: PatientClinicalMutationsLogicDeps,
  ctx: PatientClinicalMutationsDispatchContext,
): Promise<CommandResult | null> {
  const handler = PATIENT_CLINICAL_MUTATIONS_LOGIC_DISPATCH_MAP.get(
    ctx.action,
  );
  if (!handler) return null;
  return handler(deps, ctx);
}

export function patientClinicalMutationsDispatchMapHas(
  action: string,
): boolean {
  return PATIENT_CLINICAL_MUTATIONS_LOGIC_DISPATCH_MAP.has(action);
}
