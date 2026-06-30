'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import { ProviderList } from '@/components/public-booking/provider-list';
import type { PublicBusinessProfile, PublicProvider } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';

interface ProfessionalsClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  providers: PublicProvider[];
  backHref: string;
}

export function ProfessionalsClient({ slug, tenant, providers, backHref }: ProfessionalsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const initialEmployeeId = searchParams.get('employeeId');
  const initialStartTime = searchParams.get('startTime');

  const [employeeId, setEmployeeId] = useState<string | null>(initialEmployeeId);
  const [startTime, setStartTime] = useState<string | null>(initialStartTime);

  const primary = tenant.branding.primaryColor || '#7c3aed';

  const servicesHref = useMemo(() => {
    if (!employeeId || !startTime) return null;
    const q = new URLSearchParams({
      employeeId,
      startTime,
    });
    return `${bookPath(slug, '/services')}?${q.toString()}`;
  }, [slug, employeeId, startTime]);

  const onSelect = useCallback(
    (empId: string, start: string) => {
      setEmployeeId(empId);
      setStartTime(start);
      const q = new URLSearchParams({ employeeId: empId, startTime: start });
      router.replace(`${bookPath(slug, '/professionals')}?${q.toString()}`, { scroll: false });
    },
    [router, slug],
  );

  const onContinue = useCallback(() => {
    if (!servicesHref) return;
    router.push(servicesHref);
  }, [router, servicesHref]);

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <div className="max-w-lg mx-auto px-4 py-6 pb-32 -mt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('public.chooseSpecialist')}</h1>
        <p className="text-sm text-gray-500 mb-5">
          {t('public.specialistAiHint')}
        </p>
        <ProviderList
          slug={slug}
          providers={providers}
          primaryColor={primary}
          timeZone={tenant.timezone}
          businessLocale={tenant.locale}
          selectedEmployeeId={employeeId}
          selectedStartTime={startTime}
          onSelect={onSelect}
        />
      </div>
      <FixedActionBar
        primaryColor={primary}
        disabled={!employeeId || !startTime}
        label={t('public.selectService')}
        onClick={onContinue}
      />
    </>
  );
}
