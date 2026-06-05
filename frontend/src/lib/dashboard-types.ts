export interface DashboardOverview {
  todaysBookings: number;
  activeEmployees: number;
  services: number;
  totalCustomers: number;
  utilizationPercent: number;
  revenueThisMonth: number;
  taxCollectedThisMonth: number;
  netRevenueThisMonth: number;
  currency: string;
  bookingsThisMonth: number;
  noShowCount: number;
  noShowRatePercent: number;
  completedThisMonth: number;
}
