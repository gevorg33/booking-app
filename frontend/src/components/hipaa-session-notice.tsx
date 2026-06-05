'use client';

import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { useHipaaComplianceStatus } from '@/lib/use-hipaa-session-timeout';

export function HipaaSessionNotice() {
  const { token } = useAuthStore();
  const { t } = useI18n();
  const { data: hipaaStatus } = useHipaaComplianceStatus();

  const enforced =
    Boolean(token) &&
    hipaaStatus?.enabled === true &&
    hipaaStatus.sessionTimeoutEnforced === true;

  if (!enforced || !hipaaStatus) {
    return null;
  }

  const minutes = hipaaStatus.sessionTimeoutMinutes;
  const timeoutMs = minutes * 60 * 1000;

  return (
    <div
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
      role="status"
    >
      {t('settings.hipaaSessionNotice').replace('{minutes}', String(minutes))}
      <span className="sr-only">{timeoutMs}</span>
    </div>
  );
}
