'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { HIPAA_INACTIVITY_EVENTS } from '@/lib/hipaa-session-timeout';
import { useAuthStore } from '@/lib/store';

interface ComplianceHipaaStatus {
  enabled: boolean;
  sessionTimeoutMinutes: number;
  sessionTimeoutEnforced: boolean;
}

async function fetchHipaaComplianceStatus(
  businessId: string,
): Promise<ComplianceHipaaStatus> {
  const { data } = await api.get(`/businesses/${businessId}/compliance/status`);
  const payload = (data as { data?: { hipaa: ComplianceHipaaStatus } })?.data ?? data;
  return (payload as { hipaa: ComplianceHipaaStatus }).hipaa;
}

export function useHipaaComplianceStatus() {
  const { business, token } = useAuthStore();
  return useQuery({
    queryKey: ['compliance-hipaa-session', business?.id],
    queryFn: () => fetchHipaaComplianceStatus(business!.id),
    enabled: Boolean(business?.id && token),
    staleTime: 60_000,
  });
}

/** Auto-logout after HIPAA inactivity timeout when mode is enabled. */
export function useHipaaSessionTimeout(): void {
  const { logout, token } = useAuthStore();
  const { data: hipaaStatus } = useHipaaComplianceStatus();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const enforced =
      Boolean(token) &&
      hipaaStatus?.enabled === true &&
      hipaaStatus.sessionTimeoutEnforced === true;
    if (!enforced) return;

    const timeoutMs = hipaaStatus.sessionTimeoutMinutes * 60 * 1000;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout();
      }, timeoutMs);
    };

    HIPAA_INACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, reset, { passive: true }),
    );
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      HIPAA_INACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, reset),
      );
    };
  }, [hipaaStatus, logout, token]);
}
