'use client';

import { AlertTriangle, CalendarPlus, CalendarX, ArrowRightLeft, Sparkles } from 'lucide-react';

export interface PlanDiffStep {
  id: string;
  action: string;
  description: string;
  impact: string;
  estimatedImpact?: string;
}

export interface PolicyPreview {
  decision: string;
  riskLevel: string;
  violations: string[];
  reasons: string[];
}

const ACTION_ICON: Record<string, typeof Sparkles> = {
  cancel_bookings: CalendarX,
  reschedule_booking: ArrowRightLeft,
  fill_schedule_gaps: CalendarPlus,
  apply_template: CalendarPlus,
  detect_conflicts: AlertTriangle,
};

export function PlanDiffPreview({
  steps,
  policyPreview,
}: {
  steps: PlanDiffStep[];
  policyPreview?: PolicyPreview;
}) {
  if (!steps.length) return null;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-3 space-y-3">
      <p className="text-xs font-semibold text-violet-300 uppercase tracking-wide">Plan preview</p>

      {policyPreview && (
        <div className="rounded-md border border-amber-700/40 bg-amber-950/20 p-2 text-xs">
          <p className="text-amber-200">
            Policy: {policyPreview.decision.replace(/_/g, ' ')} · risk {policyPreview.riskLevel}
          </p>
          {policyPreview.violations.length > 0 && (
            <ul className="mt-1 text-amber-100/80 list-disc list-inside">
              {policyPreview.violations.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          )}
        </div>
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

interface ConflictResolutionData {
  conflicts?: Array<{
    employeeName?: string;
    bookings?: Array<{ id: string; customerName: string; serviceName?: string; startTime: string; endTime: string }>;
  }>;
  resolutions?: Array<{
    id: string;
    employeeName?: string;
    overlapMinutes?: number;
    bookings?: Array<{ id: string; customer: string; service?: string; startTime: string; endTime: string }>;
    action: string;
    fix?: { type: string; bookingId: string; startTime: string } | null;
  }>;
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
  if (!data.conflicts?.length && !data.resolutions?.length) return null;

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-950/10 p-4 space-y-4">
      <h3 className="font-semibold text-red-200 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        Conflict resolution workspace
      </h3>

      {(data.resolutions ?? data.conflicts ?? []).map((item: any, idx: number) => (
        <div key={item.id ?? idx} className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
          <p className="text-sm font-medium text-gray-200">
            {item.employeeName ?? 'Provider'}
            {item.overlapMinutes != null ? ` · ${item.overlapMinutes} min overlap` : ''}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(item.bookings ?? []).map((b: any) => (
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
              onClick={() => onApplyFix(item.id, item.fix)}
            >
              {applyingId === item.id ? 'Applying…' : 'Apply suggested fix'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

interface CancellationRecoveryData {
  freedSlots?: Array<{
    bookingId: string;
    employeeName?: string;
    serviceName?: string;
    customerName?: string;
    startTime: string;
    endTime: string;
  }>;
  candidates?: Array<{
    customerName: string;
    source: string;
    score: number;
    suggestion: string;
  }>;
  proposals?: Array<{
    id: string;
    slot: CancellationRecoveryData['freedSlots'] extends (infer T)[] | undefined ? T : never;
    recommendedCustomer?: { customerName: string; source: string; score: number } | null;
  }>;
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
  if (!data.freedSlots?.length && !data.candidates?.length && !data.proposals?.length) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-950/10 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-amber-200">Cancellation recovery</h3>
        {onRebookAll && (data.proposals?.length ?? 0) > 0 && (
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
            disabled={rebooking}
            onClick={onRebookAll}
          >
            {rebooking ? 'Rebooking…' : 'Rebook all'}
          </button>
        )}
      </div>

      {data.freedSlots && data.freedSlots.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Freed slots</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.freedSlots.map((slot) => (
              <div key={slot.bookingId} className="rounded-md bg-gray-900/60 border border-gray-700 p-2 text-xs">
                <p className="text-gray-200">{slot.serviceName ?? 'Appointment'}</p>
                <p className="text-gray-500">{slot.employeeName} · {slot.customerName ?? 'Walk-in'}</p>
                <p className="text-gray-500">{new Date(slot.startTime).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.proposals && data.proposals.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Waitlist / rebooking candidates</p>
          <div className="space-y-2">
            {data.proposals.map((p) => (
              <div key={p.id} className="rounded-md bg-gray-900/60 border border-gray-700 p-2 text-xs">
                <p className="text-gray-200">
                  {p.recommendedCustomer
                    ? `${p.recommendedCustomer.customerName} (${p.recommendedCustomer.source}, score ${p.recommendedCustomer.score})`
                    : 'No automatic match — manual outreach needed'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
