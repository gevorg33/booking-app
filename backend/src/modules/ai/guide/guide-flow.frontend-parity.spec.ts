import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DASHBOARD_ROUTE_PRIMARY_TOPIC } from '../ai-product-guide-ranking.util.js';
import { GUIDE_FLOW_ROUTE_PRIMARY_TOPIC } from './guide-flow.routes.manifest.js';

describe('guide-flow frontend parity (ai-guide-1.1.2)', () => {
  it('keeps dashboard command-bar playbooks aligned with guide-flow route primaries', () => {
    const frontendPath = join(
      process.cwd(),
      '..',
      'frontend/src/lib/ai-command-bar-guide.util.ts',
    );
    const source = readFileSync(frontendPath, 'utf8');
    const topicMatches = [
      ...source.matchAll(/topicId:\s*'([^']+)'/g),
    ].map((match) => match[1]);
    expect(topicMatches.length).toBeGreaterThan(10);

    for (const [route, topicId] of Object.entries(GUIDE_FLOW_ROUTE_PRIMARY_TOPIC)) {
      if (!route.startsWith('/dashboard')) continue;
      expect(DASHBOARD_ROUTE_PRIMARY_TOPIC[route]).toBe(topicId);
      if (source.includes(`'${route}'`)) {
        expect(topicMatches).toContain(topicId);
      }
    }
  });
});
