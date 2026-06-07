export interface ProviderLabResultItem {
  id: string;
  status: string;
  testName: string | null;
  orderId: string | null;
  orderStatus: string | null;
  bookingId: string | null;
  customerName: string | null;
  bookingStartTime: string | null;
  employeeName: string | null;
  department: string | null;
  measurementFlag: string | null;
  completedAt: string | null;
  reviewedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
}

export interface ProviderLabResultsQueue {
  lookbackDays: number;
  viewMode: 'provider' | 'team' | 'admin' | 'owner';
  labFeaturesEnabled: boolean;
  employee: { id: string; name: string } | null;
  results: ProviderLabResultItem[];
}
