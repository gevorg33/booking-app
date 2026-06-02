export type ConsumerMobilePlatform = 'ios' | 'android' | 'other';

/** Best-effort UA detection for store CTAs on public booking pages. */
export function detectConsumerMobilePlatform(): ConsumerMobilePlatform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return 'other';
}
