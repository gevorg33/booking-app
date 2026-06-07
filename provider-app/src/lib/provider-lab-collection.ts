export interface ProviderLabCollectionItem {
  id: string;
  status: string;
  displayNames: string | null;
  department: string | null;
  bookingId: string | null;
  customerName: string | null;
  bookingStartTime: string | null;
  employeeName: string | null;
  createdAt: string;
}

export interface ProviderLabCollectionQueue {
  date: string;
  viewMode: 'provider' | 'team' | 'admin' | 'owner';
  labFeaturesEnabled: boolean;
  employee: { id: string; name: string } | null;
  orders: ProviderLabCollectionItem[];
}
