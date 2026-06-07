import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';
import {
  CLINIC_AFTER_VISIT_SUMMARY_MAX_LENGTH,
  CLINIC_AFTER_VISIT_SUMMARY_MIN_LENGTH,
} from '../../../common/utils/clinic-after-visit-summary.util.js';

export class UpsertClinicAfterVisitSummaryDto {
  @IsString()
  @MinLength(CLINIC_AFTER_VISIT_SUMMARY_MIN_LENGTH)
  @MaxLength(CLINIC_AFTER_VISIT_SUMMARY_MAX_LENGTH)
  description: string;
}

export class UpdateClinicAfterVisitSummaryReleaseDto {
  @IsBoolean()
  releasedToPatient: boolean;
}
