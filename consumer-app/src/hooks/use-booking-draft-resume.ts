import { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import {
  clearBookingDraft,
  isBookingDraftStale,
  loadBookingDraft,
} from '../lib/booking-draft.util.js';
import {
  resolveAbandonedBookingRedirectPath,
  shouldRedirectToAbandonedBooking,
} from '../lib/booking-draft-resume.util.js';
import {
  buildBookingResumeEventProps,
  peekResumableBookingDraft,
} from '../lib/activation-instrumentation.util.js';
import { track } from '../lib/app-analytics.js';

/** Resume an unfinished booking on next open (adopt-3.6 / n99-3.4). */
export function useBookingDraftResume(): void {
  const history = useHistory();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    const draft = loadBookingDraft();
    const stale = draft ? isBookingDraftStale(draft) : false;
    if (draft && stale) {
      clearBookingDraft();
      return;
    }

    const resumable = peekResumableBookingDraft();
    if (!resumable) return;

    if (
      !shouldRedirectToAbandonedBooking({
        pathname: window.location.pathname + window.location.search,
        draft: resumable,
        stale: false,
      })
    ) {
      return;
    }

    track('booking_resumed', {
      ...buildBookingResumeEventProps(resumable),
      firstRunRedirect: 'abandonment_resume',
    });
    history.replace(resolveAbandonedBookingRedirectPath(resumable));
  }, [history]);
}

export { peekResumableBookingDraft };
