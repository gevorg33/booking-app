import type { BusinessService } from '../business/business.service.js';
import type { DashboardService } from '../business/dashboard.service.js';
import type { CommandResult } from './command-completion.types.js';

export interface BusinessProfileLogicDeps {
  businessService: BusinessService;
  dashboardService: DashboardService;
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

export async function handleGetDashboardOverviewLogic(
  deps: BusinessProfileLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const overview = await deps.dashboardService.getOverview(businessId);
  return success(
    'get_dashboard_overview',
    `${overview.todaysBookings} booking(s) today, ${overview.bookingsThisMonth} this month, ` +
      `${overview.revenueThisMonth} ${overview.currency} revenue this month, ${overview.utilizationPercent}% utilization.`,
    { overview },
  );
}

export async function handleUpdateBusinessProfileLogic(
  deps: BusinessProfileLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const fields = ['name', 'description', 'phone', 'email', 'address'] as const;
  const dto: Record<string, string> = {};
  for (const field of fields) {
    if (typeof params[field] === 'string') dto[field] = params[field];
  }

  if (!Object.keys(dto).length) {
    return failure(
      'update_business_profile',
      'What should I update — name, description, phone, email, or address?',
      { clarify: true, missing: fields },
    );
  }

  const business = await deps.businessService.updateProfile(businessId, dto);
  const updatedFields = Object.keys(dto);
  return success(
    'update_business_profile',
    `Updated business ${updatedFields.join(', ')}.`,
    { business, updatedFields },
  );
}
