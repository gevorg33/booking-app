'use client';

import { useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { notifyPublicCustomerBookingRunningLate } from '@/lib/public-api';
import {
  ACCOUNT_RUNNING_LATE_DEFAULT_MINUTES,
  ACCOUNT_RUNNING_LATE_MINUTE_OPTIONS,
  shouldShowAccountRunningLateCta,
} from '@/lib/account-running-late.util';
import { useI18n } from '@/i18n';

interface AccountRunningLateButtonProps {
  slug: string;
  bookingId: string;
  status: string;
  startTime: string;
  endTime: string;
  signedIn: boolean;
  primary: string;
  onNotified?: () => void;
}

/** e2e-bug.221 — signed-in customer notifies salon they are running late. */
export function AccountRunningLateButton({
  slug,
  bookingId,
  status,
  startTime,
  endTime,
  signedIn,
  primary,
  onNotified,
}: AccountRunningLateButtonProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [minutesLate, setMinutesLate] = useState(ACCOUNT_RUNNING_LATE_DEFAULT_MINUTES);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (
    !shouldShowAccountRunningLateCta({
      signedIn,
      status,
      startTime,
      endTime,
    })
  ) {
    return null;
  }

  async function handleNotify() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await notifyPublicCustomerBookingRunningLate(
        slug,
        bookingId,
        minutesLate,
      );
      setSuccess(
        t('public.runningLateSuccess', { minutes: result.minutesLate }),
      );
      setOpen(false);
      onNotified?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('public.runningLateFailed'),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        data-testid="account-running-late"
        data-booking-id={bookingId}
        aria-expanded={open}
        disabled={busy}
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
        {t('public.runningLate')}
      </button>

      {open && (
        <div
          className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3"
          data-testid="account-running-late-panel"
        >
          <p className="text-sm text-gray-700">{t('public.runningLateHint')}</p>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_RUNNING_LATE_MINUTE_OPTIONS.map((mins) => {
              const selected = minutesLate === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  data-testid={`account-running-late-mins-${mins}`}
                  onClick={() => setMinutesLate(mins)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    selected
                      ? 'border-transparent text-white'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                  style={selected ? { backgroundColor: primary } : undefined}
                >
                  {t('public.runningLateMinutes', { minutes: mins })}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            data-testid="account-running-late-confirm"
            onClick={() => void handleNotify()}
            disabled={busy}
            className="w-full py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: primary }}
          >
            {busy ? t('public.submitting') : t('public.confirmRunningLate')}
          </button>
        </div>
      )}

      {success && (
        <p
          className="text-sm text-green-700"
          data-testid="account-running-late-success"
        >
          {success}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" data-testid="account-running-late-error">
          {error}
        </p>
      )}
    </div>
  );
}
