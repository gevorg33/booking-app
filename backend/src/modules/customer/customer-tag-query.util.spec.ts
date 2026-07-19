import {
  WAITLIST_CUSTOMER_TAG,
  andWhereSimpleArrayTag,
  simpleArrayTagMatchClause,
} from './customer-tag-query.util.js';

describe('customer-tag-query.util (e2e-bug.145)', () => {
  it('builds LIKE clauses for simple-array tags (not PG ANY)', () => {
    const { sql, params } = simpleArrayTagMatchClause(
      'c.tags',
      WAITLIST_CUSTOMER_TAG,
      'waitlistTag',
    );
    expect(sql).not.toMatch(/\bANY\b/i);
    expect(sql).toContain('c.tags = :waitlistTag');
    expect(sql).toContain('c.tags LIKE :waitlistTagPrefix');
    expect(params).toEqual({
      waitlistTag: 'waitlist',
      waitlistTagPrefix: 'waitlist,%',
      waitlistTagSuffix: '%,waitlist',
      waitlistTagMiddle: '%,waitlist,%',
    });
  });

  it('andWhereSimpleArrayTag applies the clause to a query builder', () => {
    const andWhere = jest.fn().mockReturnThis();
    const qb = { andWhere } as any;
    andWhereSimpleArrayTag(qb, 'c', 'WaitList', 't');
    expect(andWhere).toHaveBeenCalledWith(
      expect.stringContaining('c.tags = :t'),
      expect.objectContaining({ t: 'waitlist', tPrefix: 'waitlist,%' }),
    );
  });
});
