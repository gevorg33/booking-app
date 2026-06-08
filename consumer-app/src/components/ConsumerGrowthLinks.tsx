import { IonButton } from '@ionic/react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { PublicBusinessProfile } from '../lib/types.js';
import {
  buildGrowthBookingLinks,
  hasGrowthBookingLinks,
  openExternalUrl,
  type GrowthBookingLinkKind,
} from '../lib/consumer-growth-links.util.js';

function growthLinkLabel(copy: ConsumerCopy, kind: GrowthBookingLinkKind, customLabel?: string): string {
  if (kind === 'meta') return customLabel || copy.growthBookOnline;
  switch (kind) {
    case 'telegram':
      return copy.growthBookViaTelegram;
    case 'whatsapp':
      return copy.growthBookViaWhatsApp;
    case 'facebook':
      return copy.growthBookViaFacebook;
    case 'instagram':
      return copy.growthBookViaInstagram;
    default:
      return copy.growthBookOnline;
  }
}

export function ConsumerGrowthLinks({
  profile,
  copy,
}: {
  profile: Pick<PublicBusinessProfile, 'metaBooking' | 'messaging'>;
  copy: ConsumerCopy;
}) {
  if (!hasGrowthBookingLinks(profile)) return null;

  const links = buildGrowthBookingLinks(profile);
  const primary = '#7c3aed';

  return (
    <div className="salon-card ion-margin-top">
      <p style={{ fontWeight: 600, marginBottom: 12 }}>{copy.growthBookAnotherWay}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {links.map((link) => (
          <IonButton
            key={`${link.kind}-${link.href}`}
            size="small"
            fill="outline"
            style={{ '--border-color': primary, '--color': primary }}
            onClick={() => openExternalUrl(link.href)}
          >
            {growthLinkLabel(copy, link.kind, link.customLabel)}
          </IonButton>
        ))}
      </div>
    </div>
  );
}
