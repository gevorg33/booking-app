export interface WizardPlanStep {
  id: string;
  action: string;
  description: string;
  impact: string;
}

export interface WizardStepView extends WizardPlanStep {
  index: number;
  status: 'pending' | 'current' | 'done';
}

export const WIZARD_ACTIONS = new Set([
  'setup_week_schedule',
  'optimize_schedule',
  'resolve_conflicts',
  'reassign_cancelled',
]);

export function shouldUseWizardMode(action: string, planDiff?: WizardPlanStep[]): boolean {
  if (!WIZARD_ACTIONS.has(action)) return false;
  return Array.isArray(planDiff) && planDiff.length >= 2;
}

/** Guided wizard steps with preview between stages (ai-d6). */
export function buildWizardSteps(planDiff: WizardPlanStep[]): WizardStepView[] {
  return planDiff.map((step, index) => ({
    ...step,
    index,
    status: index === 0 ? 'current' : 'pending',
  }));
}

export function advanceWizardStep(
  steps: WizardStepView[],
  currentIndex: number,
): WizardStepView[] {
  return steps.map((step, index) => {
    if (index < currentIndex) return { ...step, status: 'done' };
    if (index === currentIndex) return { ...step, status: 'current' };
    return { ...step, status: 'pending' };
  });
}

export function isWizardComplete(currentIndex: number, total: number): boolean {
  return currentIndex >= total - 1;
}
