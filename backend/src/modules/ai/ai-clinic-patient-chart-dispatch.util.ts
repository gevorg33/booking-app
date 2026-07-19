import type { CommandResult } from './command-completion.types.js';
import {
  CLINIC_PATIENT_CHART_LOGIC_DISPATCH_MAP,
  type ClinicPatientChartDispatchContext,
  type ClinicPatientChartLogicDispatchHandler,
} from './ai-clinic-patient-chart-dispatch.build.js';
import type { ClinicPatientChartLogicDeps } from './ai-clinic-patient-chart.logic.js';

export function getClinicPatientChartLogicDispatchHandler(
  action: string,
): ClinicPatientChartLogicDispatchHandler | undefined {
  return CLINIC_PATIENT_CHART_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchClinicPatientChartLogicIntent(
  deps: ClinicPatientChartLogicDeps,
  ctx: ClinicPatientChartDispatchContext,
): Promise<CommandResult | null> {
  const handler = CLINIC_PATIENT_CHART_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function clinicPatientChartDispatchMapHas(action: string): boolean {
  return CLINIC_PATIENT_CHART_LOGIC_DISPATCH_MAP.has(action);
}
