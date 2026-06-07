import type { Repository } from 'typeorm';
import type { ClinicTestResult } from '../../modules/clinic-test-results/entities/clinic-test-result.entity.js';

export interface ResultReadyNotifyParams {
  resultId?: string;
  bookingId?: string;
}

/** Resolve a released clinic result for manual result-ready notification (AI + staff). */
export async function resolveReleasedResultIdForNotify(
  resultRepo: Pick<Repository<ClinicTestResult>, 'findOne' | 'find'>,
  businessId: string,
  params: ResultReadyNotifyParams,
): Promise<string | null> {
  const resultId = params.resultId?.trim();
  if (resultId) {
    const result = await resultRepo.findOne({
      where: { id: resultId, businessId, status: 'Released' },
    });
    return result?.id ?? null;
  }

  const bookingId = params.bookingId?.trim();
  if (bookingId) {
    const results = await resultRepo.find({
      where: { businessId, bookingId, status: 'Released' },
      order: { releasedAt: 'DESC' },
      take: 1,
    });
    return results[0]?.id ?? null;
  }

  return null;
}
