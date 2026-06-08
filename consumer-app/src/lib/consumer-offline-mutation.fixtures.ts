/** adopt-5.3 — consumer offline mutation URL allowlist. */

import { isOfflineMutation } from './offline-queue-core.util.js';

const MANAGE_CANCEL = /\/public\/[^/]+\/bookings\/manage\/cancel$/;
const MANAGE_RESCHEDULE = /\/public\/[^/]+\/bookings\/manage\/reschedule$/;
const MANAGE_PACKAGE_CANCEL = /\/public\/[^/]+\/bookings\/manage\/package\/cancel$/;
const MANAGE_PACKAGE_RESCHEDULE = /\/public\/[^/]+\/bookings\/manage\/package\/reschedule$/;
const ACCOUNT_CANCEL = /\/public\/[^/]+\/me\/bookings\/[^/]+\/cancel$/;
const ACCOUNT_RESCHEDULE = /\/public\/[^/]+\/me\/bookings\/[^/]+\/reschedule$/;
const ACCOUNT_PACKAGE_CANCEL = /\/public\/[^/]+\/me\/bookings\/[^/]+\/package\/cancel$/;
const ACCOUNT_PACKAGE_RESCHEDULE = /\/public\/[^/]+\/me\/bookings\/[^/]+\/package\/reschedule$/;

export const CONSUMER_OFFLINE_MUTATION_SCENARIOS = [
  { id: 'manage-cancel', method: 'post', url: '/public/demo-salon/bookings/manage/cancel', queued: true },
  { id: 'manage-reschedule', method: 'post', url: '/public/demo-salon/bookings/manage/reschedule', queued: true },
  { id: 'manage-package-cancel', method: 'post', url: '/public/demo-salon/bookings/manage/package/cancel', queued: true },
  { id: 'manage-package-reschedule', method: 'post', url: '/public/demo-salon/bookings/manage/package/reschedule', queued: true },
  { id: 'account-cancel', method: 'post', url: '/public/demo-salon/me/bookings/b-1/cancel', queued: true },
  { id: 'account-reschedule', method: 'post', url: '/public/demo-salon/me/bookings/b-1/reschedule', queued: true },
  { id: 'account-package-cancel', method: 'post', url: '/public/demo-salon/me/bookings/b-1/package/cancel', queued: true },
  { id: 'account-package-reschedule', method: 'post', url: '/public/demo-salon/me/bookings/b-1/package/reschedule', queued: true },
  { id: 'create-booking', method: 'post', url: '/public/demo-salon/bookings', queued: false },
  { id: 'read-profile', method: 'get', url: '/public/demo-salon', queued: false },
] as const;

/** Whether a failed consumer mutation should be queued for replay (adopt-5.3). */
export function shouldQueueConsumerOfflineMutation(method?: string, url?: string): boolean {
  if (!isOfflineMutation(method)) return false;
  const path = (url ?? '').split('?')[0];
  if (!path) return false;
  return (
    MANAGE_CANCEL.test(path) ||
    MANAGE_RESCHEDULE.test(path) ||
    MANAGE_PACKAGE_CANCEL.test(path) ||
    MANAGE_PACKAGE_RESCHEDULE.test(path) ||
    ACCOUNT_CANCEL.test(path) ||
    ACCOUNT_RESCHEDULE.test(path) ||
    ACCOUNT_PACKAGE_CANCEL.test(path) ||
    ACCOUNT_PACKAGE_RESCHEDULE.test(path)
  );
}
