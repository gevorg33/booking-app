export type AccountingProvider = 'quickbooks' | 'xero' | 'csv';

export interface BusinessAccountingIntegration {
  enabled?: boolean;
  provider?: AccountingProvider;
  /** QuickBooks income account name */
  incomeAccountName?: string;
  /** Xero account code */
  accountCode?: string;
  /** Include commissions in export */
  includeCommissions?: boolean;
  /** Include expenses in export */
  includeExpenses?: boolean;
}

export type AccountingIncomeSubType = 'service' | 'subscription';

export interface AccountingExportRow {
  date: string;
  description: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense' | 'commission';
  /** Income classification for books (MVP: full plan price on purchase). */
  incomeSubType?: AccountingIncomeSubType;
  reference: string;
  customerName?: string;
  employeeName?: string;
  subtotal?: number;
  taxRate?: number | null;
  taxAmount?: number;
  taxName?: string | null;
  total?: number;
}

export interface AccountingExportResult {
  provider: AccountingProvider;
  format: 'csv' | 'iif';
  filename: string;
  content: string;
  rowCount: number;
  generatedAt: string;
}

export function getBusinessAccountingIntegration(
  settings?: Record<string, unknown>,
): BusinessAccountingIntegration {
  const integrations = settings?.integrations as
    | Record<string, unknown>
    | undefined;
  return (integrations?.accounting as BusinessAccountingIntegration) || {};
}
