export const FRESH_BOOK_QUERY_KEY = 'freshBook';
export const FRESH_BOOK_QUERY_VALUE = '1';

export type BookAnotherServiceNavigatePath = 'services' | 'checkout';

export interface BookAnotherServiceNavigate {
  path: BookAnotherServiceNavigatePath;
  query: Record<string, string>;
}

export function isFreshBookQueryValue(
  value: string | null | undefined,
): boolean {
  return value === FRESH_BOOK_QUERY_VALUE;
}

export function buildBookAnotherServiceNavigate(input: {
  serviceId?: string;
  date?: string;
}): BookAnotherServiceNavigate {
  const query: Record<string, string> = {
    [FRESH_BOOK_QUERY_KEY]: FRESH_BOOK_QUERY_VALUE,
  };
  const date = input.date?.trim().slice(0, 10);
  if (date) query.date = date;

  const serviceId = input.serviceId?.trim();
  if (serviceId) {
    return {
      path: 'checkout',
      query: { ...query, serviceId },
    };
  }

  return { path: 'services', query };
}

export function buildBookAnotherServiceSummary(input: {
  serviceName?: string | null;
  date?: string | null;
}): string {
  if (input.serviceName && input.date) {
    return `Opening a fresh booking flow for ${input.serviceName} on ${input.date} — your previous success screen will reset.`;
  }
  if (input.date) {
    return `Opening the service list for ${input.date} — your previous success screen will reset so you can book again.`;
  }
  return 'Opening the service list with a fresh booking flow — your previous success screen will reset.';
}
