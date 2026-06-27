import { Suspense } from 'react';
import { GetAppClient } from './get-app-client';

export default async function GetAppPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={null}>
      <GetAppClient slug={slug} />
    </Suspense>
  );
}
