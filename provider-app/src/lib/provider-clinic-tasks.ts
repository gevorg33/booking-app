export interface ProviderClinicTaskItem {
  id: string;
  taskType: 'ResultReview' | 'SpecimenCollection' | 'PatientCallback';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  title: string;
  notes: string | null;
  priority: 'normal' | 'high';
  dueAt: string | null;
  customerId: string | null;
  customerName: string | null;
  bookingId: string | null;
  assigneeEmployeeId: string | null;
  assigneeName: string | null;
  isAutoManaged: boolean;
  canClaim: boolean;
  canComplete: boolean;
  createdAt: string;
}

export interface ProviderClinicTaskInbox {
  viewMode: 'provider' | 'team' | 'admin' | 'owner';
  labFeaturesEnabled: boolean;
  employee: { id: string; name: string } | null;
  tasks: ProviderClinicTaskItem[];
}

export function providerClinicTaskTypeKey(
  taskType: ProviderClinicTaskItem['taskType'],
): string {
  switch (taskType) {
    case 'ResultReview':
      return 'provider.clinicTasksTypeResultReview';
    case 'SpecimenCollection':
      return 'provider.clinicTasksTypeSpecimenCollection';
    case 'PatientCallback':
      return 'provider.clinicTasksTypePatientCallback';
    default:
      return 'provider.clinicTasksTypeUnknown';
  }
}
