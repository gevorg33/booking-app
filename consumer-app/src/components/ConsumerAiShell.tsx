import type { ReactNode } from 'react';
import type { PublicBusinessProfile } from '../lib/types.js';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { ConsumerBookingAssistant } from './ConsumerBookingAssistant.js';

/** Global AI FAB + assistant on all consumer salon tabs. */
export function ConsumerAiShell({
  slug,
  profile,
  copy,
  locale,
  children,
}: {
  slug: string;
  profile: PublicBusinessProfile;
  copy: ConsumerCopy;
  locale: string;
  children: ReactNode;
}) {
  if (!profile.publicBookingEnabled) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <ConsumerBookingAssistant slug={slug} profile={profile} copy={copy} locale={locale} />
    </>
  );
}
