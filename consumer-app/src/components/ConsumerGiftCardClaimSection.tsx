import { IonButton, IonInput, IonSpinner } from '@ionic/react';
import { useEffect, useState, type Ref } from 'react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { resolveGiftCardClaimSuccessCopyKey } from '../lib/gift-card-purchase.util.js';
import { claimPublicGiftCard } from '../services/public-api.js';

export function ConsumerGiftCardClaimSection({
  slug,
  copy,
  initialCode,
  sectionRef,
  onClaimed,
}: {
  slug: string;
  copy: ConsumerCopy;
  initialCode?: string;
  sectionRef?: Ref<HTMLElement>;
  onClaimed?: () => void;
}) {
  const [code, setCode] = useState(initialCode ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialCode?.trim()) {
      setCode(initialCode.trim());
    }
  }, [initialCode]);

  const handleClaim = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await claimPublicGiftCard(slug, trimmed);
      const key = resolveGiftCardClaimSuccessCopyKey(result.cardType);
      setSuccess(typeof copy[key] === 'string' ? copy[key] : null);
      setCode('');
      onClaimed?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.networkLoadFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section ref={sectionRef} className="salon-card" style={{ marginTop: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600 }}>{copy.giftCardRedeemSectionTitle}</h2>
      <p style={{ fontSize: 14, fontWeight: 500, marginTop: 8 }}>{copy.giftCardClaimTitle}</p>
      <p style={{ fontSize: 12, color: '#6b7280' }}>{copy.giftCardClaimHint}</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <IonInput
          value={code}
          placeholder={copy.giftCardClaimPlaceholder}
          style={{ flex: 1, '--background': '#f9fafb', textTransform: 'uppercase' }}
          onIonInput={(e) => setCode(String(e.detail.value ?? ''))}
        />
        <IonButton onClick={() => void handleClaim()} disabled={loading || !code.trim()}>
          {loading ? <IonSpinner name="crescent" /> : copy.giftCardClaimSubmit}
        </IonButton>
      </div>
      {error ? <p style={{ color: '#b91c1c', fontSize: 12, marginTop: 8 }}>{error}</p> : null}
      {success ? <p style={{ color: '#15803d', fontSize: 12, marginTop: 8 }}>{success}</p> : null}
    </section>
  );
}
