import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';

/** Product membership roles (parity-1.2). */
export type ProductRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'staff'
  | 'contributor'
  | 'client';

export interface RoleCapabilitySurfaceSlice {
  role: ProductRole;
  accessTier: AccessTier;
  surface: CommandSurface;
  uiFeatureIds: readonly string[];
  aiAllowedIntentIds: readonly string[];
  staffScopedIntentIds: readonly string[];
  denyListBlocked: readonly RoleCapabilityDenyBlock[];
}

export interface RoleCapabilityDenyBlock {
  featureId: string;
  intentId: string;
  reason: 'dashboard_denied' | 'provider_denied' | 'customer_tier';
}

export interface RoleCapabilityReconciliationIssue {
  role: ProductRole;
  accessTier: AccessTier;
  surface: CommandSurface;
  featureId: string;
  intentId: string;
  kind: 'ui_ai_mismatch' | 'staff_scope_required';
  detail: string;
}

export interface RoleCapabilityMapExport {
  generatedAt: string;
  roles: readonly ProductRole[];
  byRole: Record<ProductRole, readonly RoleCapabilitySurfaceSlice[]>;
  reconciliationIssues: readonly RoleCapabilityReconciliationIssue[];
  staffScopedBindings: readonly RoleCapabilityReconciliationIssue[];
}
