import { Capacitor } from '@capacitor/core';
import { IonAlert, IonButton, IonIcon, IonModal } from '@ionic/react';
import { star, starOutline } from 'ionicons/icons';
import { useCallback, useEffect, useState } from 'react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { track } from '../lib/app-analytics.js';
import {
  buildDefaultSupportTicketMessage,
  buildPublicSupportUrl,
  markPostVisitReviewPrompted,
  resolvePostBookingSupportHandoff,
  resolveStoreReviewUrl,
  type PostBookingSatisfactionChoice,
} from '../lib/store-review-prompt.util.js';
import { createPostBookingSupportTicket, submitCustomerReview } from '../services/public-api.js';
import type { PublicCustomerBookingItem } from '../lib/types.js';

type PromptStep = 'satisfaction' | 'rating' | 'support-followup';

export function PostVisitReviewPrompt({
  isOpen,
  slug,
  booking,
  copy,
  customerToken,
  customerEmail,
  zendeskWidgetConfigured,
  onClose,
  onReviewSubmitted,
  openSupportImmediately = false,
}: {
  isOpen: boolean;
  slug: string;
  booking: Pick<PublicCustomerBookingItem, 'id' | 'serviceName'>;
  copy: ConsumerCopy;
  customerToken: string | null;
  customerEmail?: string | null;
  zendeskWidgetConfigured?: boolean;
  onClose: () => void;
  onReviewSubmitted?: () => void;
  /** Skip satisfaction prompt and open post-booking support handoff (AI navigate fallback). */
  openSupportImmediately?: boolean;
}) {
  const [step, setStep] = useState<PromptStep>('satisfaction');
  const [followUpMessage, setFollowUpMessage] = useState<string | null>(null);
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('satisfaction');
    setFollowUpMessage(null);
    setRating(0);
    setReviewError(null);
    track('review_prompt_shown', { bookingId: booking.id, slug });
  }, [booking.id, isOpen, slug]);

  const finish = useCallback(
    (choice: PostBookingSatisfactionChoice) => {
      markPostVisitReviewPrompted(booking.id);
      onClose();
      if (choice === 'great') {
        onReviewSubmitted?.();
      }
    },
    [booking.id, onClose, onReviewSubmitted],
  );

  const openStoreReview = useCallback(() => {
    const platform = Capacitor.getPlatform();
    const storeUrl = resolveStoreReviewUrl(
      platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'web',
    );
    if (storeUrl) {
      track('store_review_opened', { bookingId: booking.id, slug, platform });
      window.open(storeUrl, '_blank');
    }
  }, [booking.id, slug]);

  const submitTenantReview = useCallback(async () => {
    if (!customerToken || rating < 1) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      await submitCustomerReview(slug, booking.id, { rating });
      track('tenant_review_submitted', {
        bookingId: booking.id,
        slug,
        rating,
      });
      openStoreReview();
      finish('great');
    } catch {
      setReviewError(copy.postBookingReviewSubmitFailed);
    } finally {
      setSubmittingReview(false);
    }
  }, [
    booking.id,
    copy.postBookingReviewSubmitFailed,
    customerToken,
    finish,
    openStoreReview,
    rating,
    slug,
  ]);

  const openSupportWeb = useCallback(() => {
    const url = buildPublicSupportUrl(slug, booking.id);
    if (url) window.open(url, '_blank');
    finish('unhappy');
  }, [booking.id, finish, slug]);

  const submitSupportTicket = useCallback(async () => {
    if (!customerToken) {
      openSupportWeb();
      return;
    }
    setSubmittingSupport(true);
    try {
      await createPostBookingSupportTicket(slug, customerToken, {
        bookingId: booking.id,
        message: buildDefaultSupportTicketMessage(booking.serviceName),
      });
      setFollowUpMessage(copy.postBookingSupportSubmitted);
    } catch {
      setFollowUpMessage(copy.postBookingSupportFailed);
    } finally {
      setSubmittingSupport(false);
    }
  }, [
    booking.id,
    booking.serviceName,
    copy.postBookingSupportFailed,
    copy.postBookingSupportSubmitted,
    customerToken,
    openSupportWeb,
    slug,
  ]);

  const handleUnhappy = useCallback(() => {
    const handoff = resolvePostBookingSupportHandoff({
      slug,
      bookingId: booking.id,
      hasCustomerToken: Boolean(customerToken),
      customerEmail,
      zendeskWidgetConfigured,
    });
    if (handoff === 'zendesk_ticket') {
      void submitSupportTicket();
      return;
    }
    if (handoff === 'support_web') {
      openSupportWeb();
      return;
    }
    setFollowUpMessage(copy.postBookingSupportUnavailable);
  }, [
    booking.id,
    copy.postBookingSupportUnavailable,
    customerEmail,
    customerToken,
    openSupportWeb,
    slug,
    submitSupportTicket,
    zendeskWidgetConfigured,
  ]);

  useEffect(() => {
    if (!isOpen || !openSupportImmediately) return;
    void handleUnhappy();
  }, [handleUnhappy, isOpen, openSupportImmediately]);

  if (step === 'rating') {
    return (
      <IonModal isOpen={isOpen} onDidDismiss={() => finish('dismiss')}>
        <div className="ion-padding ion-text-center">
          <h2 style={{ fontWeight: 600, marginBottom: 8 }}>{copy.postBookingReviewRateTitle}</h2>
          <p style={{ color: '#6b7280', marginBottom: 16 }}>{booking.serviceName}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} stars`}
                onClick={() => setRating(value)}
                style={{ background: 'none', border: 'none', padding: 4 }}
              >
                <IonIcon
                  icon={value <= rating ? star : starOutline}
                  style={{ fontSize: '1.75rem', color: value <= rating ? '#f59e0b' : '#d1d5db' }}
                />
              </button>
            ))}
          </div>
          {reviewError ? (
            <p style={{ color: '#b91c1c', fontSize: '0.875rem', marginBottom: 12 }}>{reviewError}</p>
          ) : null}
          <IonButton
            expand="block"
            disabled={rating < 1 || submittingReview || !customerToken}
            onClick={() => void submitTenantReview()}
          >
            {copy.postBookingReviewSubmitAction}
          </IonButton>
          <IonButton expand="block" fill="clear" onClick={() => finish('dismiss')}>
            {copy.postBookingSatisfactionDismiss}
          </IonButton>
        </div>
      </IonModal>
    );
  }

  if (followUpMessage) {
    return (
      <IonAlert
        isOpen={isOpen}
        header={copy.postBookingSupportTitle}
        message={followUpMessage}
        buttons={[
          {
            text: copy.postBookingSatisfactionDismiss,
            handler: () => finish('unhappy'),
          },
        ]}
        onDidDismiss={() => finish('unhappy')}
      />
    );
  }

  return (
    <IonAlert
      isOpen={isOpen && step === 'satisfaction'}
      header={copy.postBookingSatisfactionTitle}
      message={copy.postBookingSatisfactionMessage}
      buttons={[
        {
          text: copy.postBookingSatisfactionGreat,
          handler: () => {
            if (customerToken) {
              setStep('rating');
              return;
            }
            openStoreReview();
            finish('great');
          },
        },
        {
          text: copy.postBookingSatisfactionUnhappy,
          handler: () => {
            void handleUnhappy();
          },
        },
        {
          text: copy.postBookingSatisfactionDismiss,
          role: 'cancel',
          handler: () => finish('dismiss'),
        },
      ]}
      onDidDismiss={() => {
        if (!submittingSupport && step === 'satisfaction') onClose();
      }}
    />
  );
}