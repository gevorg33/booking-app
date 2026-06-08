import { formatCopy } from '../lib/copy.js';

export function ConsumerProviderReviewSummary({
  averageRating,
  reviewCount,
  summaryTemplate,
}: {
  averageRating: number;
  reviewCount: number;
  summaryTemplate: string;
}) {
  const stars = '★'.repeat(Math.round(averageRating)) + '☆'.repeat(5 - Math.round(averageRating));
  return (
    <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
      <span style={{ color: '#f59e0b', letterSpacing: 1 }}>{stars}</span>{' '}
      {formatCopy(summaryTemplate, {
        rating: averageRating.toFixed(1),
        count: String(reviewCount),
      })}
    </p>
  );
}
