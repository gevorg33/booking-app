import { useRef, useState } from 'react';
import {
  IonAvatar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../services/auth-store';
import { useI18n } from '../i18n';
import {
  fetchProviderProfile,
  fetchProviderReviews,
  renderStarRating,
  updateProviderProfile,
} from '../lib/provider-profile';
import { uploadProviderAvatar } from '../services/provider-upload';
import { formatDateDisplay } from '../lib/date-format';

export function ProviderProfileSection() {
  const { t } = useI18n();
  const { business, user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [error, setError] = useState('');

  const profileQuery = useQuery({
    queryKey: ['provider-profile', business?.id],
    queryFn: () => fetchProviderProfile(business!.id),
    enabled: !!business?.id,
  });

  const reviewsQuery = useQuery({
    queryKey: ['provider-reviews', business?.id],
    queryFn: () => fetchProviderReviews(business!.id),
    enabled: !!business?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { title?: string; avatarUrl?: string }) =>
      updateProviderProfile(business!.id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['provider-profile', business?.id] });
      setError('');
    },
    onError: () => setError(t('provider.profileSaveFailed')),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadProviderAvatar(business!.id, file);
      return updateProviderProfile(business!.id, { avatarUrl: url });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['provider-profile', business?.id] });
      setError('');
    },
    onError: () => setError(t('provider.profilePhotoFailed')),
  });

  if (profileQuery.isLoading) {
    return <IonSpinner />;
  }

  if (profileQuery.isError) {
    return (
      <IonCard>
        <IonCardContent>
          <IonText color="medium">
            <p>{t('provider.profileNoEmployee')}</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    );
  }

  const profile = profileQuery.data;
  if (!profile) return null;

  const titleValue = titleDraft ?? profile.title ?? '';
  const busy = saveMutation.isPending || uploadMutation.isPending;
  const reviews = reviewsQuery.data;

  return (
    <>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{t('provider.profilePublicTitle')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
            <IonAvatar
              style={{ width: 72, height: 72, cursor: 'pointer' }}
              onClick={() => fileRef.current?.click()}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--ion-color-light)',
                    fontWeight: 700,
                    fontSize: 24,
                  }}
                >
                  {profile.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </IonAvatar>
            <div>
              <p style={{ margin: 0, fontWeight: 700 }}>{profile.name}</p>
              <p className="booking-meta" style={{ margin: '4px 0 0' }}>
                {user?.email ?? profile.email}
              </p>
              <IonButton
                size="small"
                fill="outline"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                {t('provider.profileUploadPhoto')}
              </IonButton>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void uploadMutation.mutateAsync(file);
            }}
          />
          <IonItem lines="none" className="ion-no-padding">
            <IonLabel position="stacked">{t('provider.profileEditTitle')}</IonLabel>
            <IonInput
              value={titleValue}
              placeholder={t('provider.profileTitlePlaceholder')}
              onIonInput={(event) => setTitleDraft(event.detail.value ?? '')}
            />
          </IonItem>
          <IonButton
            expand="block"
            className="ion-margin-top"
            disabled={busy || titleValue === (profile.title ?? '')}
            onClick={() => void saveMutation.mutateAsync({ title: titleValue })}
          >
            {busy ? <IonSpinner name="crescent" /> : t('provider.profileSave')}
          </IonButton>
          {error ? (
            <IonText color="danger">
              <p className="booking-meta">{error}</p>
            </IonText>
          ) : null}
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{t('provider.profileReviewsTitle')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {reviewsQuery.isLoading ? (
            <IonSpinner />
          ) : !reviews?.reviewCount ? (
            <p className="booking-meta">{t('provider.profileNoReviews')}</p>
          ) : (
            <>
              <p style={{ marginTop: 0 }}>
                <span style={{ color: '#f59e0b', letterSpacing: 1 }}>
                  {renderStarRating(reviews.averageRating ?? 0)}
                </span>{' '}
                {t('provider.profileAverageRating', {
                  rating: (reviews.averageRating ?? 0).toFixed(1),
                  count: reviews.reviewCount,
                })}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviews.reviews.map((review) => (
                  <div key={review.id} className="salon-card" style={{ padding: 12 }}>
                    <p style={{ margin: 0, color: '#f59e0b' }}>{renderStarRating(review.rating)}</p>
                    {review.comment ? <p style={{ margin: '6px 0' }}>{review.comment}</p> : null}
                    <p className="booking-meta" style={{ margin: 0 }}>
                      {review.customerName ?? t('provider.profileAnonymousReview')} ·{' '}
                      {formatDateDisplay(review.createdAt.slice(0, 10))}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </IonCardContent>
      </IonCard>
    </>
  );
}
