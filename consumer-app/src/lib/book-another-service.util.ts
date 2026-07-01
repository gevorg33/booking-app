export const FRESH_BOOK_QUERY_KEY = 'freshBook';
export const FRESH_BOOK_QUERY_VALUE = '1';

export function isFreshBookQueryParam(value: string | null | undefined): boolean {
  return value === FRESH_BOOK_QUERY_VALUE;
}

export function shouldResetBookPageSuccessState(
  search: string | URLSearchParams,
): boolean {
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search;
  return isFreshBookQueryParam(params.get(FRESH_BOOK_QUERY_KEY));
}

export function stripFreshBookQueryParam(search: string): string {
  const params = new URLSearchParams(search);
  if (!params.has(FRESH_BOOK_QUERY_KEY)) return search;
  params.delete(FRESH_BOOK_QUERY_KEY);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
