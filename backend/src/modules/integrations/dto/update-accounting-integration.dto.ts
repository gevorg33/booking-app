import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import type { AccountingProvider } from '../accounting/accounting-integration.types.js';

export class UpdateAccountingIntegrationDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsIn(['quickbooks', 'xero', 'csv'])
  provider?: AccountingProvider;

  @IsOptional()
  @IsString()
  incomeAccountName?: string;

  @IsOptional()
  @IsString()
  accountCode?: string;

  @IsOptional()
  @IsBoolean()
  includeCommissions?: boolean;

  @IsOptional()
  @IsBoolean()
  includeExpenses?: boolean;
}
