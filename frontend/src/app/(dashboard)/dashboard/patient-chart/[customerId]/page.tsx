'use client';

import { useParams } from 'next/navigation';
import { PatientChartPageContent } from '@/components/patient-chart/patient-chart-page-content';

export default function PatientChartPage() {
  const params = useParams<{ customerId: string }>();
  const customerId = params.customerId ?? '';

  if (!customerId) {
    return null;
  }

  return <PatientChartPageContent customerId={customerId} />;
}
