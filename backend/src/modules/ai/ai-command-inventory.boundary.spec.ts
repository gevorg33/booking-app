/**
 * AI-ROADMAP Phase 0 — `ai-command-inventory.json` generator + CI gate.
 *
 * Phase 0's second item: "AST scan → ai-command-inventory.json: every one of
 * the 786 detectors labelled legacy_paraphrase | structural_slot | confirm_gate
 * | compound_connector | routing_shape, with mapsToActions, surfaces,
 * wiredInRescue, fixtureIds", plus "CI test:ai-inventory — symbol count in repo
 * == inventory rows; zero unknown".
 *
 * Why a spec and not a script: `typescript` is a devDependency, so the AST scan
 * must never be imported from `src/` code that ships. `tsconfig.build.json`
 * excludes every spec file, so this is the one place in the module where the
 * compiler API can be used safely. The same trick is already used by
 * `ai-detector-freeze.boundary.spec.ts`, which readdir-walks the module.
 *
 * Regenerate after adding or deleting a detector:
 *
 *     npm run build:ai-inventory
 *
 * The pure labelling rules live in `ai-command-inventory.util.ts` and are
 * unit-tested separately; this file only extracts facts and enforces gates.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import * as ts from 'typescript';
import { COMMAND_REGISTRY } from './ai-command-registry.js';
import {
  buildInventoryRow,
  summarizeInventory,
  DETECTOR_LABELS,
  type DetectorFacts,
  type DetectorInventory,
} from './ai-command-inventory.util.js';

const SRC_ROOT = join(__dirname, '..', '..');
const AI_REL = join('modules', 'ai');
const INVENTORY_PATH = join(__dirname, 'ai-command-inventory.json');

/**
 * Must equal `BASELINE.isPromptDetectors` in `ai-detector-freeze.boundary.spec.ts`.
 *
 * The freeze ratchet counts `export function is*Prompt` with an unanchored
 * regex; this scan counts unique exported symbols. Pinning both here means a
 * detector cannot be deleted from the tree without the inventory being
 * regenerated in the same commit, and the two counts can never quietly diverge.
 */
const FREEZE_REGEX_COUNT = 777;

/**
 * Detector symbols exported from more than one file — a name collision hazard.
 *
 * **Zero, and this number may only ever go down** (e2e-bug.353, §106). Three
 * pairs each shipped two different implementations under one name, so which
 * behaviour a call site got depended purely on which module it imported —
 * invisible at the call site, and a trap for Phase 8's delete-by-file passes.
 * Resolved by renaming, not deleting: every copy was live.
 *
 * A new collision means someone has re-created that trap. Fix the name; do not
 * raise this.
 */
const EXPECTED_DUPLICATE_DECLARATIONS = 0;

/**
 * Symbols the freeze regex counts but that are not detectors: their names
 * *contain* `Prompt` without ending in it, so `is…PromptForIntent`,
 * `isNlPromptFixtureRow` and friends are swept up by an unanchored pattern.
 */
const EXPECTED_REGEX_OVERCOUNT = 5;

const DETECTOR_NAME = /^is[A-Za-z0-9_]*Prompt$/;

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkTsFiles(full, acc);
      continue;
    }
    if (entry.endsWith('.ts')) acc.push(full);
  }
  return acc;
}

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.ES2022,
    true,
  );
}

function enclosingFunction(node: ts.Node): ts.Node | null {
  let parent = node.parent;
  while (parent) {
    if (
      ts.isFunctionDeclaration(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isArrowFunction(parent) ||
      ts.isFunctionExpression(parent)
    ) {
      return parent;
    }
    parent = parent.parent;
  }
  return null;
}

function functionName(node: ts.Node | null, fallback: string): string {
  if (!node) return fallback;
  if (
    (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) &&
    node.name
  ) {
    return node.name.getText();
  }
  if (
    node.parent &&
    ts.isVariableDeclaration(node.parent) &&
    ts.isIdentifier(node.parent.name)
  ) {
    return node.parent.name.text;
  }
  return fallback;
}

function calleeName(call: ts.CallExpression): string | null {
  if (ts.isIdentifier(call.expression)) return call.expression.text;
  if (ts.isPropertyAccessExpression(call.expression)) {
    return call.expression.name.text;
  }
  return null;
}

/** Registry ids appearing as string literals anywhere under `node`. */
function registryLiteralsIn(
  node: ts.Node,
  isAction: (id: string) => boolean,
): Set<string> {
  const found = new Set<string>();
  const scan = (n: ts.Node): void => {
    if (ts.isStringLiteral(n) && isAction(n.text)) found.add(n.text);
    ts.forEachChild(n, scan);
  };
  scan(node);
  return found;
}

/** `return false | null | undefined` — the shape of a rejection. */
function isRejectionBranch(statement: ts.Statement): boolean {
  const ret = ts.isReturnStatement(statement)
    ? statement
    : ts.isBlock(statement) &&
        statement.statements.length === 1 &&
        ts.isReturnStatement(statement.statements[0])
      ? statement.statements[0]
      : null;
  if (!ret) return false;
  const text = ret.expression?.getText().trim() ?? '';
  return (
    text === '' || text === 'false' || text === 'null' || text === 'undefined'
  );
}

interface ScanResult {
  facts: DetectorFacts[];
  declarationSites: number;
  regexMatches: number;
}

function scanRepository(): ScanResult {
  const isAction = (id: string): boolean => registryIds.has(id);
  const files = walkTsFiles(SRC_ROOT);

  // ---- pass 1: detector declarations, across the whole tree ----
  // Deliberately NOT limited to modules/ai: four detectors live in
  // provider-mobile and common/utils, outside the Phase 0 freeze's old scan
  // root. An inventory that inherits that blind spot would certify as complete
  // something it never looked at.
  // One row per *declaration*, not per symbol name: three detector names are
  // exported from two files each with different regexes, and collapsing them
  // would leave three implementations undescribed by an inventory claiming to
  // be complete.
  const declarations: { symbol: string; file: string; line: number }[] = [];
  const declaredSymbols = new Set<string>();
  let regexMatches = 0;

  for (const file of files) {
    const rel = file.slice(SRC_ROOT.length + 1);
    const text = readFileSync(file, 'utf8');
    regexMatches +=
      text.match(/export function is[A-Za-z0-9_]*Prompt/g)?.length ?? 0;
    const source = parse(file);
    const visit = (node: ts.Node): void => {
      if (
        ts.isFunctionDeclaration(node) &&
        node.name &&
        DETECTOR_NAME.test(node.name.text) &&
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        declarations.push({
          symbol: node.name.text,
          file: rel,
          line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        });
        declaredSymbols.add(node.name.text);
      }
      ts.forEachChild(node, visit);
    };
    ts.forEachChild(source, visit);
  }

  // ---- pass 2: call graph, guarded branches, intents, fixtures ----
  const callsByFunction = new Map<string, Set<string>>();
  const callers = new Map<string, Set<string>>();
  const specCallers = new Map<string, Set<string>>();
  const guardedActions = new Map<string, Set<string>>();
  const blocking = new Set<string>();
  const intentsByFile = new Map<string, Set<string>>();
  const fixturesByFile = new Map<
    string,
    { id: string; action: string | null }[]
  >();

  const addTo = (
    map: Map<string, Set<string>>,
    key: string,
    value: string,
  ): void => {
    const set = map.get(key) ?? new Set<string>();
    set.add(value);
    map.set(key, set);
  };

  for (const file of files) {
    const rel = file.slice(SRC_ROOT.length + 1);
    const isSpec = rel.endsWith('.spec.ts');
    const source = parse(file);

    if (rel.startsWith(AI_REL)) {
      const visitIntents = (node: ts.Node): void => {
        if (
          ts.isVariableDeclaration(node) &&
          ts.isIdentifier(node.name) &&
          node.name.text.endsWith('_INTENTS') &&
          node.initializer
        ) {
          for (const id of registryLiteralsIn(node.initializer, isAction)) {
            addTo(intentsByFile, rel, id);
          }
        }
        ts.forEachChild(node, visitIntents);
      };
      ts.forEachChild(source, visitIntents);
    }

    if (rel.endsWith('.fixtures.ts')) {
      const rows: { id: string; action: string | null }[] = [];
      const visitFixtures = (node: ts.Node): void => {
        if (ts.isObjectLiteralExpression(node)) {
          let id: string | null = null;
          let action: string | null = null;
          for (const prop of node.properties) {
            if (!ts.isPropertyAssignment(prop) || !prop.name) continue;
            const key = prop.name.getText().replace(/['"]/g, '');
            if (key === 'id' && ts.isStringLiteral(prop.initializer)) {
              id = prop.initializer.text;
            }
            if (
              (key === 'expectedAction' || key === 'action') &&
              ts.isStringLiteral(prop.initializer)
            ) {
              action = prop.initializer.text;
            }
          }
          if (id) rows.push({ id, action });
        }
        ts.forEachChild(node, visitFixtures);
      };
      ts.forEachChild(source, visitFixtures);
      if (rows.length) fixturesByFile.set(rel, rows);
    }

    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        const callee = calleeName(node);
        if (callee) {
          const host = enclosingFunction(node);
          const hostName = functionName(host, `<module:${rel}>`);
          addTo(callsByFunction, hostName, callee);

          if (declaredSymbols.has(callee)) {
            addTo(isSpec ? specCallers : callers, callee, hostName);
            if (!isSpec) {
              recordGuardEvidence(
                node,
                callee,
                host,
                isAction,
                guardedActions,
                blocking,
              );
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    ts.forEachChild(source, visit);
  }

  // ---- rescue reachability (transitive: many tryRescue* delegate to rescue*Intent utils) ----
  const reachableFromRescue = new Set<string>();
  const stack = [...callsByFunction.keys()].filter((n) =>
    n.startsWith('tryRescue'),
  );
  while (stack.length) {
    const current = stack.pop() as string;
    for (const callee of callsByFunction.get(current) ?? []) {
      if (reachableFromRescue.has(callee)) continue;
      reachableFromRescue.add(callee);
      if (callsByFunction.has(callee)) stack.push(callee);
    }
  }

  const declarationCount = new Map<string, number>();
  for (const d of declarations) {
    declarationCount.set(d.symbol, (declarationCount.get(d.symbol) ?? 0) + 1);
  }

  const facts: DetectorFacts[] = [...declarations]
    .sort(
      (a, b) =>
        a.symbol.localeCompare(b.symbol) || a.file.localeCompare(b.file),
    )
    .map(({ symbol, file: rel, line }) => {
      const siblingFixtures = fixturesByFile.get(siblingFixtureFile(rel)) ?? [];
      return {
        symbol,
        file: rel,
        line,
        guardedActions: [...(guardedActions.get(symbol) ?? [])].sort(),
        fileIntents: [...(intentsByFile.get(rel) ?? [])].sort(),
        callers: [...(callers.get(symbol) ?? [])].sort(),
        specCallers: [...(specCallers.get(symbol) ?? [])].sort(),
        blockingUse: blocking.has(symbol),
        wiredInRescue: reachableFromRescue.has(symbol),
        // Two files export this name with different regexes, and which one a
        // call site resolves to depends on its import. The call-site evidence
        // below therefore belongs to *both* rows and separates only under real
        // import resolution.
        duplicateSymbol: (declarationCount.get(symbol) ?? 0) > 1,
        fixtures: [...siblingFixtures].sort((a, b) => a.id.localeCompare(b.id)),
      } satisfies DetectorFacts;
    });

  return { facts, declarationSites: declarations.length, regexMatches };
}

/** `modules/ai/ai-foo.util.ts` → `modules/ai/ai-foo.fixtures.ts`. */
function siblingFixtureFile(relFile: string): string {
  const base = basename(relFile)
    .replace(/\.(util|logic|semantic\.util|helpers)\.ts$/, '')
    .replace(/\.ts$/, '');
  return join(AI_REL, `${base}.fixtures.ts`);
}

/**
 * Read the commands a detector steers from the *branch it guards*, not from the
 * whole enclosing function.
 *
 * The first version of this walked up to the enclosing function and collected
 * every registry id it mentioned. That attributed 45 commands to
 * `isAdjustGiftCardBalancePrompt`, because its caller is a large rescue routine
 * that names 45 actions — useless for deciding what a Phase 8 slice contains.
 * Reading only the guarded branch collapses 516 of 578 detectors to exactly one
 * command, and none to more than ten.
 */
function recordGuardEvidence(
  call: ts.CallExpression,
  symbol: string,
  host: ts.Node | null,
  isAction: (id: string) => boolean,
  guardedActions: Map<string, Set<string>>,
  blocking: Set<string>,
): void {
  const bag = guardedActions.get(symbol) ?? new Set<string>();
  let cursor: ts.Node = call;
  while (cursor.parent) {
    if (
      ts.isConditionalExpression(cursor.parent) &&
      cursor.parent.condition === cursor
    ) {
      for (const id of registryLiteralsIn(cursor.parent.whenTrue, isAction))
        bag.add(id);
      break;
    }
    if (
      ts.isIfStatement(cursor.parent) &&
      cursor.parent.expression === cursor
    ) {
      const ifNode = cursor.parent;
      const condition = cursor.getText().trim();
      const negated = condition.startsWith('!');
      const rejects = isRejectionBranch(ifNode.thenStatement);

      if (!negated && rejects) {
        // `if (isX(p)) return false;` — X is used to reject, not to select.
        blocking.add(symbol);
      } else if (negated && rejects && host) {
        // `if (!isX(p)) return null;` — everything after the guard belongs to X.
        for (const id of registryLiteralsIn(host, isAction)) bag.add(id);
      } else {
        for (const id of registryLiteralsIn(ifNode.thenStatement, isAction))
          bag.add(id);
      }
      break;
    }
    if (
      ts.isPrefixUnaryExpression(cursor.parent) &&
      cursor.parent.operator === ts.SyntaxKind.ExclamationToken
    ) {
      blocking.add(symbol);
    }
    cursor = cursor.parent;
  }
  guardedActions.set(symbol, bag);
}

const registryIds = new Set(COMMAND_REGISTRY.map((e) => e.id));
const surfacesById = new Map(
  COMMAND_REGISTRY.map((e) => [e.id, e.surfaces as readonly string[]]),
);

describe('AI-ROADMAP Phase 0 — detector inventory', () => {
  const { facts, declarationSites, regexMatches } = scanRepository();

  const rows = facts.map((f) =>
    buildInventoryRow(
      f,
      (id) => surfacesById.get(id) ?? [],
      (id) => registryIds.has(id),
    ),
  );
  const generated = summarizeInventory(
    rows,
    'npm run build:ai-inventory (ai-command-inventory.boundary.spec.ts)',
  );

  if (process.env.AI_INVENTORY_WRITE === '1') {
    writeFileSync(INVENTORY_PATH, `${JSON.stringify(generated, null, 2)}\n`);
  }

  const readInventory = (): DetectorInventory =>
    JSON.parse(readFileSync(INVENTORY_PATH, 'utf8')) as DetectorInventory;

  it('inventory row count == detector symbol count in the repo', () => {
    const committed = readInventory();
    expect(committed.detectorCount).toBe(committed.detectors.length);
    expect(committed.detectorCount).toBe(generated.detectorCount);
  });

  it('is checked in and in sync with the tree (run: npm run build:ai-inventory)', () => {
    expect(readInventory()).toEqual(JSON.parse(JSON.stringify(generated)));
  });

  it('has zero unknown labels — every detector is triaged', () => {
    const untriaged = readInventory()
      .detectors.filter((d) => !DETECTOR_LABELS.includes(d.label))
      .map((d) => `${d.symbol}: ${String(d.label)}`);
    expect(untriaged).toEqual([]);
  });

  it('every labelled detector carries the reason it was labelled', () => {
    const unexplained = readInventory()
      .detectors.filter((d) => !d.labelReason)
      .map((d) => d.symbol);
    expect(unexplained).toEqual([]);
  });

  it('every mapped action is a real registry command', () => {
    const dangling = readInventory()
      .detectors.flatMap((d) =>
        d.mapsToActions.map((a) => ({ symbol: d.symbol, a })),
      )
      .filter(({ a }) => !registryIds.has(a))
      .map(({ symbol, a }) => `${symbol} -> ${a}`);
    expect(dangling).toEqual([]);
  });

  it('surfaces are the registry surfaces of the mapped actions, never invented', () => {
    const wrong = readInventory()
      .detectors.filter((d) => {
        const expected = [
          ...new Set(
            d.mapsToActions.flatMap((a) => [...(surfacesById.get(a) ?? [])]),
          ),
        ].sort();
        return JSON.stringify(expected) !== JSON.stringify([...d.surfaces]);
      })
      .map((d) => d.symbol);
    expect(wrong).toEqual([]);
  });

  it('reconciles with the Phase 0 freeze ratchet count', () => {
    // freeze regex 777 = 772 declarations + 5 names that merely contain "Prompt".
    // 790 -> 777 on 2026-08-08: e2e-bug.354 deleted 13 detectors nothing called.
    expect(regexMatches).toBe(FREEZE_REGEX_COUNT);
    expect(declarationSites).toBe(generated.detectorCount);
    expect(regexMatches - declarationSites).toBe(EXPECTED_REGEX_OVERCOUNT);
  });

  it('gives every duplicated symbol a row of its own', () => {
    const inv = readInventory();
    const byName = new Map<string, string[]>();
    for (const d of inv.detectors) {
      byName.set(d.symbol, [...(byName.get(d.symbol) ?? []), d.file]);
    }
    const collisions = [...byName.entries()].filter(([, f]) => f.length > 1);
    expect(collisions.length).toBe(EXPECTED_DUPLICATE_DECLARATIONS);
    expect(inv.duplicateSymbols).toBe(collisions.flatMap(([, f]) => f).length);
    // Every collision must be flagged, so nobody deletes one believing it is
    // the implementation their call site resolves to.
    expect(
      collisions.flatMap(([name]) =>
        inv.detectors.filter((d) => d.symbol === name && !d.duplicateSymbol),
      ),
    ).toEqual([]);
  });

  it('prints the triage burn-down', () => {
    const inv = readInventory();

    console.log(
      `[AI-ROADMAP inventory] ${inv.detectorCount} detectors · ` +
        DETECTOR_LABELS.map((l) => `${l} ${inv.labelCounts[l]}`).join(' · ') +
        ` · unreachable-from-production ${inv.unreachableFromProduction}` +
        ` · duplicate-symbols ${inv.duplicateSymbols}`,
    );
    expect(inv.detectorCount).toBeGreaterThan(0);
  });
});
