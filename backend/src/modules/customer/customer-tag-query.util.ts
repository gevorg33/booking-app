import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * TypeORM `simple-array` stores tags as a comma-separated string, not a PG array.
 * e2e-bug.145 — `'waitlist' = ANY(c.tags)` crashes with
 * "op ANY/ALL (array) requires array on right side".
 */
export function simpleArrayTagMatchClause(
  columnSql: string,
  tag: string,
  paramPrefix = 'tag',
): { sql: string; params: Record<string, string> } {
  const normalized = tag.trim().toLowerCase();
  return {
    sql: `(${columnSql} = :${paramPrefix} OR ${columnSql} LIKE :${paramPrefix}Prefix OR ${columnSql} LIKE :${paramPrefix}Suffix OR ${columnSql} LIKE :${paramPrefix}Middle)`,
    params: {
      [paramPrefix]: normalized,
      [`${paramPrefix}Prefix`]: `${normalized},%`,
      [`${paramPrefix}Suffix`]: `%,${normalized}`,
      [`${paramPrefix}Middle`]: `%,${normalized},%`,
    },
  };
}

export function andWhereSimpleArrayTag<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  tag: string,
  paramPrefix = 'tag',
): SelectQueryBuilder<T> {
  const { sql, params } = simpleArrayTagMatchClause(
    `${alias}.tags`,
    tag,
    paramPrefix,
  );
  return qb.andWhere(sql, params);
}

export const WAITLIST_CUSTOMER_TAG = 'waitlist';
