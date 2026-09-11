import type {
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';

/**
 * The narrow slice of a TypeORM repository that the `*Logic` functions actually
 * call.
 *
 * `Pick<Repository<T>, 'findOne' | 'save'>` looks equivalent and is not. The real
 * `save` carries four overloads — entity and entity[], each with and without
 * options — and no `jest.Mock` can be assignable to all four at once. That single
 * fact is why nearly every `*.logic.spec.ts` deps literal was a type error while
 * the code under test passed: the specs were being measured against an interface
 * far wider than the two calls the logic makes.
 *
 * A real `Repository<T>` still satisfies these, so production wiring is unchanged
 * — this only stops the declaration from demanding more than the logic uses.
 */
export interface EntityReader<T extends ObjectLiteral> {
  findOne(options: FindOneOptions<T>): Promise<T | null>;
}

export interface EntityFinder<T extends ObjectLiteral> {
  find(options?: FindManyOptions<T>): Promise<T[]>;
}

export interface EntityWriter<T extends ObjectLiteral> {
  save(entity: T): Promise<T>;
}

/**
 * `update` is declared as returning `unknown` because no `*Logic` reads the
 * result — every call site is a bare `await deps.<repo>.update(...)`. The real
 * `UpdateResult` carries `raw` and `generatedMaps`, which a test double would
 * otherwise have to fabricate for no reason.
 */
export interface EntityUpdater<T extends ObjectLiteral> {
  /**
   * `criteria` admits a bare id as well as a where-clause, because both are used:
   * `ai-staff-operations.logic.ts:428` passes `businessId` directly while
   * `ai-business-currency.logic.ts:1266` passes `{ id: In(…), businessId }`.
   * Declaring only the where-clause form broke the production typecheck on the
   * first of those — worth recording, because it is the one case in this vein
   * where the narrow interface was genuinely narrower than the code needs.
   */
  update(
    criteria: string | string[] | FindOptionsWhere<T>,
    partial: object,
  ): Promise<unknown>;
}

/** `findOne` + `save`, the pair most `*Logic` deps need. */
export type EntityReadWriter<T extends ObjectLiteral> = EntityReader<T> &
  EntityWriter<T>;
