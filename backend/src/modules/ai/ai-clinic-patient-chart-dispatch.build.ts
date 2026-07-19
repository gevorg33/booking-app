import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainPatientChartLogic,
  type ClinicPatientChartLogicDeps,
} from './ai-clinic-patient-chart.logic.js';

export type ClinicPatientChartDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt?: string;
  userId: string;
};

export type ClinicPatientChartLogicDispatchHandler = (
  deps: ClinicPatientChartLogicDeps,
  ctx: ClinicPatientChartDispatchContext,
) => Promise<CommandResult>;

export function buildClinicPatientChartLogicDispatchMap(): ReadonlyMap<
  string,
  ClinicPatientChartLogicDispatchHandler
> {
  const map = new Map<string, ClinicPatientChartLogicDispatchHandler>();

  map.set('explain_patient_chart', async (deps, ctx) =>
    handleExplainPatientChartLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      { ...ctx.params, _prompt: ctx.prompt },
      ctx.prompt,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiClinicPatientChartService (ai-cmd-ext-0.5). */
export const CLINIC_PATIENT_CHART_LOGIC_DISPATCH_MAP =
  buildClinicPatientChartLogicDispatchMap();
