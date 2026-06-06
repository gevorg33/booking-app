'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/lib/store';
import {
  DEFAULT_BUSINESS_HIPAA_SETTINGS,
  isClinicBusinessType,
  readBusinessHipaaSettings,
  readBusinessPrivacySettings,
} from '@/lib/business-compliance';
import { fetchBusinessSettings, unwrapBusinessApiPayload } from '@/lib/business-query';
import {
  canSubmitBreachReport,
  isBusinessOwner,
} from '@/lib/compliance-workflow';
import {
  resolveCompliancePanelFromSearch,
  scrollToCompliancePanel,
} from '@/lib/compliance-dashboard-nav';
import { useSearchParams } from 'next/navigation';

interface BreachIncident {
  id: string;
  description: string;
  reportedAt: string;
  affectedCustomerCount: number;
  draftEmailSubject: string;
  draftEmailBody: string;
  gdprNotificationDeadlineAt: string;
  gdprDeadlineApproaching?: boolean;
  gdprDeadlineOverdue?: boolean;
}

interface ComplianceStatusSummary {
  gdpr: {
    retentionConfigured: boolean;
    cookieBannerEnabled: boolean;
    granularConsentEnabled: boolean;
    privacyPolicyVersion: string;
    dataResidencyRegion: string;
  };
  hipaa: {
    eligible: boolean;
    enabled: boolean;
    baaSigned: boolean;
    sessionTimeoutMinutes: number;
    sessionTimeoutEnforced: boolean;
    phiEncryptionConfigured: boolean;
    minimumAccessEnforced: boolean;
    aiPhiGuardEnabled: boolean;
  };
}

interface PhiAccessAuditEntry {
  id: string;
  userId: string | null;
  role: string;
  action: 'read' | 'write';
  resourceType: string;
  resourceId: string;
  fieldName: string | null;
  ip: string | null;
  createdAt: string;
}

const SUB_PROCESSORS = [
  { name: 'Amazon Web Services (AWS)', region: 'EU / US' },
  { name: 'Stripe', region: 'Global' },
  { name: 'OpenAI / Anthropic / Google', region: 'US' },
  { name: 'Twilio', region: 'Global' },
  { name: 'Resend / SendGrid', region: 'US / EU' },
  { name: 'Firebase (Google)', region: 'Global' },
];

export function BusinessComplianceSettings({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const { user, businesses } = useAuthStore();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [hipaa, setHipaa] = useState(DEFAULT_BUSINESS_HIPAA_SETTINGS);
  const [baaAccepted, setBaaAccepted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [breachDescription, setBreachDescription] = useState('');
  const [breachAffectedCount, setBreachAffectedCount] = useState(0);
  const [breachReported, setBreachReported] = useState(false);

  const isOwner = isBusinessOwner(
    businesses.find((entry) => entry.id === businessId)?.membershipRole,
  );

  const { data: businessData, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}`);
      return unwrapBusinessApiPayload<{ settings?: Record<string, unknown> }>(data);
    },
  });

  const businessType = businessData?.settings?.businessType as string | undefined;
  const clinicEligible = isClinicBusinessType(businessType);
  const privacy = readBusinessPrivacySettings(businessData?.settings);

  useEffect(() => {
    if (!businessData?.settings) return;
    const current = readBusinessHipaaSettings(businessData.settings);
    queueMicrotask(() => {
      setHipaa(current);
      setBaaAccepted(Boolean(current.baaAcceptedAt));
    });
  }, [businessData]);

  useEffect(() => {
    const panel = resolveCompliancePanelFromSearch(
      searchParams.get('panel'),
      searchParams.get('section'),
    );
    if (!panel) return;
    const timer = window.setTimeout(() => scrollToCompliancePanel(panel), 150);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const { data: complianceStatus } = useQuery({
    queryKey: ['compliance-status', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/compliance/status`);
      return unwrapBusinessApiPayload<ComplianceStatusSummary>(data);
    },
  });

  const { data: breachIncidents = [], refetch: refetchBreaches } = useQuery({
    queryKey: ['compliance-breaches', businessId],
    enabled: isOwner,
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/compliance/breach-incidents`,
      );
      return unwrapBusinessApiPayload<BreachIncident[]>(data);
    },
  });

  const { data: phiAuditData } = useQuery({
    queryKey: ['compliance-phi-audit', businessId],
    enabled: isOwner && clinicEligible && hipaa.enabled,
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/compliance/phi-access-audit`,
        { params: { limit: 50, offset: 0 } },
      );
      return unwrapBusinessApiPayload<{
        items: PhiAccessAuditEntry[];
        total: number;
      }>(data);
    },
  });

  const reportBreachMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(
        `/businesses/${businessId}/compliance/breach-incidents`,
        {
          description: breachDescription.trim(),
          affectedCustomerCount: breachAffectedCount,
        },
      );
      return data;
    },
    onSuccess: () => {
      setBreachDescription('');
      setBreachAffectedCount(0);
      setBreachReported(true);
      void refetchBreaches();
      window.setTimeout(() => setBreachReported(false), 3000);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = await fetchBusinessSettings(businessId);
      const nextHipaa = {
        ...hipaa,
        enabled: hipaa.enabled && clinicEligible && baaAccepted,
        ...(baaAccepted && !hipaa.baaAcceptedAt
          ? {
              baaAcceptedAt: new Date().toISOString(),
              baaAcceptedByUserId: user?.id ?? null,
              baaVersion: hipaa.baaVersion ?? '1.0',
            }
          : {}),
      };
      const { data } = await api.put(`/businesses/${businessId}`, {
        settings: { ...current, hipaa: nextHipaa },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6" id="compliance-overview">
      <div>
        <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">
          {t('settings.complianceSection')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('settings.complianceDescription')}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-2">
        <p className="text-sm font-medium">{t('settings.complianceStatusTitle')}</p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>
            {privacy.cookieBanner.enabled
              ? t('settings.complianceStatus.cookieOn')
              : t('settings.complianceStatus.cookieOff')}
          </li>
          <li>
            {t('settings.complianceStatus.privacyVersion', {
              version: privacy.privacyPolicyVersion,
            })}
          </li>
          <li>
            {t('settings.complianceStatus.residency', {
              region: t(`settings.dataResidency.${privacy.dataResidencyRegion}`),
            })}
          </li>
        </ul>
      </div>

      {complianceStatus?.hipaa.eligible ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-2">
          <p className="text-sm font-medium">{t('settings.complianceHipaaStatusTitle')}</p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>
              {complianceStatus.hipaa.enabled
                ? t('settings.hipaaEnabled')
                : t('settings.hipaaNotEligible')}
            </li>
            {complianceStatus.hipaa.enabled ? (
              <>
                <li>
                  {complianceStatus.hipaa.phiEncryptionConfigured
                    ? t('settings.complianceHipaaEncryptionOn')
                    : t('settings.complianceHipaaEncryptionPending')}
                </li>
                <li>{t('settings.complianceHipaaMinimumAccess')}</li>
                <li>{t('settings.complianceHipaaAiGuard')}</li>
                <li>
                  {t('settings.complianceHipaaSessionTimeoutActive').replace(
                    '{minutes}',
                    String(complianceStatus.hipaa.sessionTimeoutMinutes),
                  )}
                </li>
              </>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div
        id="compliance-sub-processors"
        className="rounded-xl border border-gray-200 dark:border-gray-800 p-4"
      >
        <p className="text-sm font-medium mb-2">{t('settings.subProcessorsTitle')}</p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          {SUB_PROCESSORS.map((sp) => (
            <li key={sp.name}>
              {sp.name} — {sp.region}
            </li>
          ))}
        </ul>
      </div>

      {clinicEligible ? (
        <div
          id="compliance-hipaa"
          className="space-y-4 border-t border-gray-200 dark:border-gray-800 pt-4"
        >
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {t('settings.hipaaSection')}
          </h3>
          <p className="text-sm text-gray-500">{t('settings.hipaaDescription')}</p>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={baaAccepted}
              onChange={(e) => setBaaAccepted(e.target.checked)}
            />
            <span>{t('settings.hipaaBaaAccept')}</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hipaa.enabled}
              disabled={!baaAccepted}
              onChange={(e) =>
                setHipaa((h) => ({ ...h, enabled: e.target.checked }))
              }
            />
            {t('settings.hipaaEnabled')}
          </label>

          <div>
            <label className="label" htmlFor="hipaa-timeout">
              {t('settings.hipaaSessionTimeout')}
            </label>
            <input
              id="hipaa-timeout"
              type="number"
              min={5}
              max={60}
              className="input w-full max-w-xs"
              value={hipaa.sessionTimeoutMinutes}
              onChange={(e) =>
                setHipaa((h) => ({
                  ...h,
                  sessionTimeoutMinutes: Number(e.target.value) || 15,
                }))
              }
            />
          </div>

          <button
            type="button"
            className="btn-primary text-sm"
            disabled={saveMutation.isPending || (hipaa.enabled && !baaAccepted)}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? t('common.saving') : t('settings.saveCompliance')}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t('settings.hipaaNotEligible')}</p>
      )}

      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400">
          {t('settings.complianceSaved')}
        </p>
      )}

      {isOwner ? (
        <div
          id="compliance-breach"
          className="space-y-4 border-t border-gray-200 dark:border-gray-800 pt-4"
        >
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {t('settings.breachSection')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t('settings.breachDescription')}
            </p>
            <p className="text-xs text-gray-400 mt-1">{t('settings.ownerOnlyNotice')}</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label" htmlFor="breach-description">
                {t('settings.breachDescriptionLabel')}
              </label>
              <textarea
                id="breach-description"
                className="input w-full min-h-[120px]"
                value={breachDescription}
                onChange={(e) => setBreachDescription(e.target.value)}
                placeholder={t('settings.breachDescriptionPlaceholder')}
              />
            </div>
            <div>
              <label className="label" htmlFor="breach-affected">
                {t('settings.breachAffectedCount')}
              </label>
              <input
                id="breach-affected"
                type="number"
                min={0}
                className="input w-full max-w-xs"
                value={breachAffectedCount}
                onChange={(e) =>
                  setBreachAffectedCount(Math.max(0, Number(e.target.value) || 0))
                }
              />
            </div>
            <button
              type="button"
              className="btn-primary text-sm"
              disabled={
                reportBreachMutation.isPending ||
                !canSubmitBreachReport(breachDescription)
              }
              onClick={() => reportBreachMutation.mutate()}
            >
              {reportBreachMutation.isPending
                ? t('settings.breachReporting')
                : t('settings.breachReportButton')}
            </button>
            {breachReported && (
              <p className="text-sm text-green-600 dark:text-green-400">
                {t('settings.breachReported')}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
            <p className="text-sm font-medium">{t('settings.breachIncidentsTitle')}</p>
            {breachIncidents.length === 0 ? (
              <p className="text-sm text-gray-500">{t('settings.breachNoIncidents')}</p>
            ) : (
              <ul className="space-y-4">
                {breachIncidents.map((incident) => (
                  <li
                    key={incident.id}
                    className="text-sm border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0"
                  >
                    <p className="text-gray-700 dark:text-gray-300">{incident.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(incident.reportedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('settings.breachDeadline').replace(
                        '{deadline}',
                        new Date(incident.gdprNotificationDeadlineAt).toLocaleString(),
                      )}
                    </p>
                    {incident.gdprDeadlineOverdue && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {t('settings.breachDeadlineOverdue')}
                      </p>
                    )}
                    {incident.gdprDeadlineApproaching && !incident.gdprDeadlineOverdue && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        {t('settings.breachDeadlineApproaching')}
                      </p>
                    )}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-500">
                        {t('settings.breachDraftSubject')}
                      </summary>
                      <p className="mt-1 font-medium">{incident.draftEmailSubject}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {t('settings.breachDraftBody')}
                      </p>
                      <pre className="mt-1 whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded">
                        {incident.draftEmailBody}
                      </pre>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {isOwner && clinicEligible && hipaa.enabled ? (
        <div
          id="compliance-phi-audit"
          className="space-y-3 border-t border-gray-200 dark:border-gray-800 pt-4"
        >
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {t('settings.phiAuditSection')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t('settings.phiAuditDescription')}
            </p>
          </div>
          {!phiAuditData?.items?.length ? (
            <p className="text-sm text-gray-500">{t('settings.phiAuditEmpty')}</p>
          ) : (
            <ul className="text-sm space-y-2">
              {phiAuditData.items.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2"
                >
                  <span className="font-medium">
                    {entry.action === 'read'
                      ? t('settings.phiAuditActionRead')
                      : t('settings.phiAuditActionWrite')}
                  </span>
                  {' · '}
                  {entry.fieldName ?? entry.resourceType} · {entry.resourceId.slice(0, 8)}
                  <p className="text-xs text-gray-500 mt-1">
                    {entry.role} · {new Date(entry.createdAt).toLocaleString()}
                    {entry.ip ? ` · ${entry.ip}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
