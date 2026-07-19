import type { ReactNode } from 'react';
import type { PublicBusinessProfile } from '../lib/types.js';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { ConsumerBookingAssistant } from './ConsumerBookingAssistant.js';

/** Global AI FAB + assistant on salon tab routes and other tenant pages that need it. */
export function ConsumerAiShell({
  slug,
  profile,
  copy,
  locale,
  overlaysVisible = true,
  children,
}: {
  slug: string;
  profile: PublicBusinessProfile;
  copy: ConsumerCopy;
  locale: string;
  overlaysVisible?: boolean;
  children: ReactNode;
}) {
  if (!profile.publicBookingEnabled) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <ConsumerBookingAssistant
        slug={slug}
        profile={profile}
        copy={copy}
        locale={locale}
        overlaysVisible={overlaysVisible}
      />
    </>
  );
}
