import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/lib/public-api';
import { AccountClient } from './account-client';

export default async function AccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let tenant;
  try {
    tenant = await getPublicProfile(slug);
  } catch {
    notFound();
  }

  return <AccountClient tenant={tenant} />;
}
