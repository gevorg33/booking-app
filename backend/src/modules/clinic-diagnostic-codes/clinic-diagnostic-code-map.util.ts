import type {
  ClinicDiagnosticCodeSummary,
  ClinicDiagnosticCodeView,
} from '../../common/utils/clinic-diagnostic-code.types.js';
import type { ClinicDiagnosticCode } from './entities/clinic-diagnostic-code.entity.js';

export function mapClinicDiagnosticCodeView(
  entity: ClinicDiagnosticCode,
): ClinicDiagnosticCodeView {
  return {
    id: entity.id,
    businessId: entity.businessId,
    codeKind: entity.codeKind,
    codeSystem: entity.codeSystem,
    code: entity.code,
    description: entity.description,
    searchDescription: entity.searchDescription ?? null,
    isActive: entity.isActive,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export function mapClinicDiagnosticCodeSummary(
  entity: Pick<
    ClinicDiagnosticCode,
    'id' | 'codeKind' | 'codeSystem' | 'code' | 'description'
  >,
): ClinicDiagnosticCodeSummary {
  return {
    id: entity.id,
    codeKind: entity.codeKind,
    codeSystem: entity.codeSystem,
    code: entity.code,
    description: entity.description,
  };
}
