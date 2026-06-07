'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FileHeart, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { isClinicVerticalBusinessType } from '@/lib/clinic-service';
import {
  buildPatientChartPath,
  resolvePatientChartTab,
  type PatientChartTabId,
  unwrapPatientChartData,
} from '@/lib/patient-chart';
import type { CustomerDetail } from '@/components/customers/customer-detail-panel';
import { DashboardPageShell, DashboardPageToolbar } from '@/components/dashboard/dashboard-page-shell';
import { PatientChartEmrShell } from './patient-chart-emr-shell';
import { PatientChartEncountersTab } from './patient-chart-encounters-tab';
import { PatientChartStaffNotesTab } from './patient-chart-staff-notes-tab';
import { PatientChartDocumentsTab } from './patient-chart-documents-tab';
import { PatientChartProfileTab } from './patient-chart-profile-tab';
import { PatientChartVisitsTab } from './patient-chart-visits-tab';
import { PatientChartOrdersTab } from './patient-chart-orders-tab';
import { PatientChartResultsTab } from './patient-chart-results-tab';
import { PatientChartIntakeTab } from './patient-chart-intake-tab';
import { PatientChartAlertsBanner } from './patient-chart-alerts-banner';

export interface PatientChartPageContentProps {
  customerId: string;
}

export function PatientChartPageContent({ customerId }: PatientChartPageContentProps) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { business } = useAuthStore();
  const businessId = business?.id ?? '';
  const businessType =
    (business?.settings?.businessType as string | undefined) ?? undefined;
  const showPage = isClinicVerticalBusinessType(businessType);

  const activeTab = useMemo(
    () => resolvePatientChartTab(searchParams.get('tab')),
    [searchParams],
  );

  const { data: customerDetail, isLoading } = useQuery({
    queryKey: ['customer-detail', businessId, customerId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/customers/${customerId}/detail`,
      );
      return unwrapPatientChartData<CustomerDetail>(data);
    },
    enabled: !!businessId && !!customerId && showPage,
  });

  const onTabChange = useCallback(
    (tab: PatientChartTabId) => {
      router.replace(buildPatientChartPath(customerId, tab));
    },
    [customerId, router],
  );

  if (!showPage) {
    return (
      <div className="card text-sm text-gray-500">{t('clinic.labState.gate.disabledReason')}</div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  const patientName = customerDetail?.customer.name ?? t('clinic.patientChart.unknownPatient');

  return (
    <DashboardPageShell>
      <DashboardPageToolbar
        title={
          <>
            <FileHeart className="h-6 w-6 text-rose-400" />
            {t('clinic.patientChart.title')}
          </>
        }
        subtitle={patientName}
        actions={
          <Link
            href="/dashboard/customers"
            className="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('clinic.patientChart.backToCustomers')}
          </Link>
        }
      />

      <PatientChartAlertsBanner
        businessId={businessId}
        customerId={customerId}
        onOpenTab={onTabChange}
      />

      <PatientChartEmrShell activeTab={activeTab} onTabChange={onTabChange}>
        {activeTab === 'profile' ? (
          <PatientChartProfileTab businessId={businessId} customerId={customerId} />
        ) : null}
        {activeTab === 'visits' ? (
          <PatientChartVisitsTab businessId={businessId} customerId={customerId} />
        ) : null}
        {activeTab === 'encounters' ? (
          <PatientChartEncountersTab businessId={businessId} customerId={customerId} />
        ) : null}
        {activeTab === 'staffNotes' ? (
          <PatientChartStaffNotesTab businessId={businessId} customerId={customerId} />
        ) : null}
        {activeTab === 'documents' ? (
          <PatientChartDocumentsTab businessId={businessId} customerId={customerId} />
        ) : null}
        {activeTab === 'orders' ? (
          <PatientChartOrdersTab businessId={businessId} customerId={customerId} />
        ) : null}
        {activeTab === 'results' ? (
          <PatientChartResultsTab businessId={businessId} customerId={customerId} />
        ) : null}
        {activeTab === 'intake' ? (
          <PatientChartIntakeTab businessId={businessId} customerId={customerId} />
        ) : null}
      </PatientChartEmrShell>
    </DashboardPageShell>
  );
}
