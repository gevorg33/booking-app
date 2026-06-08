/** Build public booking assistant screen context from URL query params (n99-2.2). */
export function buildPublicAssistantPageContext(input: {
  pathname?: string | null;
  searchParams?: URLSearchParams | null;
}): Record<string, string> {
  const params = input.searchParams;
  if (!params) return {};

  const read = (key: string) => {
    const value = params.get(key);
    return value?.trim() ? value.trim() : undefined;
  };

  const context: Record<string, string> = {};
  const route = input.pathname?.trim();
  if (route) context.route = route;

  for (const key of [
    'serviceId',
    'serviceName',
    'employeeId',
    'employeeName',
    'date',
    'timeSlot',
    'startTime',
    'bookingId',
    'customerId',
    'customerName',
  ] as const) {
    const value = read(key);
    if (value) context[key] = value;
  }

  if (!context.timeSlot && context.startTime) {
    context.timeSlot = context.startTime;
  }

  return context;
}
