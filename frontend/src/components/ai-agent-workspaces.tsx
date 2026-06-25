'use client';

import { AlertTriangle, CalendarPlus, CalendarX, ArrowRightLeft, Sparkles, EyeOff, Eye } from 'lucide-react';
import { useI18n } from '@/i18n';
import { AiPolicyRiskBadge } from '@/components/ai-policy-risk-badge';
import type {
  AiCancellationRecoveryData,
  AiConflictResolutionData,
  AiPlanDiffStep,
  AiPolicyExplain,
  AiPolicyPreview,
} from '@/lib/ai-client.types';

export type PlanDiffStep = AiPlanDiffStep;
export type PolicyPreview = AiPolicyPreview;
export type PolicyExplain = AiPolicyExplain;
export type ConflictResolutionData = AiConflictResolutionData;
export type CancellationRecoveryData = AiCancellationRecoveryData;

interface ConflictWorkspaceBooking {
  id: string;
  customer?: string;
  customerName?: string;
  service?: string;
  serviceName?: string;
  startTime: string;
  endTime: string;
}

interface ConflictWorkspaceItem {
  id?: string;
  employeeName?: string;
  overlapMinutes?: number;
  bookings?: ConflictWorkspaceBooking[];
  fix?: { type: string; bookingId: string; startTime: string };
}

const ACTION_ICON: Record<string, typeof Sparkles> = {
  cancel_bookings: CalendarX,
  hide_appointments_from_calendar: EyeOff,
  unhide_appointments_from_calendar: Eye,
  reschedule_booking: ArrowRightLeft,
  fill_schedule_gaps: CalendarPlus,
  apply_template: CalendarPlus,
  detect_conflicts: AlertTriangle,
};

export function PlanDiffPreview({
  steps,
  policyPreview,
  policyExplain,
}: {
  steps: PlanDiffStep[];
  policyPreview?: PolicyPreview;
  policyExplain?: PolicyExplain;
}) {
  const { t } = useI18n();
  if (!steps.length) return null;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-3 space-y-3">
      <p className="text-xs font-semibold text-violet-300 uppercase tracking-wide">
        {t('ai.planPreviewTitle')}
      </p>

      {policyExplain ? (
        <AiPolicyRiskBadge explain={policyExplain} />
      ) : (
        policyPreview && (
          <div className="rounded-md border border-amber-700/40 bg-amber-950/20 p-2 text-xs">
            <p className="text-amber-200">
              {t('ai.planPolicy', {
                decision: policyPreview.decision.replace(/_/g, ' '),
                risk: policyPreview.riskLevel,
              })}
            </p>
            {policyPreview.violations.length > 0 && (
              <ul className="mt-1 text-amber-100/80 list-disc list-inside">
                {policyPreview.violations.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            )}
          </div>
        )
      )}

      <div className="space-y-2">
        {steps.map((step, index) => {
          const Icon = ACTION_ICON[step.action] ?? Sparkles;
          return (
            <div key={step.id} className="flex gap-2 text-sm">
              <span className="text-gray-500 w-5 shrink-0">{index + 1}.</span>
              <Icon className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-200">{step.description}</p>
                <p className="text-xs text-gray-500">{step.impact}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ConflictResolutionWorkspace({
  data,
  onApplyFix,
  applyingId,
}: {
  data: ConflictResolutionData;
  onApplyFix?: (resolutionId: string, fix: NonNullable<ConflictResolutionData['resolutions']>[number]['fix']) => void;
  applyingId?: string | null;
}) {
  const { t } = useI18n();
  if (!data.conflicts?.length && !data.resolutions?.length) return null;

  const items: ConflictWorkspaceItem[] = [
    ...(data.resolutions ?? []).map((item) => ({
      id: item.id,
      employeeName: item.employeeName,
      overlapMinutes: item.overlapMinutes,
      bookings: item.bookings,
      fix: item.fix ?? undefined,
    })),
    ...(data.conflicts ?? []).map((item, idx) => ({
      id: item.id ?? `conflict-${idx}`,
      employeeName: item.employeeName,
      overlapMinutes: item.overlapMinutes,
      bookings: item.bookings,
      fix: item.fix ?? undefined,
    })),
  ];

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-950/10 p-4 space-y-4">
      <h3 className="font-semibold text-red-200 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        {t('ai.conflictWorkspaceTitle')}
      </h3>

      {items.map((item, idx) => (
        <div key={item.id ?? idx} className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
          <p className="text-sm font-medium text-gray-200">
            {item.employeeName ?? t('ai.providerFallback')}
            {item.overlapMinutes != null
              ? t('ai.overlapMinutes', { minutes: item.overlapMinutes })
              : ''}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(item.bookings ?? []).map((b: ConflictWorkspaceBooking) => (
              <div key={b.id} className="rounded-md bg-gray-800/80 p-2 text-xs">
                <p className="text-gray-200">{b.customer ?? b.customerName}</p>
                <p className="text-gray-500">{b.service ?? b.serviceName}</p>
                <p className="text-gray-500">
                  {new Date(b.startTime).toLocaleString()} – {new Date(b.endTime).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
          {item.fix && onApplyFix && (
            <button
              type="button"
              className="mt-3 text-xs px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
              disabled={applyingId === item.id}
              onClick={() => {
                if (item.id) onApplyFix(item.id, item.fix);
              }}
            >
              {applyingId === item.id ? t('ai.applying') : t('ai.applySuggestedFix')}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function CancellationRecoveryBoard({
  data,
  onRebookAll,
  rebooking,
}: {
  data: CancellationRecoveryData;
  onRebookAll?: () => void;
  rebooking?: boolean;
}) {
  const { t } = useI18n();
  if (!data.freedSlots?.length && !data.candidates?.length && !data.proposals?.length) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-950/10 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-amber-200">{t('ai.recoveryTitle')}</h3>
        {onRebookAll && (data.proposals?.length ?? 0) > 0 && (
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
            disabled={rebooking}
            onClick={onRebookAll}
          >
            {rebooking ? t('ai.rebooking') : t('ai.rebookAll')}
          </button>
        )}
      </div>

      {data.freedSlots && data.freedSlots.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">{t('ai.freedSlots')}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.freedSlots.map((slot) => (
              <div key={slot.bookingId} className="rounded-md bg-gray-900/60 border border-gray-700 p-2 text-xs">
                <p className="text-gray-200">{slot.serviceName ?? t('ai.appointmentFallback')}</p>
                <p className="text-gray-500">
                  {slot.employeeName} · {slot.customerName ?? t('ai.walkIn')}
                </p>
                <p className="text-gray-500">{new Date(slot.startTime).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.proposals && data.proposals.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">{t('ai.recoveryCandidates')}</p>
          <div className="space-y-2">
            {data.proposals.map((p) => (
              <div key={p.id} className="rounded-md bg-gray-900/60 border border-gray-700 p-2 text-xs">
                <p className="text-gray-200">
                  {p.recommendedCustomer
                    ? t('ai.recoveryCustomerScore', {
                        name: p.recommendedCustomer.customerName,
                        source: p.recommendedCustomer.source,
                        score: p.recommendedCustomer.score,
                      })
                    : t('ai.recoveryNoMatch')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
