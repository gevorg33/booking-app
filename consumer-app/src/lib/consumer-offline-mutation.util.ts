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
