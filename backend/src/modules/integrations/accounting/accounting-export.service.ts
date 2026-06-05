import { Injectable } from '@nestjs/common';
import {
  AccountingExportRow,
  AccountingExportResult,
  AccountingProvider,
} from './accounting-integration.types.js';

@Injectable()
export class AccountingExportService {
  buildExport(
    provider: AccountingProvider,
    rows: AccountingExportRow[],
    options?: { incomeAccountName?: string; accountCode?: string },
  ): AccountingExportResult {
    const generatedAt = new Date().toISOString();
    switch (provider) {
      case 'quickbooks':
        return this.quickBooksIif(
          rows,
          options?.incomeAccountName,
          generatedAt,
        );
      case 'xero':
        return this.xeroCsv(rows, options?.accountCode, generatedAt);
      default:
        return this.genericCsv(rows, generatedAt);
    }
  }

  private genericCsv(
    rows: AccountingExportRow[],
    generatedAt: string,
  ): AccountingExportResult {
    const header =
      'Date,Type,IncomeSubType,Description,Amount,Currency,Reference,Customer,Employee';
    const lines = rows.map((r) =>
      [
        r.date,
        r.type,
        this.csvEscape(r.incomeSubType || ''),
        this.csvEscape(r.description),
        r.amount.toFixed(2),
        r.currency,
        this.csvEscape(r.reference),
        this.csvEscape(r.customerName || ''),
        this.csvEscape(r.employeeName || ''),
      ].join(','),
    );
    return {
      provider: 'csv',
      format: 'csv',
      filename: `accounting-export-${generatedAt.slice(0, 10)}.csv`,
      content: [header, ...lines].join('\n'),
      rowCount: rows.length,
      generatedAt,
    };
  }

  private xeroCsv(
    rows: AccountingExportRow[],
    accountCode: string | undefined,
    generatedAt: string,
  ): AccountingExportResult {
    const code = accountCode || '200';
    const header =
      '*ContactName,*InvoiceNumber,*InvoiceDate,DueDate,InventoryItemCode,Description,*Quantity,*UnitAmount,*AccountCode,*TaxType,Reference';
    const lines = rows.map((r, i) =>
      [
        this.csvEscape(r.customerName || 'Walk-in'),
        `OS-${r.reference.slice(0, 8)}`,
        r.date,
        r.date,
        '',
        this.csvEscape(r.description),
        '1',
        r.amount.toFixed(2),
        code,
        'Tax Exempt',
        this.csvEscape(r.reference),
      ].join(','),
    );
    return {
      provider: 'xero',
      format: 'csv',
      filename: `xero-export-${generatedAt.slice(0, 10)}.csv`,
      content: [header, ...lines].join('\n'),
      rowCount: rows.length,
      generatedAt,
    };
  }

  private quickBooksIif(
    rows: AccountingExportRow[],
    incomeAccount: string | undefined,
    generatedAt: string,
  ): AccountingExportResult {
    const account = incomeAccount || 'Service Income';
    const lines = [
      '!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO',
      '!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO',
      '!ENDTRNS',
    ];
    for (const r of rows) {
      const subLabel = r.incomeSubType ? ` [${r.incomeSubType}]` : '';
      const memo = `${r.description}${subLabel} (${r.reference})`;
      lines.push(
        `TRNS\tGENERAL JOURNAL\t${r.date}\t${account}\t${r.customerName || ''}\t${r.amount.toFixed(2)}\t${memo}`,
      );
      lines.push(
        `SPL\tGENERAL JOURNAL\t${r.date}\tAccounts Receivable\t${r.customerName || ''}\t-${r.amount.toFixed(2)}\t${memo}`,
      );
      lines.push('ENDTRNS');
    }
    return {
      provider: 'quickbooks',
      format: 'iif',
      filename: `quickbooks-export-${generatedAt.slice(0, 10)}.iif`,
      content: lines.join('\n'),
      rowCount: rows.length,
      generatedAt,
    };
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
