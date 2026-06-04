import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPublicProfileResolved } from '@/lib/get-public-profile-resolved';;
import { ManageBookingClient } from './manage-client';

export default async function ManageBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let tenant;
  try {
    tenant = await getPublicProfileResolved(slug);
  } catch {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-16 text-center text-gray-500 text-sm">Loading…</div>
      }
    >
      <ManageBookingClient tenant={tenant} />
    </Suspense>
  );
}
