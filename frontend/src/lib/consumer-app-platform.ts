export type ConsumerMobilePlatform = 'ios' | 'android' | 'other';

/** Best-effort UA detection for store CTAs on public booking pages. */
export function detectConsumerMobilePlatform(options?: {
  userAgent?: string;
}): ConsumerMobilePlatform {
  const ua = options?.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (!ua) return 'other';
  if (/android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return 'other';
}
