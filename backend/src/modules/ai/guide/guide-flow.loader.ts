import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  GuideFlowOverlayBundle,
  GuideFlowPlaybookDef,
  GuideFlowSurface,
  GuideVerticalOverlayId,
} from './guide-flow.types.js';

const GUIDE_FLOWS_REL = join('modules', 'ai', 'guide', 'guide-flows');

const GUIDE_FLOW_SURFACES: GuideFlowSurface[] = [
  'dashboard',
  'provider',
  'customer',
  'public',
];

const OVERLAY_IDS: GuideVerticalOverlayId[] = ['clinic', 'tour', 'retail'];

let cachedBasePlaybooks: Map<GuideFlowSurface, GuideFlowPlaybookDef[]> | null = null;
let cachedOverlays: Map<GuideVerticalOverlayId, GuideFlowOverlayBundle> | null = null;

function resolveGuideFlowsRoot(): string {
  const candidates = [
    join(process.cwd(), 'dist', GUIDE_FLOWS_REL),
    join(process.cwd(), 'src', GUIDE_FLOWS_REL),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  throw new Error(`missing guide-flows directory: ${candidates.join(' or ')}`);
}

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function assertPlaybookShape(raw: GuideFlowPlaybookDef, source: string): GuideFlowPlaybookDef {
  if (!raw.topicId?.trim()) {
    throw new Error(`guide-flow playbook missing topicId: ${source}`);
  }
  if (!raw.surface) {
    throw new Error(`guide-flow playbook missing surface: ${source}`);
  }
  if (!raw.titleKey?.trim()) {
    throw new Error(`guide-flow playbook missing titleKey: ${source}`);
  }
  if (!Array.isArray(raw.routes) || raw.routes.length === 0) {
    throw new Error(`guide-flow playbook missing routes: ${source}`);
  }
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    throw new Error(`guide-flow playbook missing steps: ${source}`);
  }
  for (const step of raw.steps) {
    if (!step.titleKey?.trim() || !step.bodyKey?.trim()) {
      throw new Error(`guide-flow step missing keys in ${source}`);
    }
  }
  return raw;
}

function loadSurfacePlaybooks(root: string, surface: GuideFlowSurface): GuideFlowPlaybookDef[] {
  const dir = join(root, surface);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const path = join(dir, name);
      return assertPlaybookShape(readJsonFile<GuideFlowPlaybookDef>(path), path);
    });
}

function loadOverlayBundles(root: string): Map<GuideVerticalOverlayId, GuideFlowOverlayBundle> {
  const overlaysDir = join(root, 'overlays');
  const map = new Map<GuideVerticalOverlayId, GuideFlowOverlayBundle>();
  if (!existsSync(overlaysDir)) return map;

  for (const id of OVERLAY_IDS) {
    const path = join(overlaysDir, `${id}.json`);
    if (!existsSync(path)) continue;
    const raw = readJsonFile<GuideFlowOverlayBundle>(path);
    if (raw.id !== id) {
      throw new Error(`overlay id mismatch in ${path}: expected ${id}, got ${raw.id}`);
    }
    map.set(
      id,
      {
        id,
        playbooks: (raw.playbooks ?? []).map((playbook) =>
          assertPlaybookShape(playbook, path),
        ),
      },
    );
  }
  return map;
}

function loadGuideFlowCatalog(): {
  base: Map<GuideFlowSurface, GuideFlowPlaybookDef[]>;
  overlays: Map<GuideVerticalOverlayId, GuideFlowOverlayBundle>;
} {
  if (cachedBasePlaybooks && cachedOverlays) {
    return { base: cachedBasePlaybooks, overlays: cachedOverlays };
  }
  const root = resolveGuideFlowsRoot();
  const base = new Map<GuideFlowSurface, GuideFlowPlaybookDef[]>();
  for (const surface of GUIDE_FLOW_SURFACES) {
    base.set(surface, loadSurfacePlaybooks(root, surface));
  }
  cachedBasePlaybooks = base;
  cachedOverlays = loadOverlayBundles(root);
  return { base: cachedBasePlaybooks, overlays: cachedOverlays };
}

export function listGuideFlowSurfacePlaybooks(
  surface: GuideFlowSurface,
): readonly GuideFlowPlaybookDef[] {
  return loadGuideFlowCatalog().base.get(surface) ?? [];
}

export function listGuideFlowOverlayBundles(): readonly GuideFlowOverlayBundle[] {
  return [...loadGuideFlowCatalog().overlays.values()];
}

export function getGuideFlowOverlayBundle(
  id: GuideVerticalOverlayId,
): GuideFlowOverlayBundle | undefined {
  return loadGuideFlowCatalog().overlays.get(id);
}

export function listAllGuideFlowPlaybookDefs(): readonly GuideFlowPlaybookDef[] {
  const { base, overlays } = loadGuideFlowCatalog();
  const rows: GuideFlowPlaybookDef[] = [];
  for (const surface of GUIDE_FLOW_SURFACES) {
    rows.push(...(base.get(surface) ?? []));
  }
  for (const overlay of overlays.values()) {
    rows.push(...overlay.playbooks);
  }
  return rows;
}

/** Reset cached catalog — test helper. */
export function resetGuideFlowCatalogCache(): void {
  cachedBasePlaybooks = null;
  cachedOverlays = null;
}

export function assertGuideFlowCatalogIntegrity(): void {
  const all = listAllGuideFlowPlaybookDefs();
  const topicIds = new Set<string>();
  for (const playbook of all) {
    if (topicIds.has(playbook.topicId)) {
      throw new Error(`duplicate guide-flow topicId: ${playbook.topicId}`);
    }
    topicIds.add(playbook.topicId);
  }
}
