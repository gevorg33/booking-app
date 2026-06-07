import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { Customer } from '../customer/entities/customer.entity.js';
import type { PatientChartService } from '../patient-clinical-profiles/patient-chart.service.js';
import {
  formatPatientChartSummaryText,
  type PatientChartSummaryFocus,
} from '../patient-clinical-profiles/patient-chart-summary.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  assertClinicPatientChartBusinessType,
  parseExplainPatientChartFromPrompt,
  resolveCustomerForPatientChart,
  resolvePatientChartSummaryFocus,
} from './ai-clinic-patient-chart.util.js';

export interface ClinicPatientChartLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  customerRepo: Pick<Repository<Customer>, 'find' | 'findOne'>;
  patientChartService: Pick<PatientChartService, 'getChartSummaryForCustomer'>;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

function clarify(
  action: string,
  summary: string,
  missing: string[],
  details: Record<string, unknown> = {},
): CommandResult {
  return {
    success: false,
    action,
    summary,
    details: { ...details, clarify: true, missing },
  };
}

function formatFocusedSummary(
  summary: Awaited<
    ReturnType<
      ClinicPatientChartLogicDeps['patientChartService']['getChartSummaryForCustomer']
    >
  >,
  focus: PatientChartSummaryFocus[],
): string {
  if (focus.length <= 1) {
    return formatPatientChartSummaryText(
      summary,
      resolvePatientChartSummaryFocus(focus),
    );
  }

  return focus
    .map((section) => formatPatientChartSummaryText(summary, section))
    .join(' ');
}

export async function handleExplainPatientChartLogic(
  deps: ClinicPatientChartLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_patient_chart', 'Business not found.');
  }

  const nonClinicType = assertClinicPatientChartBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'explain_patient_chart',
      'Patient chart summaries are only available for clinic vertical businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const parsed =
    parseExplainPatientChartFromPrompt(effectivePrompt, params) ??
    parseExplainPatientChartFromPrompt(effectivePrompt);
  if (!parsed?.customerId && !parsed?.customerName) {
    return clarify(
      'explain_patient_chart',
      'Which patient chart should I summarize?',
      ['customerName', 'customerId'],
    );
  }

  const customer = await resolveCustomerForPatientChart(
    deps,
    businessId,
    parsed,
  );
  if (!customer) {
    return failure(
      'explain_patient_chart',
      'No matching patient was found for that chart request.',
      {
        customerName: parsed.customerName ?? null,
        customerId: parsed.customerId ?? null,
      },
    );
  }

  try {
    const chartSummary =
      await deps.patientChartService.getChartSummaryForCustomer(
        businessId,
        customer.id,
        userId,
      );
    const summaryText = formatFocusedSummary(chartSummary, parsed.focus);

    return success('explain_patient_chart', summaryText, {
      customerId: customer.id,
      customerName: chartSummary.customerName,
      focus: parsed.focus,
      chartSummary,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not load the patient chart summary.';
    return failure('explain_patient_chart', message, {
      customerId: customer.id,
      customerName: customer.name,
    });
  }
}
