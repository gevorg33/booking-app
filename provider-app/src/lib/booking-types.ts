export const STATUS_LABELS: Record<string, string> = {
  pending: 'Booked',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Done',
  no_show: 'No show',
  cancelled: 'Cancelled',
};

export const STATUS_COLOR: Record<string, string> = {
  confirmed: 'success',
  completed: 'primary',
  cancelled: 'danger',
  pending: 'warning',
  no_show: 'warning',
  in_progress: 'tertiary',
};

export function formatStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
