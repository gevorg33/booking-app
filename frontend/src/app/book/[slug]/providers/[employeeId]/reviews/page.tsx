import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { ProviderReviewsClient } from './provider-reviews-client';

export default async function ProviderReviewsPage({
  params,
}: {
  params: Promise<{ slug: string; employeeId: string }>;
}) {
  const { slug, employeeId } = await params;

  let tenant;
  try {
    tenant = await getPublicProfile(slug);
  } catch {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-16 text-center text-gray-500 text-sm">Loading…</div>
      }
    >
      <ProviderReviewsClient
        slug={slug}
        tenant={tenant}
        employeeId={employeeId}
        backHref={bookPath(slug, `/providers/${employeeId}`)}
      />
    </Suspense>
  );
}
